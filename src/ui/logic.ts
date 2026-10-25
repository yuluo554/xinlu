// 视图逻辑（纯函数，无 DOM）：阶段聚合、阶段起点四维、终局字母口径与关键抉择回顾（plan/03 §4）。
// 阶段信息不入存档（schema v1 冻结），一律由 history.eventId → eventById 反查派生；
// 因此刷新续局后这些函数在同一个 state 上算出同样的结果。
import { eventById, initialDimsOf, mbtiLetters } from "../engine/engine";
import {
  DIM_KEYS,
  STAGES,
  type DimKey,
  type Dims,
  type Ending,
  type GameEvent,
  type HistoryEntry,
  type RunState,
  type Stage,
} from "../engine/model";

/** 阶段显示名（UI 文案）。年龄段口径不入 UI：卡片只展示事件自带的 ageHint。 */
export const STAGE_LABEL: Record<Stage, string> = {
  infant: "婴儿期",
  toddler: "幼儿期",
  childhood: "童年",
  teen: "少年",
  youth: "青年",
  adult: "壮年",
  midlife: "中年",
  elder: "老年",
};

export const DIM_SHORT: Record<DimKey, string> = { ei: "E/I", sn: "S/N", tf: "T/F", jp: "J/P" };

export function stageOf(eventId: string): Stage | undefined {
  return eventById(eventId)?.stage;
}

/** 某阶段的全部已决事件（按发生序）。 */
export function stageEntries(history: readonly HistoryEntry[], stage: Stage): HistoryEntry[] {
  return history.filter((h) => stageOf(h.eventId) === stage);
}

/** stage 开始时的四维 = 早于该阶段的最近一次 dimsAfter；没有任何更早事件则取出生初始值（v4 八因素合成）。 */
export function dimsAtStageStart(state: RunState, stage: Stage): Dims {
  const ordinal = STAGES.indexOf(stage);
  let dims = initialDimsOf(state);
  for (const h of state.history) {
    const s = stageOf(h.eventId);
    if (s !== undefined && STAGES.indexOf(s) < ordinal) dims = h.dimsAfter;
  }
  return dims;
}

/** 阶段四维变化量 = 阶段末次 dimsAfter − 阶段起点（无事件的阶段全 0）。 */
export function stageDeltas(state: RunState, stage: Stage): Dims {
  const start = dimsAtStageStart(state, stage);
  const entries = stageEntries(state.history, stage);
  const last = entries[entries.length - 1]?.dimsAfter ?? start;
  const out = {} as Record<DimKey, number>;
  for (const dim of DIM_KEYS) out[dim] = last[dim] - start[dim];
  return out;
}

/** 终局字母口径：优先结局自带 typeText；兜底结局无 typeText，按四维实算（plan/02 §一；v4 需画像补合成初值）。 */
export function endingLetters(ending: Ending, state: RunState): string {
  return ending.typeText ?? mbtiLetters(state.dims, state.env, state.profile);
}

export interface ChoiceReview {
  event: GameEvent;
  optionText: string;
}

/** 终局「关键抉择」：history 中类型为 critical 的事件（按发生序）与玩家所选选项。 */
export function criticalChoices(history: readonly HistoryEntry[]): ChoiceReview[] {
  const out: ChoiceReview[] = [];
  for (const h of history) {
    const event = eventById(h.eventId);
    if (event?.type === "critical") {
      out.push({ event, optionText: event.options[h.option]?.text ?? "" });
    }
  }
  return out;
}
