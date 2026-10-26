import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Dims, HistoryEntry } from "../engine/model";
import { renderCurve, thin } from "./curve";
import { renderRadar } from "./radar";

// 最小 SVG DOM 桩：viz 只依赖 createElementNS / setAttribute / appendChild / textContent 四个面，
// 桩足以断言「渲染出 svg 节点」与「属性值中不出现 NaN」（plan/03 §5 验收）。
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
const DIMS: Dims = { ei: 60, sn: 40, tf: 75, jp: 50 };

describe("renderRadar", () => {
  it("冒烟：渲染出 svg 根节点并挂到容器（含 viewBox 与 aria-label）", () => {
    renderRadar(DIMS, el());
    const svg = host.children[0]!;
    expect(svg.tag).toBe("svg");
    expect(svg.attrs.get("viewBox")).toBe("0 0 240 240");
    expect(svg.attrs.get("class")).toBe("viz-radar");
    expect(svg.attrs.get("aria-label")).toContain("E-I 60");
  });

  it("历史淡影：past 每组画一个 ghost 多边形，当前值只有一条实线", () => {
    renderRadar(DIMS, el(), [
      { ei: 50, sn: 50, tf: 50, jp: 50 },
      { ei: 55, sn: 45, tf: 60, jp: 48 },
    ]);
    expect(host.byClass("radar-ghost")).toHaveLength(2);
    expect(host.byClass("radar-now")).toHaveLength(1);
    expect(host.byClass("radar-dot")).toHaveLength(4);
  });

  it("值域越界/非法值不产生 NaN 属性，且钳到 [0,100]", () => {
    const bad = { ei: Number.NaN, sn: 150, tf: -20, jp: undefined } as unknown as Dims;
    renderRadar(bad, el());
    const text = host.children[0]!.serialize();
    expect(text).not.toMatch(/NaN|undefined/);
    // 布局常量：CENTER=120，RADIUS=88；ei=NaN→50（上轴 76）、sn=150→100（右轴 208）、
    // tf=-20→0（回到圆心）、jp=undefined→50（左轴 76）
    const now = host.byClass("radar-now")[0]!;
    expect(now.attrs.get("points")).toBe("120.00,76.00 208.00,120.00 120.00,120.00 76.00,120.00");
  });
});

describe("renderCurve", () => {
  const history: HistoryEntry[] = [
    { eventId: "a", option: 0, dimsAfter: { ei: 55, sn: 45, tf: 52, jp: 48 } },
    { eventId: "b", option: 1, dimsAfter: { ei: 58, sn: 43, tf: 55, jp: 51 } },
  ];

  it("冒烟：渲染出 svg 与四条系列折线（含 initial 起点）", () => {
    renderCurve(history, el(), { ei: 51, sn: 52, tf: 50, jp: 54 });
    const svg = host.children[0]!;
    expect(svg.tag).toBe("svg");
    expect(svg.attrs.get("class")).toBe("viz-curve");
    expect(host.all("polyline")).toHaveLength(4);
    expect(svg.serialize()).not.toMatch(/NaN|undefined/);
  });

  it("空历史且无 initial：仍渲染 svg（只有参考线），无 NaN", () => {
    renderCurve([], el());
    const svg = host.children[0]!;
    expect(svg.tag).toBe("svg");
    expect(host.all("polyline")).toHaveLength(0);
    expect(svg.serialize()).not.toMatch(/NaN|undefined/);
  });

  it("越界值钳制到画布内：y 不越出上下边（top=14，bottom=14+160=174）", () => {
    const badHistory = [
      { eventId: "x", option: 0, dimsAfter: { ei: 999, sn: -999, tf: Number.NaN, jp: 0 } },
    ] as unknown as HistoryEntry[];
    renderCurve(badHistory, el());
    const svg = host.children[0]!;
    expect(svg.serialize()).not.toMatch(/NaN|undefined/);
    const points = (cls: string) => host.byClass(cls)[0]!.attrs.get("points")!;
    expect(points("curve-ei")).toBe("175.00,14.00"); // 999 → 100 → 顶边
    expect(points("curve-sn")).toBe("175.00,174.00"); // -999 → 0 → 底边
    expect(points("curve-tf")).toBe("175.00,94.00"); // NaN → 50 → 中位
  });
});

describe("thin（曲线抽稀：保形，不抹平拐点）", () => {
  const seq = (n: number): Dims[] =>
    Array.from({ length: n }, (_, i) => ({ ei: 50 + i, sn: 50, tf: 50, jp: 50 }));

  it("短序列原样返回（不抽样、不复制错位）", () => {
    const s = seq(10);
    expect(thin(s)).toEqual(s);
  });

  it("长序列抽到上限附近，首末点必留", () => {
    const s = seq(400);
    const t = thin(s, 40);
    expect(t.length).toBeLessThanOrEqual(40);
    expect(t[0]).toEqual(s[0]);
    expect(t[t.length - 1]).toEqual(s[399]);
  });

  it("孤立的极值点不被抹平（拐点优先于平滑）", () => {
    const s = seq(300);
    s[150] = { ei: 2, sn: 2, tf: 2, jp: 2 }; // 一处深谷
    const t = thin(s, 30);
    expect(t.some((d) => d.ei === 2)).toBe(true);
  });

  it("空序列与单点不崩", () => {
    expect(thin([])).toEqual([]);
    expect(thin(seq(1))).toEqual(seq(1));
  });
});
