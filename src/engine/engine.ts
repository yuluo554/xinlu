// 演化引擎：纯函数，无 DOM、无存储依赖（plan/03 §2，签名已于 M2 出口冻结）。
import birthMapRaw from "../data/birth-map.json";
import endingsRaw from "../data/endings.json";
import eventsRaw from "../data/events.json";
import {
  DIM_KEYS,
  STAGES,
  type BirthEnv,
  type DimKey,
  type Dims,
  type Ending,
  type EndingCond,
  type GameEvent,
  type RunState,
} from "./model";

type BirthMap = Record<
  "era" | "place" | "mood" | "style",
  Record<string, Partial<Record<DimKey, number>>>
>;

const BIRTH_MAP = birthMapRaw as unknown as BirthMap;
const EVENTS = eventsRaw as unknown as GameEvent[];
const ENDINGS = endingsRaw as unknown as Ending[];

const clamp = (n: number): number => Math.min(100, Math.max(0, n));

/** birth-map 四要素合成初始四维；不在此钳制（越界属数据设计错误，由 validate 拦截）。 */
function initialDims(env: BirthEnv): Dims {
  const dims: Record<DimKey, number> = { ei: 50, sn: 50, tf: 50, jp: 50 };
  for (const key of ["era", "place", "mood", "style"] as const) {
    const fix = BIRTH_MAP[key][env[key]];
    if (!fix) throw new Error(`createRun：出生环境枚举越界 ${key}=${env[key]}`);
    for (const dim of DIM_KEYS) {
      const delta = fix[dim];
      if (typeof delta === "number") dims[dim] += delta;
    }
  }
  return dims;
}

/**
 * 无状态种子抽取（[0,1)）。存档 schema v1 没有 RNG 状态字段（plan/02 §六），
 * 因此抽取只由 (seed, 已决事件数) 派生：同种子同选项序列必然得到同一抽取流，
 * 中途存档续局也能精确续上。
 */
export function seededDraw(seed: number, n: number): number {
  let t = (seed + Math.imul(n + 1, 0x9e3779b9)) >>> 0;
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad);
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
  t = (t ^ (t >>> 15)) >>> 0;
  return t / 0x100000000;
}

export function createRun(env: BirthEnv, seed: number): RunState {
  if (!Number.isFinite(seed)) throw new Error("createRun：seed 必须是有限数");
  return {
    seed,
    env: { ...env },
    stageIndex: 0,
    dims: initialDims(env),
    history: [],
    flags: [],
  };
}

/** 阶段调度：main → context（种子抽取）→ critical，pre 不满足者跳过；null = 本阶段事件已取尽。 */
export function pickEvent(state: RunState): GameEvent | null {
  const stage = STAGES[state.stageIndex];
  if (!stage) return null;
  const consumed = new Set(state.history.map((h) => h.eventId));
  const meetsPre = (e: GameEvent): boolean =>
    (e.pre ?? []).every((f) => state.flags.includes(f));
  const pool = EVENTS.filter((e) => e.stage === stage && !consumed.has(e.id));
  const main = pool.find((e) => e.type === "main" && meetsPre(e));
  if (main) return main;
  const contexts = pool.filter((e) => e.type === "context" && meetsPre(e));
  if (contexts.length > 0) {
    const r = seededDraw(state.seed, state.history.length);
    return contexts[Math.floor(r * contexts.length)] ?? null;
  }
  const critical = pool.find((e) => e.type === "critical" && meetsPre(e));
  return critical ?? null;
}

export function applyChoice(state: RunState, optionIndex: number): RunState {
  const event = pickEvent(state);
  if (!event) throw new Error("applyChoice：当前无可应答事件");
  const option = event.options[optionIndex];
  if (!option) throw new Error(`applyChoice：选项越界 ${event.id}#${optionIndex}`);
  const dims = { ...state.dims };
  for (const dim of DIM_KEYS) {
    const delta = option.deltas[dim];
    if (typeof delta === "number") dims[dim] = clamp(dims[dim] + delta);
  }
  const flags =
    option.flag && !state.flags.includes(option.flag)
      ? state.flags.concat(option.flag)
      : state.flags;
  const history = state.history.concat({
    eventId: event.id,
    option: optionIndex,
    dimsAfter: { ...dims },
  });
  return { ...state, dims, flags, history };
}

/** 推进到下一阶段；elder 阶段推进后 stageIndex = STAGES.length，即终局。 */
export function advanceStage(state: RunState): RunState {
  if (state.stageIndex >= STAGES.length) {
    throw new Error("advanceStage：本局已终局，无阶段可推进");
  }
  return { ...state, stageIndex: state.stageIndex + 1 };
}

/** endings 按列表序首个命中生效；无 cond 的兜底结局必须置于末位（validate 保证）。 */
export function resolveEnding(state: RunState): Ending {
  for (const ending of ENDINGS) {
    if (!ending.cond) return ending;
    if (meetsCond(ending.cond, state)) return ending;
  }
  throw new Error("resolveEnding：endings 缺少兜底结局");
}

function meetsCond(cond: EndingCond, state: RunState): boolean {
  for (const dim of DIM_KEYS) {
    const range = cond.dims?.[dim];
    if (range) {
      const [low, high] = range;
      if (state.dims[dim] < low || state.dims[dim] > high) return false;
    }
  }
  if (cond.flags && !cond.flags.every((f) => state.flags.includes(f))) return false;
  if (cond.notFlags && cond.notFlags.some((f) => state.flags.includes(f))) return false;
  return true;
}

/**
 * 四维 → MBTI 字母。当前值恰为 50 时按出生环境初始值的历史符号裁定；
 * 初始值亦为 50 时无符号可依，取低侧字母（plan/02 §一委托引擎裁定的兜底分支）。
 */
export function mbtiLetters(dims: Dims, env: BirthEnv): string {
  const init = initialDims(env);
  const letter = (cur: number, base: number, high: string, low: string): string =>
    cur > 50 ? high : cur < 50 ? low : base > 50 ? high : low;
  return [
    letter(dims.ei, init.ei, "E", "I"),
    letter(dims.sn, init.sn, "S", "N"),
    letter(dims.tf, init.tf, "F", "T"),
    letter(dims.jp, init.jp, "J", "P"),
  ].join("");
}
