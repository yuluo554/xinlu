// 演化引擎：纯函数，无 DOM、无存储、无过网依赖（plan/03 §2 五签名冻结；v3 内部升级为
// 三观传导链 + ageMonths 单调调度，口径单源 plan/v3/02，新增导出走 values.ts）。
// JSON 以 import attributes 引入：同一引擎文件可被 node 原生执行（可达性扫描复用真实引擎）。
import birthMapRaw from "../data/birth-map.json" with { type: "json" };
import endingsRaw from "../data/endings.json" with { type: "json" };
import eventsRaw from "../data/events.json" with { type: "json" };
import {
  DIM_KEYS,
  STAGES,
  type BirthEnv,
  type DimKey,
  type Dims,
  type Ending,
  type EndingCond,
  type GameEvent,
  type LineKey,
  type ResKey,
  type RunState,
} from "./model.ts";
import {
  applyLineGain,
  applyResources,
  applyValues,
  dimsOffsetOf,
  lineCriticalUnlocked,
  lineGainOf,
  rescueOpen,
  settleDeltas,
  stageDrift,
} from "./values.ts";

type BirthMap = Record<
  "era" | "place" | "mood" | "style",
  Record<string, Partial<Record<DimKey, number>>>
>;

const BIRTH_MAP = birthMapRaw as unknown as BirthMap;
const EVENTS = eventsRaw as unknown as GameEvent[];
const ENDINGS = endingsRaw as unknown as Ending[];
const EVENT_BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

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
 * 无状态种子抽取（[0,1)）。抽取只由 (seed, 已决事件数) 派生：同种子同选项序列必然得到
 * 同一抽取流，中途存档续局也能精确续上（v3 存档信封升级不改此契约，plan/v3/02 §六/八）。
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
    values3: { worldview: 50, outlook: 50, values: 50 },
    resources: { mood: 60, money: 60, health: 60 },
    lines: { study: 0, career: 0, love: 0, friend: 0, health: 0 },
    npcs: [
      { id: "mother", bond: 70, tag: "亲密" },
      { id: "father", bond: 70, tag: "亲密" },
    ],
  };
}

/** 阶段内候选池：pre 满足 + 支线 critical 已解锁 + rescue 仅低值时可见。 */
function stageCandidates(state: RunState, stage: string): GameEvent[] {
  const consumed = new Set(state.history.map((h) => h.eventId));
  return EVENTS.filter((e) => {
    if (e.stage !== stage || consumed.has(e.id)) return false;
    if (!(e.pre ?? []).every((f) => state.flags.includes(f))) return false;
    if (e.type === "critical" && e.line !== "fate" && !lineCriticalUnlocked(state.lines, e.line)) {
      return false;
    }
    if (e.type === "rescue" && !(e.rescue && rescueOpen(state, e.rescue))) return false;
    return true;
  });
}

/**
 * 阶段调度（v3 单调口径，plan/v3/02 §一 ▸ M1'' 增补）：
 * fate main 定锚按库序出牌；锚点之前先抽干 `ageMonths ≤ 锚点` 的非 main 候选
 * （同月龄一档，档内按「本阶段各线已抽数」轮转偏置 + 种子随机）；main 抽干后
 * 同档规则抽完剩余非 main，最后按库序出 critical。任意抽取序列 ageMonths 不减。
 * null = 本阶段事件已取尽。
 */
export function pickEvent(state: RunState): GameEvent | null {
  const stage = STAGES[state.stageIndex];
  if (!stage) return null;
  // 位置下限：pre/rescue/线解锁等动态门槛可能在阶段中途开启，晚开的候选不得早于
  // 已抽到的月龄位置出牌（错过该档即本局错过，单调性优先，v3/02 §一）。
  let floor = -1;
  for (const h of state.history) {
    const ev = EVENT_BY_ID.get(h.eventId);
    if (ev?.stage === stage && ev.ageMonths > floor) floor = ev.ageMonths;
  }
  const pool = stageCandidates(state, stage).filter((e) => e.ageMonths >= floor);
  const mains = pool.filter((e) => e.type === "main");
  const others = pool.filter((e) => e.type !== "main" && e.type !== "critical");
  // critical（fate 与支线）按月龄出牌，同月龄保持库序（stable sort）——支线 critical 月龄
  // 可早于 fate 收束锚点，排序保证 critical 段同样不减。
  const criticals = pool
    .filter((e) => e.type === "critical")
    .sort((a, b) => a.ageMonths - b.ageMonths);
  const nextMain = mains[0];
  const candidates = nextMain
    ? others.filter((e) => e.ageMonths <= nextMain.ageMonths)
    : others;
  if (candidates.length > 0) {
    const tier = Math.min(...candidates.map((e) => e.ageMonths));
    const tierCands = candidates.filter((e) => e.ageMonths === tier);
    const drawn = new Map<LineKey, number>();
    const stageOrdinal = state.stageIndex;
    for (const h of state.history) {
      const ev = EVENT_BY_ID.get(h.eventId);
      if (ev && ev.stage === STAGES[stageOrdinal]) {
        drawn.set(ev.line, (drawn.get(ev.line) ?? 0) + 1);
      }
    }
    const minDrawn = Math.min(...tierCands.map((e) => drawn.get(e.line) ?? 0));
    const rotation = tierCands.filter((e) => (drawn.get(e.line) ?? 0) === minDrawn);
    const r = seededDraw(state.seed, state.history.length);
    return rotation[Math.floor(r * rotation.length)] ?? null;
  }
  if (nextMain) return nextMain;
  return criticals[0] ?? null;
}

/** 选项可用性（requires 资源门槛，plan/v3/02 §三 ▸ M1'' 增补）：UI 据此禁用，applyChoice 据此拒绝。 */
export function optionAvailable(state: RunState, event: GameEvent, optionIndex: number): boolean {
  const option = event.options[optionIndex];
  if (!option?.requires) return true;
  return Object.entries(option.requires).every(
    ([res, threshold]) =>
      typeof threshold === "number" && state.resources[res as ResKey] >= threshold,
  );
}

/** 逐选项可用性布尔表（视图消费：锁定选项置灰不隐藏，玩家知道代价存在）。 */
export function optionLocks(state: RunState, event: GameEvent): boolean[] {
  return event.options.map((_, i) => optionAvailable(state, event, i));
}

/** 本事件选项 j 的派生四维偏移（表现层微反馈消费：鱼表情方向、后果屏内在变化）。 */
export function optionDimsDelta(event: GameEvent, optionIndex: number): Partial<Dims> {
  return dimsOffsetOf(event.options[optionIndex]?.deltas3 ?? {});
}

export function applyChoice(state: RunState, optionIndex: number): RunState {
  const event = pickEvent(state);
  if (!event) throw new Error("applyChoice：当前无可应答事件");
  const option = event.options[optionIndex];
  if (!option) throw new Error(`applyChoice：选项越界 ${event.id}#${optionIndex}`);
  if (!optionAvailable(state, event, optionIndex)) {
    throw new Error(`applyChoice：选项被资源门槛锁定 ${event.id}#${optionIndex}`);
  }
  // v3 传导链（plan/v3/02 §二）：选项 → 三观主效应 → 派生四维偏移；资源增损并行入账。
  const withValues = applyValues(state, option.deltas3 ?? {});
  const offsets = dimsOffsetOf(option.deltas3 ?? {});
  const dims = { ...state.dims };
  for (const dim of DIM_KEYS) {
    const off = offsets[dim];
    if (typeof off === "number" && off !== 0) dims[dim] = clamp(dims[dim] + off);
  }
  const withResources = applyResources(withValues, option.resourceDeltas ?? {});
  const lines = applyLineGain(
    withResources.lines,
    event.line,
    lineGainOf(event.line, event.type, event.lineGain),
  );
  const flags =
    option.flag && !state.flags.includes(option.flag)
      ? state.flags.concat(option.flag)
      : state.flags;
  const history = state.history.concat({
    eventId: event.id,
    option: optionIndex,
    dimsAfter: { ...dims },
  });
  return {
    ...state,
    dims,
    values3: withResources.values3,
    resources: withResources.resources,
    lines,
    flags,
    history,
  };
}

/** 推进到下一阶段；离开阶段时一次性结算：非选项漂移（三观）+ 自然结算（资源）。
 *  elder 阶段推进后 stageIndex = STAGES.length，即终局。 */
export function advanceStage(state: RunState): RunState {
  if (state.stageIndex >= STAGES.length) {
    throw new Error("advanceStage：本局已终局，无阶段可推进");
  }
  const leaving = STAGES[state.stageIndex]!;
  const withDrift = applyValues(state, stageDrift(state));
  const settled = applyResources(withDrift, settleDeltas(leaving, state.lines));
  return { ...settled, stageIndex: state.stageIndex + 1 };
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

// —— 只读访问器（plan/03 §2 附件导出）：供视图/可视化/扫描消费，不改冻结五签名 ——

/** 四要素可选枚举（从 birth-map 键读出）。开局屏枚举清单的唯一来源，UI 不得内联。 */
export function birthEnvOptions(): Record<keyof BirthEnv, string[]> {
  return {
    era: Object.keys(BIRTH_MAP.era),
    place: Object.keys(BIRTH_MAP.place),
    mood: Object.keys(BIRTH_MAP.mood),
    style: Object.keys(BIRTH_MAP.style),
  };
}

/** 出生初始四维（K8 合成）。阶段小结淡影与演化曲线的起点取 here。 */
export function initialDimsOf(env: BirthEnv): Dims {
  return initialDims(env);
}

/** 按 id 取事件；阶段聚合（history 无阶段字段）与终局关键抉择回顾取 here。未知 id 返回 undefined。 */
export function eventById(eventId: string): GameEvent | undefined {
  return EVENTS.find((e) => e.id === eventId);
}
