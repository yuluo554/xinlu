// 节奏变体引擎（plan/v5/02 §三 单源表；v5-M1'''' 落位）。
// 纯函数、零 DOM、零存储、零过网。判定核零改动（K11）：变体只决定「这张卡怎么呈现」，
// 不参与三观传导/结局/调度单调；所有概率判定走 seededDraw（同种子同结果，可复现硬约束）。
import { seededDraw } from "./engine.ts";
import type { GameEvent, HistoryEntry, RhythmVariant, RunState } from "./model.ts";

/** 每阶段变体种类下限（02 §三 节奏门）。 */
export const VARIANTS_PER_STAGE_MIN = 3;
/** 单阶段同变体连续出牌上限（02 §三 防单调）。 */
export const SAME_VARIANT_STREAK_MAX = 3;
/**
 * quick 变体选项字数上限（02 §三 ▸ M1'''' 增补：6 → 13）。
 * 实测依据（本棒 40 局全程模拟，见 plan/v5/02 §三 ▸ M1'''' 增补表）：
 * 按原文「≤6 字」筛，瘦身后每阶段只剩 0–2 张卡可用，choice 连片达 28 张——
 * 防单调的门自己制造单调。13 字是「同变体连续 ≤3」可达的最小档（≤12 时仍连片 4 张）。
 */
export const QUICK_OPTION_MAX = 13;
/** quick 变体选项数上限（2–3 个紧凑按钮；日常节点 2–3 个都算短词卡）。 */
export const QUICK_OPTION_COUNT = 3;
/** draw 变体牌数（三张背面卡，等概率 1/3）。 */
export const DRAW_CARDS = 3;
/** odds 变体成功率区间（下限/上限，02 §三 f(三观值,资源) 落此域）。 */
export const ODDS_MIN = 0.2;
export const ODDS_MAX = 0.85;

/** 风险档 → 成功率基准（02 §三：odds 用 risk 字段；缺省 critical 走 draw）。 */
const RISK_BASE: Record<string, number> = { low: 0.75, mid: 0.55, high: 0.35 };

/** 事件自带 variant 字段宽度（数据可显式声明呈现方式，优先于类型规则）。 */
type DeclaredVariant = GameEvent & { variant?: RhythmVariant };

/**
 * 事件 → 基础变体（02 §三 单源规则）：
 *   critical → odds（有 risk）或 draw（无 risk）
 *   encounter → 数据声明优先，缺省 draw
 *   era 卡（无选项）→ read
 *   main/context/rescue → 数据声明 quick 时 quick，否则 choice
 * 纯函数：同事件恒同基础变体。
 */
export function baseVariantOf(event: GameEvent): RhythmVariant {
  const declared = (event as DeclaredVariant).variant;
  if (declared) return declared;
  if (event.options.length === 0) return "read";
  switch (event.type) {
    case "critical":
      return event.risk ? "odds" : "draw";
    case "encounter":
      return "draw";
    case "main":
    case "context":
    case "rescue":
    default:
      return "choice";
  }
}

/** 时代卡（无选项）恒 read。 */
export function eraVariant(): RhythmVariant {
  return "read";
}

/** quick 变体是否可用（02 §三 ▸ M1''''：恰 2 个选项且全部 ≤QUICK_OPTION_MAX 字）。 */
export function quickEligible(event: GameEvent): boolean {
  return (
    event.options.length === QUICK_OPTION_COUNT &&
    event.options.every((o) => [...o.text].length <= QUICK_OPTION_MAX)
  );
}

/** 本阶段已出牌变体序列（按 history 顺序；era 条目按 read 计）。 */
export function stageVariantSequence(
  history: readonly HistoryEntry[],
  stage: string,
  lookup: (id: string) => GameEvent | undefined,
): RhythmVariant[] {
  const out: RhythmVariant[] = [];
  for (const h of history) {
    if (h.kind === "era") {
      out.push("read");
      continue;
    }
    const ev = lookup(h.eventId);
    if (ev?.stage === stage) out.push(baseVariantOf(ev));
  }
  return out;
}

/**
 * 最终变体（序列感知的防单调 relay，plan/v5/02 §三 节奏门「同变体连续 ≤3」的实现）：
 * 1. 取基础变体；
 * 2. 若本阶段已连续 SAME_VARIANT_STREAK_MAX 张 choice，则本卡改判 quick（紧凑按钮呈现）；
 * 3. 其余情形保持基础变体。
 * quick 只换**呈现密度**（选项文案一字不改、判定零改动），因此对任何 2–3 选项卡都成立；
 * quickEligible 仅用于数据侧统计「本可默认走紧凑卡」的比例，不参与此处判定。
 * 确定性：只依赖本阶段已出变体序列（同状态同结果），不引入新随机。
 */
export function variantOf(event: GameEvent, streak: readonly RhythmVariant[] = []): RhythmVariant {
  const base = baseVariantOf(event);
  if (base !== "choice") return base;
  const tail = streak.slice(-SAME_VARIANT_STREAK_MAX);
  const saturated = tail.length === SAME_VARIANT_STREAK_MAX && tail.every((v) => v === "choice");
  return saturated ? "quick" : base;
}

/**
 * odds 变体的成功率（02 §三：f(相关三观值, 资源)）：
 * 以 risk 基准为主，叠加三观均值与资源均值各 ±0.1 的修正，钳在 [ODDS_MIN, ODDS_MAX]。
 * 纯函数、可复现：同状态同事件恒同成功率（不含随机）。
 */
export function oddsOf(event: GameEvent, state: RunState): number {
  const base = RISK_BASE[event.risk ?? "mid"] ?? RISK_BASE.mid!;
  const v = (state.values3.worldview + state.values3.outlook + state.values3.values) / 3;
  const valueAdj = ((v - 50) / 50) * 0.1;
  const resAvg = (state.resources.mood + state.resources.money + state.resources.health) / 3;
  const resAdj = ((resAvg - 50) / 50) * 0.1;
  const raw = base + valueAdj + resAdj;
  return Math.round(Math.min(ODDS_MAX, Math.max(ODDS_MIN, raw)) * 100) / 100;
}

/**
 * odds 判定（种子 RNG）：同 (seed, history.length, eventId) 恒同结果。
 * 抽取槽 100000+ 与 pickEvent / 偶遇配额分离，互不干扰既有抽取流。
 */
export function rollOdds(event: GameEvent, state: RunState, odds = oddsOf(event, state)): boolean {
  const salt = [...event.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = seededDraw(state.seed, 100000 + salt * 7 + state.history.length);
  return r < odds;
}

/** 抽卡牌面（draw，三张等概率 1/3）：返回 0..2（种子派生；翻牌前无信息差 = 公平）。 */
export function drawCard(event: GameEvent, state: RunState): number {
  const salt = [...event.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = seededDraw(state.seed, 200000 + salt * 11 + state.history.length);
  return Math.floor(r * DRAW_CARDS) % DRAW_CARDS;
}

/**
 * 出牌序列的节奏统计（节奏门 check-rhythm.mjs 与单测共读）：
 * 返回每阶段出现的变体种类、最长同变体连续长度与卡数。
 */
export function rhythmStats(sequence: ReadonlyArray<{ stage: string; variant: RhythmVariant }>): {
  perStage: Record<string, { variants: RhythmVariant[]; maxStreak: number; count: number }>;
} {
  const perStage: Record<string, { variants: RhythmVariant[]; maxStreak: number; count: number }> = {};
  let lastStage = "";
  let lastVariant: RhythmVariant | null = null;
  let streak = 0;
  for (const step of sequence) {
    if (step.stage !== lastStage) {
      lastStage = step.stage;
      lastVariant = null;
      streak = 0;
    }
    const cell = (perStage[step.stage] ??= { variants: [], maxStreak: 0, count: 0 });
    cell.count += 1;
    if (!cell.variants.includes(step.variant)) cell.variants.push(step.variant);
    if (step.variant === lastVariant) streak += 1;
    else {
      lastVariant = step.variant;
      streak = 1;
    }
    cell.maxStreak = Math.max(cell.maxStreak, streak);
  }
  return { perStage };
}
