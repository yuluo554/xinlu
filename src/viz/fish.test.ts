import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import moodMap from "../data/fish-mood-map.json" with { type: "json" };
import endings from "../data/endings.json" with { type: "json" };
import { STAGES, type Dims } from "../engine/model";
import { createFishParams, endingFrame, FRAMES, pickChoiceFrame, renderFish, stageFrame } from "./fish";

// 最小 SVG DOM 桩(同 viz.test.ts):fish 渲染只依赖 createElementNS / setAttribute /
// appendChild / textContent 四个面,桩足以断言结构与属性(plan/v2/03 §2 验收)。
class StubEl {
  readonly tag: string;
  readonly attrs = new Map<string, string>();
  readonly children: StubEl[] = [];
  textContent = "";
  constructor(tag: string) {
    this.tag = tag;
  }
  setAttribute(name: string, value: string): void {
    this.attrs.set(name, String(value));
  }
  appendChild(child: StubEl): StubEl {
    this.children.push(child);
    return child;
  }
  serialize(): string {
    const attrs = [...this.attrs.entries()].map(([k, v]) => ` ${k}="${v}"`).join("");
    return `<${this.tag}${attrs}>${this.textContent}${this.children.map((c) => c.serialize()).join("")}</${this.tag}>`;
  }
  all(tag: string): StubEl[] {
    const out: StubEl[] = [];
    for (const c of this.children) {
      if (c.tag === tag) out.push(c);
      out.push(...c.all(tag));
    }
    return out;
  }
  byClass(cls: string): StubEl[] {
    const out: StubEl[] = [];
    const walk = (node: StubEl): void => {
      const klass = node.attrs.get("class") ?? "";
      if (klass.split(/\s+/).includes(cls)) out.push(node);
      node.children.forEach(walk);
    };
    walk(this);
    return out;
  }
}

let host: StubEl;

beforeEach(() => {
  host = new StubEl("div");
  vi.stubGlobal("document", {
    createElementNS: (_ns: string, tag: string) => new StubEl(tag),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const el = () => host as unknown as Element;
const dims = (ei: number, sn: number, tf: number, jp: number): Dims => ({ ei, sn, tf, jp });
const MID = createFishParams(dims(50, 50, 50, 50));

describe("createFishParams(v2/02 §一参数表)", () => {
  it("ei 线性:activity 0/0.5/1,idle 间隔 1600/1100/600,位移 4/10/16", () => {
    for (const [ei, act] of [
      [0, 0],
      [50, 0.5],
      [100, 1],
    ] as const) {
      const p = createFishParams(dims(ei, 50, 50, 50));
      expect(p.activity).toBe(act);
      expect(p.idleIntervalMs).toBe(1600 - act * 1000);
      expect(p.moveAmplitude).toBe(4 + act * 12);
    }
  });

  it("tf 三段:<40 thoughtful / 40–60 含端点 neutral / >60 warm", () => {
    expect(createFishParams(dims(50, 50, 0, 50)).mood).toBe("thoughtful");
    expect(createFishParams(dims(50, 50, 39, 50)).mood).toBe("thoughtful");
    expect(createFishParams(dims(50, 50, 40, 50)).mood).toBe("neutral");
    expect(createFishParams(dims(50, 50, 60, 50)).mood).toBe("neutral");
    expect(createFishParams(dims(50, 50, 61, 50)).mood).toBe("warm");
    expect(createFishParams(dims(50, 50, 100, 50)).mood).toBe("warm");
  });

  it("sn:氛围层显隐、饱和度 0.7+sn/100、鱼群 round(2+(100−sn)/25) 全域 2–6", () => {
    const s0 = createFishParams(dims(50, 0, 50, 50)).ambience;
    expect(s0).toEqual({ visible: true, saturation: 0.7, school: 6 });
    const s49 = createFishParams(dims(50, 49, 50, 50)).ambience;
    expect(s49).toEqual({ visible: true, saturation: 1.19, school: 4 });
    const s50 = createFishParams(dims(50, 50, 50, 50)).ambience;
    expect(s50).toEqual({ visible: false, saturation: 1.2, school: 4 });
    const s100 = createFishParams(dims(50, 100, 50, 50)).ambience;
    expect(s100).toEqual({ visible: false, saturation: 1.7, school: 2 });
  });

  it("jp:圆角 20−jp×0.12,栅格间距 8+jp×0.16", () => {
    expect(createFishParams(dims(50, 50, 50, 0)).orderliness).toEqual({ radius: 20, gap: 8 });
    expect(createFishParams(dims(50, 50, 50, 50)).orderliness).toEqual({ radius: 14, gap: 16 });
    expect(createFishParams(dims(50, 50, 50, 100)).orderliness).toEqual({ radius: 8, gap: 24 });
  });

  it("确定性:同输入两次调用结果全等", () => {
    const a = createFishParams(dims(72, 33, 81, 47));
    const b = createFishParams(dims(72, 33, 81, 47));
    expect(a).toEqual(b);
  });

  it("NaN 回落中位值 50 的参数集;越界钳制到 [0,100]", () => {
    const allNaN = createFishParams({ ei: Number.NaN, sn: Number.NaN, tf: Number.NaN, jp: Number.NaN } as Dims);
    expect(allNaN).toEqual(MID);
    const bad = createFishParams({ ei: 999, sn: -20, tf: Number.NaN, jp: undefined } as unknown as Dims);
    expect(bad).toEqual(createFishParams(dims(100, 0, 50, 50)));
    expect(bad.activity).toBe(1);
    expect(bad.ambience.saturation).toBe(0.7);
  });
});

describe("fish-mood-map 结构(02 §二口径)", () => {
  const frames = moodMap.frames as Record<string, { seg: string; dir: string; hint: string }>;
  const frameNames = Object.keys(frames);

  it("19/19 帧全覆盖,且与 fish.ts 的 FRAMES 绑定集合相等", () => {
    expect(frameNames).toHaveLength(19);
    expect([...Object.keys(FRAMES)].sort()).toEqual([...frameNames].sort());
    for (const k of frameNames) expect(FRAMES[k]).toBeTruthy();
  });

  it("seg/dir 枚举合法,三向候选各 ≥1", () => {
    const SEGS = ["thoughtful", "neutral", "warm"];
    const DIRS = ["pos", "neg", "neutral"];
    for (const f of Object.values(frames)) {
      expect(SEGS).toContain(f.seg);
      expect(DIRS).toContain(f.dir);
    }
    for (const dir of DIRS) {
      expect(frameNames.filter((k) => frames[k]!.dir === dir).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("stage:8 阶段全覆盖,每阶段 1–2 张,帧 ⊆ frames", () => {
    const stage = moodMap.stage as Record<string, string[]>;
    expect(Object.keys(stage).sort()).toEqual([...STAGES].sort());
    for (const list of Object.values(stage)) {
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.length).toBeLessThanOrEqual(2);
      for (const k of list) expect(frameNames).toContain(k);
    }
  });

  it("ending:9 结局全覆盖(键 ⊆ endings.json id),帧两两不重复且 ⊆ frames", () => {
    const ending = moodMap.ending as Record<string, string>;
    const ids = endings.map((e) => e.id).sort();
    expect(Object.keys(ending).sort()).toEqual(ids);
    const locked = Object.values(ending);
    expect(new Set(locked).size).toBe(locked.length);
    for (const k of locked) expect(frameNames).toContain(k);
  });

  it("stageFrame / endingFrame 锁表取帧;未知 id 兜底", () => {
    expect(stageFrame("infant")).toBe("07");
    expect(endingFrame("end-05")).toBe("06");
    expect(endingFrame("no-such")).toBe("01");
  });
});

describe("pickChoiceFrame(02 §二 choice 口径)", () => {
  it("同种子恒同帧,结果 ∈ frames", () => {
    const a = pickChoiceFrame("pos", "warm", 12345);
    const b = pickChoiceFrame("pos", "warm", 12345);
    expect(a).toBe(b);
    expect(Object.keys(moodMap.frames as object)).toContain(a);
  });

  it("seg 命中 mood 的候选优先(dir=pos & mood=warm → 只回 warm 系)", () => {
    for (let seed = 0; seed < 40; seed++) {
      const f = pickChoiceFrame("pos", "warm", seed);
      expect((moodMap.frames as Record<string, { seg: string }>)[f]!.seg).toBe("warm");
    }
  });

  it("seg 无候选时回落同向全集(dir=neg & mood=neutral → 仍为 neg 帧)", () => {
    const f = pickChoiceFrame("neg", "neutral", 7);
    expect((moodMap.frames as Record<string, { dir: string }>)[f]!.dir).toBe("neg");
  });
});

describe("renderFish(viz 收窄面)", () => {
  it("待机态:fish-idle 主体 + CSS 变量注入(activity 驱动间隔与幅度)", () => {
    renderFish(createFishParams(dims(50, 80, 50, 50)), el());
    const svg = host.children[0]!;
    expect(svg.tag).toBe("svg");
    expect(svg.attrs.get("class")).toBe("fish-mascot");
    expect(svg.byClass("fish-idle")).toHaveLength(1);
    const body = svg.byClass("fish-idle")[0]!;
    expect(body.attrs.get("style")).toBe("--fish-dur:1100ms;--fish-amp:10.0px");
    expect(svg.byClass("fish-ambience")).toHaveLength(0); // sn=80 ≥ 50 隐藏
  });

  it("表情帧态:fish-still 主体显示指定帧,aria 带表情语义", () => {
    renderFish(MID, el(), "04");
    const svg = host.children[0]!;
    expect(svg.byClass("fish-still")).toHaveLength(1);
    const img = svg.byClass("fish-frame")[0]!;
    expect(img.attrs.get("href")).toBe(FRAMES["04"]);
    expect(svg.attrs.get("aria-label")).toContain("大笑");
  });

  it("氛围层:sn<50 显示,saturate 滤镜 + 鱼群数量=school", () => {
    renderFish(createFishParams(dims(50, 20, 50, 50)), el()); // school=round(6.4)=6? sn=20 → round(2+80/25)=round(5.2)=5
    const svg = host.children[0]!;
    const amb = svg.byClass("fish-ambience");
    expect(amb).toHaveLength(1);
    expect(amb[0]!.attrs.get("style")).toBe("filter:saturate(0.90)");
    expect(amb[0]!.byClass("fish-school")).toHaveLength(5);
  });

  it("脏值不落 NaN:序列化输出无 NaN/undefined", () => {
    renderFish(createFishParams({ ei: Number.NaN, sn: Number.NaN, tf: Number.NaN, jp: Number.NaN } as Dims), el());
    expect(host.children[0]!.serialize()).not.toMatch(/NaN|undefined/);
  });
});

// K 纪律:fish.ts 无 16 型字面量分支——16 型是四维区间的派生结果,不进代码(plan/v2/02 §一)。
describe("无 16 型字面量(源码 grep 守护)", () => {
  it("fish.ts 源文本中 16 型缩写零命中", () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "fish.ts"), "utf8");
    const MBTI_LITERALS = /\b(ISTJ|ISFJ|INFJ|INTJ|ISTP|ISFP|INFP|INTP|ESTP|ESFP|ENFP|ENTP|ESTJ|ESFJ|ENFJ|ENTJ)\b/;
    expect(MBTI_LITERALS.test(src)).toBe(false);
  });
});
