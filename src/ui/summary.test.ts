// 小结重做单测（v4-M2''' 2.4，plan/v4/02 §七 + ▸ M2''' 增补）：时代卡归段 / 三观位移（含时代卡、不含漂移）/
// 三轴区间词 + 独白接线（monologues）/ 阶段跨度 / 本阶段关键抉择。纯函数直测，零 DOM。
import { describe, expect, it } from "vitest";
import eventsRaw from "../data/events.json";
import eraRaw from "../data/era-events.json";
import { createRun } from "../engine/engine";
import type { GameEvent } from "../engine/model";
import type { RunState } from "../engine/model";
import {
  entryStages,
  stageCriticals,
  stageSpan,
  stageValuesShift,
  valuesNotes,
  VALUES_BAND_WORD,
} from "./logic";
import monologuesRaw from "../data/monologues.json";

const events = eventsRaw as unknown as GameEvent[];
const eraEvents = eraRaw as unknown as Array<{ id: string; deltas3?: Record<string, number> }>;
const monologues = monologuesRaw as unknown as Record<string, Record<string, string>>;

const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };
const base = (): RunState => ({ ...createRun(ENV, 42) });

describe("entryStages（history 阶段归属：时代卡随其后首张非时代事件归段）", () => {
  it("时代卡夹在同阶段事件之间 → 归该阶段；末尾悬挂 → 归当前推进阶段", () => {
    const infantA = events.find((e) => e.stage === "infant")!;
    const infantB = events.find((e) => e.stage === "infant" && e.id !== infantA.id)!;
    const toddler = events.find((e) => e.stage === "toddler")!;
    const state = base();
    state.history = [
      { eventId: infantA.id, option: 0, dimsAfter: state.dims },
      { eventId: "era-any", option: -1, dimsAfter: state.dims, kind: "era" },
      { eventId: infantB.id, option: 0, dimsAfter: state.dims },
      { eventId: toddler.id, option: 0, dimsAfter: state.dims },
    ];
    expect(entryStages(state)).toEqual(["infant", "infant", "infant", "toddler"]);
    const trailing = base();
    trailing.history = [
      { eventId: infantA.id, option: 0, dimsAfter: trailing.dims },
      { eventId: "era-any", option: -1, dimsAfter: trailing.dims, kind: "era" },
    ];
    expect(entryStages(trailing)).toEqual(["infant", "infant"]);
  });
});

describe("stageValuesShift（本阶段三观位移：选项 + 时代卡，不含阶段漂移）", () => {
  it("求和口径 = 阶段内选项 deltas3 + 时代卡 deltas3", () => {
    const state = base();
    const stage = "teen";
    const ev = events.find((e) => e.stage === stage && (e.options[0]?.deltas3?.worldview ?? 0) > 0)!;
    const other = events.find(
      (e) => e.stage === stage && e.id !== ev.id && (e.options[0]?.deltas3?.worldview ?? 0) !== 0,
    )!;
    const era = eraEvents.find((e) => (e.deltas3?.worldview ?? 0) !== 0)!;
    const expectW =
      (ev.options[0]!.deltas3!.worldview ?? 0) +
      (other.options[0]!.deltas3!.worldview ?? 0) +
      (era.deltas3!.worldview ?? 0);
    state.history = [
      { eventId: events.find((e) => e.stage === "infant")!.id, option: 0, dimsAfter: state.dims },
      { eventId: ev.id, option: 0, dimsAfter: state.dims },
      { eventId: era.id, option: -1, dimsAfter: state.dims, kind: "era" },
      { eventId: other.id, option: 0, dimsAfter: state.dims },
    ];
    const shift = stageValuesShift(state, stage);
    expect(shift.worldview).toBe(expectW);
    // 空阶段零位移
    expect(stageValuesShift(state, "elder")).toEqual({});
  });
});

describe("valuesNotes（三轴区间词 + 位移箭头 + 独白接线，02 §七）", () => {
  const state = base();
  state.values3 = { worldview: 80, outlook: 20, values: 50 };
  const notes = valuesNotes(state, "infant");

  it("三轴各一行：区间词按 <35/35–65/>65 取档，独白接线 monologues 表同档文案", () => {
    expect(notes.map((n) => n.bandWord)).toEqual([
      VALUES_BAND_WORD.worldview.high,
      VALUES_BAND_WORD.outlook.low,
      VALUES_BAND_WORD.values.mid,
    ]);
    expect(notes[0]!.monologue).toBe(monologues.worldview!.high);
    expect(notes[1]!.monologue).toBe(monologues.outlook!.low);
    expect(notes[2]!.monologue).toBe(monologues.values!.mid);
  });

  it("零位移 → 箭头 →；正负 → ↑/↓（数值为绝对值）", () => {
    expect(notes.every((n) => n.arrow === "→" && n.shift === 0)).toBe(true);
  });

  it("边界：34 低 / 35 中 / 65 中 / 66 高", () => {
    const probe = base();
    probe.history = [];
    probe.values3 = { worldview: 34, outlook: 35, values: 66 };
    const banded = valuesNotes(probe, "infant");
    expect(banded.map((n) => n.bandWord)).toEqual([
      VALUES_BAND_WORD.worldview.low,
      VALUES_BAND_WORD.outlook.mid,
      VALUES_BAND_WORD.values.high,
    ]);
  });
});

describe("stageSpan（阶段主题头：年代区间 + 年龄段）", () => {
  it("单事件阶段 → 单值；多事件 → 首末区间（年份 = birthYear + 月龄/12）", () => {
    const state = base();
    const a = events.find((e) => e.stage === "teen")!;
    const span0 = stageSpan({ ...state, history: [{ eventId: a.id, option: 0, dimsAfter: state.dims }] }, "teen");
    expect(span0.yearRange).toBe(`${state.birthYear + Math.floor(a.ageMonths / 12)} 年`);
    expect(span0.ageRange).toBe(a.ageHint);
    const bs = events.filter((e) => e.stage === "teen" && e.type !== "critical");
    const first = bs[0]!;
    const last = bs[bs.length - 1]!;
    const span1 = stageSpan(
      { ...state, history: [first, last].map((e) => ({ eventId: e.id, option: 0, dimsAfter: state.dims })) },
      "teen",
    );
    const y1 = state.birthYear + Math.floor(first.ageMonths / 12);
    const y2 = state.birthYear + Math.floor(last.ageMonths / 12);
    expect(span1.yearRange).toBe(y1 === y2 ? `${y1} 年` : `${y1}–${y2} 年`);
    expect(span1.ageRange).toBe(`${first.ageHint}–${last.ageHint}`);
  });

  it("空阶段返回空串（不渲染跨度句的哨兵）", () => {
    expect(stageSpan(base(), "elder")).toEqual({ yearRange: "", ageRange: "" });
  });
});

describe("stageCriticals（本阶段关键抉择回顾；时代卡不计入）", () => {
  it("只收阶段内 critical 事件并带所选选项文本", () => {
    const state = base();
    const critical = events.find((e) => e.stage === "teen" && e.type === "critical")!;
    const normal = events.find((e) => e.stage === "teen" && e.type !== "critical")!;
    state.history = [
      { eventId: normal.id, option: 0, dimsAfter: state.dims },
      { eventId: critical.id, option: 1, dimsAfter: state.dims },
    ];
    const list = stageCriticals(state, "teen");
    expect(list.length).toBe(1);
    expect(list[0]!.event.id).toBe(critical.id);
    expect(list[0]!.optionText).toBe(critical.options[1]!.text);
    expect(stageCriticals(state, "infant")).toEqual([]);
  });
});
