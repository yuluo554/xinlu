// 轻量线索判定（plan/v5/02 §十 D10）：**纯 flag 映射，零随机**。
//
// 一局里每条线索只在它锚定的事件被选过之后出现一次；玩家选一种解读 → 写一个 flag
// （`state.flags` 走既有通道，存档 schema v3 不变、不加字段），该 flag 再作为后续事件的
// `pre` 条件解锁新内容。因此本模块只有三个纯函数：谁的线索该出 / 选了算哪个 flag / 这条线索什么状态。
//
// 可复现是硬约束：这里不读写 seed、不掷骰——同一份 state 恒同结果（可单测）。
import cluesRaw from "../data/clues.json" with { type: "json" };
import type { RunState, Stage } from "./model";

export interface ClueChoice {
  text: string;
  flag: string;
}

export interface Clue {
  id: string;
  stage: Stage;
  /** 该线索出现的时机：这个事件一经作答，线索即解锁呈现。 */
  anchorEventId: string;
  /** 两条解读各解锁一条后续事件（与 choices 同序，数据里成对声明）。 */
  unlockEventIds: [string, string];
  prompts: string[];
  choices: ClueChoice[];
}

interface CluesFile {
  _meta?: string;
  clues: Clue[];
}

export const CLUES: readonly Clue[] = (cluesRaw as unknown as CluesFile).clues;

/** 全部线索 flag（validate 与测试共读；判定只认这张表，不在别处复写）。 */
export const CLUE_FLAGS: readonly string[] = CLUES.flatMap((c) => c.choices.map((ch) => ch.flag));

const BY_ID = new Map(CLUES.map((c) => [c.id, c]));

export function clueById(id: string): Clue | undefined {
  return BY_ID.get(id);
}

/** 这条线索在本局是否已落定（两个解读 flag 之一已在册）。 */
export function isResolved(state: Pick<RunState, "flags">, clue: Clue): boolean {
  return clue.choices.some((c) => state.flags.includes(c.flag));
}

/**
 * 此刻该呈现的线索（无则 null）。判定全为事实查询，不涉随机：
 *  1. 锚定事件已作答（在 history 里，且不是时代卡哨兵）；
 *  2. 该线索尚未落定（两个解读 flag 都还不在册）；
 *  3. 当前阶段与线索阶段一致（线索不跨阶段补播，避免「十年前的信晚到」）。
 * 多条同时满足时按 clues.json 顺序取第一条——顺序是数据事实，不是抽签。
 */
export function pendingClue(state: Pick<RunState, "flags" | "history" | "stageIndex">): Clue | null {
  const answered = new Set(state.history.filter((h) => h.kind !== "era").map((h) => h.eventId));
  for (const clue of CLUES) {
    if (isResolved(state, clue)) continue;
    if (!answered.has(clue.anchorEventId)) continue;
    if (stageIndexOf(clue.stage) !== state.stageIndex) continue;
    return clue;
  }
  return null;
}

const STAGE_ORDER: readonly Stage[] = ["infant", "toddler", "childhood", "teen", "youth", "adult", "midlife", "elder"];
function stageIndexOf(stage: Stage): number {
  return STAGE_ORDER.indexOf(stage);
}

/** 本阶段是否已出过线索（v5/02 §十「每阶段 ≤1 处」的机读形式）。 */
export function cluesUsedInStage(state: Pick<RunState, "flags">, stage: Stage): number {
  return CLUES.filter((c) => c.stage === stage && isResolved(state, c)).length;
}

/**
 * 落定一条解读：把该解读的 flag 写进 `flags`（去重、保序），**不改三观、不改资源、不掷骰**。
 * 越界或未知线索 id 抛错（调用方是 UI 事件，不应静默）。
 */
export function resolveClue(state: RunState, clueId: string, choiceIndex: number): RunState {
  const clue = BY_ID.get(clueId);
  if (!clue) throw new Error(`resolveClue：未知线索 ${clueId}`);
  const choice = clue.choices[choiceIndex];
  if (!choice) throw new Error(`resolveClue：线索 ${clueId} 解读越界 ${choiceIndex}`);
  if (state.flags.includes(choice.flag)) return state;
  return { ...state, flags: state.flags.concat(choice.flag) };
}

/** 某条线索实际解锁的事件 id（= 玩家所选解读对应的事件；未落定返回 null）。 */
export function unlockEventIdOf(state: Pick<RunState, "flags">, clue: Clue): string | null {
  const index = clue.choices.findIndex((c) => state.flags.includes(c.flag));
  if (index < 0) return null;
  return clue.unlockEventIds[index] ?? null;
}
