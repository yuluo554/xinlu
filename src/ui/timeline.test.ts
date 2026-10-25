import { describe, expect, it } from "vitest";
import eventsRaw from "../data/events.json";
import { createRun, pickEvent, applyChoice, advanceStage, eventById } from "../engine/engine";
import { STAGES, type HistoryEntry, type RunState } from "../engine/model";
import { timelineVM, resourceFloats, valueFloats, choiceFloats, RES_META } from "./timeline";
import { EVENT_ICONS, iconUrl } from "./icons";

const events = eventsRaw as unknown as Array<{ id: string }>;

const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };

describe("timelineVM（八段轨道视图模型，v4-M2''' D6=A 阶段级聚合）", () => {
  it("恒为 8 段，状态按 stageIndex 三分：done / now / future", () => {
    const state = createRun(ENV, 42);
    const segs = timelineVM(state);
    expect(segs.length).toBe(8);
    expect(segs[0]!.status).toBe("now");
    expect(segs.slice(1).every((s) => s.status === "future")).toBe(true);
    expect(segs.map((s) => s.stage)).toEqual([...STAGES]);
  });

  it("阶段计数聚合：count 按事件所属阶段归段（总量 = history 长），criticalCount 单列", () => {
    let state = createRun(ENV, 42);
    for (let i = 0; i < 6; i++) {
      const event = pickEvent(state);
      if (!event) break;
      state = applyChoice(state, 0);
    }
    const segs = timelineVM(state);
    expect(segs.reduce((a, s) => a + s.count, 0)).toBe(state.history.length);
    const criticals = state.history.filter((h) => eventById(h.eventId)?.type === "critical").length;
    expect(segs.reduce((a, s) => a + s.criticalCount, 0)).toBe(criticals);
    // 每段 dots = min(count, 5)（移动端小点封顶口径）
    for (const s of segs) expect(s.dots).toBe(Math.min(s.count, 5));
  });

  it("时代卡计入当前推进阶段（末尾悬挂口径，plan/v4/02 §七 ▸ M2''' 增补）", () => {
    let state = createRun(ENV, 42);
    const event = pickEvent(state);
    if (event) state = applyChoice(state, 0);
    const eraEntry: HistoryEntry = {
      eventId: "era-1995-dummy",
      option: -1,
      dimsAfter: { ...state.dims },
      kind: "era",
    };
    const withEra: RunState = { ...state, history: [...state.history, eraEntry] };
    const segs = timelineVM(withEra);
    expect(segs.reduce((a, s) => a + s.count, 0)).toBe(withEra.history.length);
    expect(segs[0]!.count).toBe(timelineVM(state)[0]!.count + 1);
  });

  it("dots 封顶：单阶段 >5 事件时渲染点数恒 5", () => {
    const state = createRun(ENV, 42);
    const fake: RunState = {
      ...state,
      history: Array.from({ length: 9 }, () => state.history[0] ?? { eventId: events[0]!.id, option: 0, dimsAfter: state.dims }),
    };
    expect(timelineVM(fake)[0]!.dots).toBe(5);
    expect(timelineVM(fake)[0]!.count).toBe(9);
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

describe("resourceFloats（资源浮动文案；mood/health 原始点数、money 换算元，v4/02 §四）", () => {
  it("非零项带符号（+/−），零项不出现；键序 mood/money/health；money 按档换算口语", () => {
    expect(resourceFloats({ mood: 5, money: -3 }, "90s")).toEqual([
      { text: "心境 +5", cls: "up" },
      { text: "积蓄 −¥2,500", cls: "down" },
    ]);
    expect(resourceFloats({}, "90s")).toEqual([]);
    expect(resourceFloats({ health: 0, mood: -10 }, "80s")).toEqual([{ text: "心境 −10", cls: "down" }]);
  });

  it("同一点数在不同年代段换算不同（购买力实感）：−1 点 60s→¥20 / 10s→¥10,000", () => {
    expect(resourceFloats({ money: -1 }, "60s")).toEqual([{ text: "积蓄 −¥20", cls: "down" }]);
    expect(resourceFloats({ money: -1 }, "10s")).toEqual([{ text: "积蓄 −¥10,000", cls: "down" }]);
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
    const floats = choiceFloats({ worldview: 1, outlook: -1 }, { mood: 2, money: -1, health: 3 }, "80s");
    expect(floats).toEqual([
      { text: "心境 +2", cls: "up" },
      { text: "积蓄 −¥200", cls: "down" },
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
    expect(ids.length).toBe(events.length); // 全库覆盖（随事件库增长同步，不做硬编码）
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
