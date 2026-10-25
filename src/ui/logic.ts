// 视图逻辑（纯函数，无 DOM）：阶段聚合、阶段起点四维、终局字母口径与关键抉择回顾（plan/03 §4）。
// 阶段信息不入存档（schema v1 冻结），一律由 history.eventId → eventById 反查派生；
// 因此刷新续局后这些函数在同一个 state 上算出同样的结果。
// v4-M2''' 小结重做（plan/v4/02 §七 + ▸ M2''' 增补）：时代卡归段 / 三观位移 / 区间词+独白接线在此单源。
import { eraEventById, eventById, initialDimsOf, mbtiLetters } from "../engine/engine";
import { runYearOf } from "../engine/year";
import monologuesRaw from "../data/monologues.json";
import {
  DIM_KEYS,
  STAGES,
  VALUES_AXES,
  type Deltas3,
  type DimKey,
  type Dims,
  type Ending,
  type GameEvent,
  type HistoryEntry,
  type RunState,
  type Stage,
  type ValuesAxis,
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

// ── v4-M2''' 小结重做（plan/v4/02 §七 + ▸ M2''' 增补）──

/** history 逐条的阶段归属：时代卡（kind:"era"）随其后首张非时代事件归段（注入时序：时代卡
 *  先于同阶段命运事件入账）；末尾悬挂时代卡（下一事件尚未发生）归当前推进阶段。 */
export function entryStages(state: RunState): Stage[] {
  const stages: Array<Stage | null> = state.history.map((h) =>
    h.kind === "era" ? null : (eventById(h.eventId)?.stage ?? null),
  );
  const fallback = STAGES[Math.min(state.stageIndex, STAGES.length - 1)]!;
  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i] === null) stages[i] = i + 1 < stages.length ? (stages[i + 1] ?? fallback) : fallback;
  }
  return stages as Stage[];
}

/** 本阶段三观位移 = 阶段内全部抉择的 deltas3 求和（含时代卡；不含阶段漂移——漂移是「时代与他人的
 *  影响」，不是「你的位移」，口径见 02 §七 ▸ M2''' 增补）。 */
export function stageValuesShift(state: RunState, stage: Stage): Deltas3 {
  const stages = entryStages(state);
  const out: Deltas3 = {};
  state.history.forEach((h, i) => {
    if (stages[i] !== stage) return;
    const deltas =
      h.kind === "era"
        ? eraEventById(h.eventId)?.deltas3
        : eventById(h.eventId)?.options[h.option]?.deltas3;
    if (!deltas) return;
    for (const axis of VALUES_AXES) {
      const v = deltas[axis];
      if (typeof v === "number") out[axis] = (out[axis] ?? 0) + v;
    }
  });
  return out;
}

/** 本阶段关键抉择（小结第 5 段「关键抉择回顾」；时代卡无选项不计入）。 */
export function stageCriticals(state: RunState, stage: Stage): ChoiceReview[] {
  const stages = entryStages(state);
  const out: ChoiceReview[] = [];
  state.history.forEach((h, i) => {
    if (stages[i] !== stage || h.kind === "era") return;
    const event = eventById(h.eventId);
    if (event?.type === "critical") out.push({ event, optionText: event.options[h.option]?.text ?? "" });
  });
  return out;
}

/** 三观区间词表（02 §七 ▸ M2''' 增补，UI 语汇单源本表；区间边界沿 v3/02 §二：<35 / 35–65 / >65）。 */
export const VALUES_BAND_WORD: Record<ValuesAxis, { low: string; mid: string; high: string }> = {
  worldview: { low: "理性为骨", mid: "理感相济", high: "感应偏重" },
  outlook: { low: "进取向前", mid: "张弛之间", high: "安然自处" },
  values: { low: "原则持守", mid: "情理兼顾", high: "共情为怀" },
};

export const VALUES_AXIS_LABEL: Record<ValuesAxis, string> = {
  worldview: "世界观",
  outlook: "人生观",
  values: "价值观",
};

type MonoTable = Record<ValuesAxis, Record<"low" | "mid" | "high", string>>;
const MONOLOGUES = monologuesRaw as unknown as MonoTable;

const bandOf = (v: number): "low" | "mid" | "high" => (v < 35 ? "low" : v > 65 ? "high" : "mid");

export interface ValuesNote {
  axis: ValuesAxis;
  label: string;
  /** 区间词（如「感应偏重」）。 */
  bandWord: string;
  /** 本阶段位移（正 = 向轴高端）。 */
  shift: number;
  arrow: "↑" | "↓" | "→";
  /** 该轴当前区间的内心独白（monologues 表接线，v3/02 §二）。 */
  monologue: string;
}

/** 小结第 2 段「三观三轴说明」视图模型：每轴一行 = 区间词 + 位移箭头 + 一句独白。 */
export function valuesNotes(state: RunState, stage: Stage): ValuesNote[] {
  const shift = stageValuesShift(state, stage);
  return VALUES_AXES.map((axis) => {
    const s = shift[axis] ?? 0;
    const band = bandOf(state.values3[axis]);
    return {
      axis,
      label: VALUES_AXIS_LABEL[axis],
      bandWord: VALUES_BAND_WORD[axis][band],
      shift: s,
      arrow: s > 0 ? "↑" : s < 0 ? "↓" : "→",
      monologue: MONOLOGUES[axis][band],
    };
  });
}

/** 小结第 1 段阶段主题头的跨度：年代区间（首末事件 runYear）+ 年龄段（首末 ageHint）。空阶段返回空串。 */
export function stageSpan(state: RunState, stage: Stage): { yearRange: string; ageRange: string } {
  const entries = stageEntries(state.history, stage);
  const first = entries[0] ? eventById(entries[0]!.eventId) : undefined;
  const last = entries[entries.length - 1] ? eventById(entries[entries.length - 1]!.eventId) : undefined;
  if (!first || !last) return { yearRange: "", ageRange: "" };
  const y1 = runYearOf(state.birthYear, first.ageMonths);
  const y2 = runYearOf(state.birthYear, last.ageMonths);
  return {
    yearRange: y1 === y2 ? `${y1} 年` : `${y1}–${y2} 年`,
    ageRange: first.ageHint === last.ageHint ? first.ageHint : `${first.ageHint}–${last.ageHint}`,
  };
}
