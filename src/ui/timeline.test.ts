import { describe, expect, it } from "vitest";
import { createRun, pickEvent, applyChoice, advanceStage, eventById } from "../engine/engine";
import { STAGES, type RunState } from "../engine/model";
import { timelineVM, resourceFloats, valueFloats, choiceFloats, LINE_META, RES_META } from "./timeline";
import { EVENT_ICONS, iconUrl } from "./icons";

const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };

describe("timelineVM（八段轨道视图模型）", () => {
  it("恒为 8 段，状态按 stageIndex 三分：done / now / future", () => {
    const state = createRun(ENV, 42);
    const segs = timelineVM(state);
    expect(segs.length).toBe(8);
    expect(segs[0]!.status).toBe("now");
    expect(segs.slice(1).every((s) => s.status === "future")).toBe(true);
    expect(segs.map((s) => s.stage)).toEqual([...STAGES]);
  });

  it("history 逐条映射为所在阶段的线别色点；critical 事件带环标记", () => {
    let state = createRun(ENV, 42);
    for (let i = 0; i < 6; i++) {
      const event = pickEvent(state);
      if (!event) break;
      state = applyChoice(state, 0);
    }
    const segs = timelineVM(state);
    const dotsPerStage = segs.map((s) => s.nodes.length);
    expect(dotsPerStage.reduce((a, b) => a + b, 0)).toBe(state.history.length);
    // 每个点都能回溯到对应事件
    const flat = segs.flatMap((s) => s.nodes);
    const byStageLine = state.history.map((h) => {
      const ev = eventById(h.eventId)!;
      return { line: ev.line, critical: ev.type === "critical" };
    });
    expect(flat).toEqual(byStageLine);
    expect(flat.every((n) => LINE_META[n.line])).toBe(true);
  });

  it("阶段推进后 old 阶段翻 done、下一阶段翻 now（刷新续局等价）", () => {
    let state = createRun(ENV, 42);
    for (;;) {
      const event = pickEvent(state);
      state = event ? applyChoice(state, 0) : advanceStage(state);
      if (state.stageIndex >= 1) break;
    }
    const restored = JSON.parse(JSON.stringify(state)) as RunState;
    expect(timelineVM(restored)).toEqual(timelineVM(state));
    const segs = timelineVM(state);
    expect(segs[0]!.status).toBe("done");
    expect(segs[1]!.status).toBe("now");
  });
});

describe("resourceFloats（资源浮动文案，v3/02 §三）", () => {
  it("非零项带符号（+/−），零项不出现；键序 mood/money/health", () => {
    expect(resourceFloats({ mood: 5, money: -3 })).toEqual([
      { text: "心境 +5", cls: "up" },
      { text: "积蓄 −3", cls: "down" },
    ]);
    expect(resourceFloats({})).toEqual([]);
    expect(resourceFloats({ health: 0, mood: -10 })).toEqual([{ text: "心境 −10", cls: "down" }]);
  });
});

describe("valueFloats（三观方向词，三观数值不直接示人）", () => {
  it("正增量 → 高端词（感应/安然/共情），负增量 → 低端词（理性/进取/原则）", () => {
    expect(valueFloats({ worldview: 2, outlook: -1, values: 3 })).toEqual([
      { text: "世界观 → 感应", cls: "up" },
      { text: "人生观 → 进取", cls: "down" },
      { text: "价值观 → 共情", cls: "up" },
    ]);
    expect(valueFloats({})).toEqual([]);
  });

  it("浮动文案不携带数值（口径：三观只给方向）", () => {
    for (const f of valueFloats({ worldview: -3, outlook: 2, values: -1 })) {
      expect(/\d/.test(f.text)).toBe(false);
    }
  });
});

describe("choiceFloats（一次选择的合并浮动，资源在前三观在后）", () => {
  it("资源 + 三观合并，总量受动效预算约束 ≤6 条", () => {
    const floats = choiceFloats({ worldview: 1, outlook: -1 }, { mood: 2, money: -1, health: 3 });
    expect(floats).toEqual([
      { text: "心境 +2", cls: "up" },
      { text: "积蓄 −1", cls: "down" },
      { text: "健康 +3", cls: "up" },
      { text: "世界观 → 感应", cls: "up" },
      { text: "人生观 → 进取", cls: "down" },
    ]);
    expect(floats.length).toBeLessThanOrEqual(6);
  });
});

describe("图标注册表（icons.ts，对照表单源 icon-map.json）", () => {
  it("每个事件的图标名都能解析到真实 SVG URL（vite glob 全量入库）", () => {
    const ids = Object.keys(EVENT_ICONS);
    expect(ids.length).toBe(175);
    for (const id of ids) {
      const name = EVENT_ICONS[id]!;
      expect(name, id).toMatch(/^[a-z0-9-]+$/);
      expect(iconUrl(name), `${id} → ${name}`).not.toBe("");
    }
  });

  it("状态条三资源图标在位", () => {
    for (const key of Object.keys(RES_META) as Array<keyof typeof RES_META>) {
      expect(iconUrl(RES_META[key]!.icon), key).not.toBe("");
    }
  });
});
