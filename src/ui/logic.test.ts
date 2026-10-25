import { describe, expect, it } from "vitest";
import {
  advanceStage,
  applyChoice,
  createRun,
  initialDimsOf,
  mbtiLetters,
  optionAvailable,
  pickEvent,
} from "../engine/engine";
import { STAGES, type Ending, type RunState } from "../engine/model";
import {
  criticalChoices,
  dimsAtStageStart,
  endingLetters,
  stageDeltas,
  stageEntries,
  stageOf,
} from "./logic";

const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };

// 确定性选择：按已决事件数奇偶交替，覆盖两条选项路径；首选被资源门槛锁定时回退到首个可用项
const seeded = (state: RunState): number => state.history.length % 2;

function driveToEnd(start: RunState): RunState {
  let state = start;
  while (state.stageIndex < STAGES.length) {
    const event = pickEvent(state);
    if (!event) {
      state = advanceStage(state);
      continue;
    }
    const pref = seeded(state);
    const idx = optionAvailable(state, event, pref)
      ? pref
      : event.options.findIndex((_, i) => optionAvailable(state, event, i));
    state = applyChoice(state, idx);
  }
  return state;
}

describe("stageOf / stageEntries（history 无阶段字段，靠 eventById 反查）", () => {
  it("事件 id → 阶段；未知 id → undefined", () => {
    expect(stageOf("teen-002")).toBe("teen");
    expect(stageOf("nope-999")).toBeUndefined();
  });

  it("全程跑完后每阶段至少 1 次抉择，聚合计数总和 = history 长度", () => {
    const state = driveToEnd(createRun(ENV, 42));
    const perStage = STAGES.map((s) => stageEntries(state.history, s).length);
    expect(perStage.every((n) => n >= 1)).toBe(true);
    expect(perStage.reduce((a, b) => a + b, 0)).toBe(state.history.length);
  });
});

describe("dimsAtStageStart / stageDeltas（阶段小结数据源）", () => {
  it("第 0 阶段起点 = 出生初始值；第 k 阶段起点 = 上一阶段末次 dimsAfter", () => {
    const state = driveToEnd(createRun(ENV, 7));
    expect(dimsAtStageStart(state, "infant")).toEqual(initialDimsOf(state));
    for (let k = 1; k < STAGES.length; k++) {
      const prev = STAGES[k - 1]!;
      const entries = stageEntries(state.history, prev);
      const last = entries[entries.length - 1]!.dimsAfter;
      expect(dimsAtStageStart(state, STAGES[k]!)).toEqual(last);
    }
  });

  it("刷新续局等价：state 经 JSON 往返后聚合结果逐字段不变", () => {
    const state = driveToEnd(createRun(ENV, 7));
    const restored = JSON.parse(JSON.stringify(state)) as RunState;
    for (const stage of STAGES) {
      expect(stageDeltas(restored, stage)).toEqual(stageDeltas(state, stage));
      expect(dimsAtStageStart(restored, stage)).toEqual(dimsAtStageStart(state, stage));
    }
  });

  it("stageDeltas = 阶段末值 − 阶段起点", () => {
    const state = driveToEnd(createRun(ENV, 9));
    for (const stage of STAGES) {
      const entries = stageEntries(state.history, stage);
      const start = dimsAtStageStart(state, stage);
      const last = entries[entries.length - 1]?.dimsAfter ?? start;
      expect(stageDeltas(state, stage)).toEqual({
        ei: last.ei - start.ei,
        sn: last.sn - start.sn,
        tf: last.tf - start.tf,
        jp: last.jp - start.jp,
      });
    }
  });
});

describe("endingLetters（终局字母口径，plan/02 §一）", () => {
  const bare: Ending = { id: "test-bare", title: "x", text: "y", retrospect: [] };

  it("有 typeText 的结局直接采用", () => {
    const state = createRun(ENV, 1);
    expect(endingLetters({ ...bare, typeText: "ENTJ" }, state)).toBe("ENTJ");
  });

  it("兜底结局（无 typeText）按四维实算字母", () => {
    const state = driveToEnd(createRun(ENV, 3));
    expect(endingLetters(bare, state)).toBe(mbtiLetters(state.dims, state.env, state.profile));
  });
});

describe("criticalChoices（终局关键抉择回顾）", () => {
  it("只收 critical 事件，选项文本与玩家所选项一致", () => {
    const state = driveToEnd(createRun(ENV, 5));
    const reviews = criticalChoices(state.history);
    expect(reviews.length).toBeGreaterThanOrEqual(1);
    for (const r of reviews) {
      expect(r.event.type).toBe("critical");
      const chosen = state.history.find((h) => h.eventId === r.event.id)!.option;
      expect(r.optionText).toBe(r.event.options[chosen]!.text);
    }
  });
});
