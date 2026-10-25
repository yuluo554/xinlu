// 演化引擎：纯函数，无 DOM、无存储、无过网依赖（plan/03 §2 五签名冻结；v3 内部升级为
// 三观传导链 + ageMonths 单调调度，口径单源 plan/v3/02，新增导出走 values.ts；
// v4 增量：出生年历法/年代卡注入/六因素画像，口径单源 plan/v4/02 ▸ M1''' 增补）。
// JSON 以 import attributes 引入：同一引擎文件可被 node 原生执行（可达性扫描复用真实引擎）。
import birthMapRaw from "../data/birth-map.json" with { type: "json" };
import endingsRaw from "../data/endings.json" with { type: "json" };
import eventsRaw from "../data/events.json" with { type: "json" };
import eraEventsRaw from "../data/era-events.json" with { type: "json" };
import {
  ERA_YEAR_RANGES,
  eraOf,
  runYearOf,
} from "./year.ts";
import { generateFamily } from "./family.ts";
import {
  DIM_KEYS,
  STAGES,
  type BirthEnv,
  type BirthProfile,
  type DimKey,
  type Dims,
  type Ending,
  type EndingCond,
  type EraEvent,
  type EventOption,
  type GameEvent,
  type LineKey,
  type ResKey,
  type RunState,
} from "./model.ts";
import {
  applyBonds,
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
  "era" | "place" | "mood" | "style" | "region" | "structure" | "parentsJob" | "wealth",
  Record<string, Partial<Record<DimKey, number>>>
>;

const BIRTH_MAP = birthMapRaw as unknown as BirthMap;
const EVENTS = eventsRaw as unknown as GameEvent[];
const ENDINGS = endingsRaw as unknown as Ending[];
const ERA_EVENTS = eraEventsRaw as unknown as EraEvent[];
const ERA_BY_YEAR = new Map(ERA_EVENTS.map((e) => [e.year, e]));
const EVENT_BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

const clamp = (n: number): number => Math.min(100, Math.max(0, n));

/** 出生画像八因素（v1 四要素 + v4 四因素）合成初始四维；不在此钳制（越界属数据设计错误，由 validate 拦截）。 */
function initialDims(env: BirthEnv, profile: BirthProfile): Dims {
  const dims: Record<DimKey, number> = { ei: 50, sn: 50, tf: 50, jp: 50 };
  const rows: Array<{ key: string; value: string; row?: Partial<Record<DimKey, number>> }> = [
    { key: "era", value: env.era, row: BIRTH_MAP.era[env.era] },
    { key: "place", value: env.place, row: BIRTH_MAP.place[env.place] },
    { key: "mood", value: env.mood, row: BIRTH_MAP.mood[env.mood] },
    { key: "style", value: env.style, row: BIRTH_MAP.style[env.style] },
    { key: "region", value: profile.region, row: BIRTH_MAP.region[profile.region] },
    { key: "structure", value: profile.structure, row: BIRTH_MAP.structure[profile.structure] },
    { key: "parentsJob", value: profile.parentsJob, row: BIRTH_MAP.parentsJob[profile.parentsJob] },
    { key: "wealth", value: profile.wealth, row: BIRTH_MAP.wealth[profile.wealth] },
  ];
  for (const factor of rows) {
    if (!factor.row) {
      throw new Error(`createRun：出生环境/画像枚举越界 ${factor.key}=${factor.value}`);
    }
    for (const dim of DIM_KEYS) {
      const delta = factor.row[dim];
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

// ── v4 出生画像派生（plan/v4/02 §三 ▸ M1''' 增补；概率表单源该节）──

/** 加权抽取：r ∈ [0,1) 走累计权重；权重和为 1（表内口径）。 */
function weightedPick<T extends string>(entries: ReadonlyArray<readonly [T, number]>, r: number): T {
  let acc = 0;
  for (const [value, weight] of entries) {
    acc += weight;
    if (r < acc) return value;
  }
  return entries[entries.length - 1]![0];
}

const STRUCTURE_WEIGHTS = {
  early: [["多孩", 0.6], ["双孩", 0.3], ["独生", 0.05], ["隔代", 0.05]] as const,
  onechild: [["独生", 0.7], ["双孩", 0.15], ["多孩", 0.1], ["隔代", 0.05]] as const,
  late: [["独生", 0.5], ["双孩", 0.3], ["多孩", 0.15], ["隔代", 0.05]] as const,
};
const JOB_WEIGHTS: Record<string, ReadonlyArray<readonly [string, number]>> = {
  农村: [["农民", 0.6], ["工人", 0.1], ["个体", 0.15], ["教师医生", 0.05], ["公职", 0.05], ["待岗", 0.05]],
  县镇: [["农民", 0.3], ["工人", 0.25], ["个体", 0.2], ["教师医生", 0.1], ["公职", 0.1], ["待岗", 0.05]],
  小城: [["工人", 0.35], ["个体", 0.2], ["公职", 0.2], ["教师医生", 0.1], ["农民", 0.05], ["待岗", 0.1]],
  大城: [["工人", 0.3], ["个体", 0.2], ["公职", 0.2], ["教师医生", 0.15], ["待岗", 0.15]],
};
const WEALTH_WEIGHTS: Record<string, ReadonlyArray<readonly [string, number]>> = {
  lean: [["拮据", 0.5], ["一般", 0.4], ["宽裕", 0.1]], // 农民/待岗
  mid: [["一般", 0.5], ["拮据", 0.25], ["宽裕", 0.25]], // 工人/个体
  stable: [["一般", 0.5], ["宽裕", 0.35], ["拮据", 0.15]], // 教师医生/公职
};
const WEALTH_BY_JOB: Record<string, keyof typeof WEALTH_WEIGHTS> = {
  工人: "mid",
  农民: "lean",
  个体: "mid",
  教师医生: "stable",
  公职: "stable",
  待岗: "lean",
};

/** structure → mood 派生（自定义页签，plan/v4/02 §三 ▸ M1''' 增补）。 */
const MOOD_OF_STRUCTURE: Record<string, string> = {
  独生: "和睦",
  双孩: "和睦",
  多孩: "紧张",
  单亲: "单亲",
  隔代: "疏离",
};

/** 手选/随机页签的画像派生（draw 4–8，seed 确定性；同 seed 同派生）。 */
export function deriveBirth(env: BirthEnv, seed: number): { birthYear: number; profile: BirthProfile } {
  const range = ERA_YEAR_RANGES[env.era];
  if (!range) throw new Error(`deriveBirth：未知 era「${env.era}」`);
  const birthYear = range[0] + Math.floor(seededDraw(seed, 4) * (range[1] - range[0] + 1));
  const region = weightedPick([["南方", 0.5], ["北方", 0.5]], seededDraw(seed, 5));
  let structure: string;
  if (env.mood === "单亲") {
    structure = "单亲";
  } else {
    const table =
      env.era === "60s" || env.era === "70s"
        ? STRUCTURE_WEIGHTS.early
        : env.era === "10s"
          ? STRUCTURE_WEIGHTS.late
          : STRUCTURE_WEIGHTS.onechild;
    structure = weightedPick(table, seededDraw(seed, 6));
  }
  // 父母职业：era 折算（60s/70s 无个体、待岗仅 90s/00s，折入工人）
  let entries = [...(JOB_WEIGHTS[env.place] ?? JOB_WEIGHTS["小城"]!)];
  const foldJob = (job: string): void => {
    const idx = entries.findIndex(([j]) => j === job);
    if (idx < 0) return;
    const folded = entries[idx]![1];
    entries.splice(idx, 1);
    const w = entries.find(([j]) => j === "工人");
    if (w) entries[entries.indexOf(w)] = ["工人", w[1] + folded];
  };
  if (env.era === "60s" || env.era === "70s") foldJob("个体");
  if (env.era !== "90s" && env.era !== "00s") foldJob("待岗");
  const parentsJob = weightedPick(entries, seededDraw(seed, 7));
  const wealth = weightedPick(WEALTH_WEIGHTS[WEALTH_BY_JOB[parentsJob] ?? "mid"]!, seededDraw(seed, 8));
  return {
    birthYear,
    profile: {
      region: region as BirthProfile["region"],
      structure: structure as BirthProfile["structure"],
      parentsJob: parentsJob as BirthProfile["parentsJob"],
      wealth: wealth as BirthProfile["wealth"],
    },
  };
}

/** 自定义页签的 env 派生（六因素 → 四要素；plan/v4/02 §三 ▸ M1''' 增补派生表）。 */
export function envFromBirth(birthYear: number, profile: BirthProfile, place: string): BirthEnv {
  const style =
    profile.parentsJob === "教师医生" || profile.parentsJob === "公职"
      ? "权威"
      : profile.wealth === "拮据"
        ? "忽视"
        : "宽容";
  return { era: eraOf(birthYear), place, mood: MOOD_OF_STRUCTURE[profile.structure] ?? "和睦", style };
}

export function createRun(
  env: BirthEnv,
  seed: number,
  birth?: { birthYear: number; profile: BirthProfile },
): RunState {
  if (!Number.isFinite(seed)) throw new Error("createRun：seed 必须是有限数");
  const chosen = birth ?? deriveBirth(env, seed);
  const { birthYear, profile } = chosen;
  if (!Number.isInteger(birthYear) || birthYear < 1955 || birthYear > 2015) {
    throw new Error(`createRun：birthYear 越界 [1955, 2015]：${birthYear}`);
  }
  if (eraOf(birthYear) !== env.era) {
    throw new Error(`createRun：birthYear ${birthYear} 与 era「${env.era}」不同段（plan/v4/02 §一）`);
  }
  return {
    seed,
    env: { ...env },
    birthYear,
    profile: { ...profile },
    stageIndex: 0,
    dims: initialDims(env, profile),
    history: [],
    flags: [],
    values3: { worldview: 50, outlook: 50, values: 50 },
    resources: { mood: 60, money: 60, health: 60 },
    lines: { study: 0, career: 0, love: 0, friend: 0, health: 0 },
    npcs: generateFamily(env, birthYear, profile, seed),
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

/** 选项入账链（v3 传导 + 资源 + 关系 + 线进度 + flag + history），applyChoice / applyCustomChoice 共用。 */
function settleChoice(state: RunState, event: GameEvent, option: EventOption, optionIndex: number): RunState {
  // v3 传导链（plan/v3/02 §二）：选项 → 三观主效应 → 派生四维偏移；资源增损并行入账。
  const withValues = applyValues(state, option.deltas3 ?? {});
  const offsets = dimsOffsetOf(option.deltas3 ?? {});
  const dims = { ...state.dims };
  for (const dim of DIM_KEYS) {
    const off = offsets[dim];
    if (typeof off === "number" && off !== 0) dims[dim] = clamp(dims[dim] + off);
  }
  // 关系增量（plan/v3/02 §五 ▸ M3'' 增补）：按本次选择后的 values 轴衰减入账。
  const withBonds = applyBonds(withValues, option.bondDeltas ?? {});
  const withResources = applyResources(withBonds, option.resourceDeltas ?? {});
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
    npcs: withResources.npcs,
    lines,
    flags,
    history,
  };
}

export function applyChoice(state: RunState, optionIndex: number): RunState {
  const event = pickEvent(state);
  if (!event) throw new Error("applyChoice：当前无可应答事件");
  const option = event.options[optionIndex];
  if (!option) throw new Error(`applyChoice：选项越界 ${event.id}#${optionIndex}`);
  if (!optionAvailable(state, event, optionIndex)) {
    throw new Error(`applyChoice：选项被资源门槛锁定 ${event.id}#${optionIndex}`);
  }
  return settleChoice(state, event, option, optionIndex);
}

/**
 * 自定义第 4 槽（v3/02 §七 ▸ M3'' 增补）：LLM 归一后的选项直入状态机。
 * 叙事与标签由旁路层产出，数值已过 clampCustomDeltas 本地钳制；自定义选项不参与
 * requires 门槛（缺省无 requires）。history 记 option = 既有选项数（第 4 槽位约定）。
 */
export function applyCustomChoice(state: RunState, option: EventOption): RunState {
  const event = pickEvent(state);
  if (!event) throw new Error("applyCustomChoice：当前无可应答事件");
  return settleChoice(state, event, option, event.options.length);
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
export function mbtiLetters(dims: Dims, env: BirthEnv, profile: BirthProfile): string {
  const init = initialDims(env, profile);
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

/** v4 画像四因素可选枚举（从 birth-map 键读出；自定义页签清单唯一来源，UI 不得内联）。 */
export function profileOptions(): Record<"region" | "structure" | "parentsJob" | "wealth", string[]> {
  return {
    region: Object.keys(BIRTH_MAP.region),
    structure: Object.keys(BIRTH_MAP.structure),
    parentsJob: Object.keys(BIRTH_MAP.parentsJob),
    wealth: Object.keys(BIRTH_MAP.wealth),
  };
}

/**
 * 随机出生（v3/02 §六 ▸ M3'' 增补）：seed 确定性派生四要素——同种子必得同一出生环境，
 * 与后续抽取共用同一无状态种子流（seededDraw），同码复现契约覆盖出生本身。
 */
export function randomBirthEnv(seed: number): BirthEnv {
  const options = birthEnvOptions();
  const pick = (key: keyof BirthEnv, n: number): string => {
    const list = options[key];
    return list[Math.floor(seededDraw(seed, n) * list.length) % list.length]!;
  };
  return {
    era: pick("era", 0),
    place: pick("place", 1),
    mood: pick("mood", 2),
    style: pick("style", 3),
  };
}

/**
 * v4 随机出生（plan/v4/02 §一/§三 ▸ M1''' 增补）：env 沿 v3 draw 0–3 不变，
 * birthYear/profile 走 deriveBirth 的 draw 4–8——同码 ⇒ 同出生年同画像同家庭。
 */
export function randomBirth(seed: number): { env: BirthEnv; birthYear: number; profile: BirthProfile } {
  const env = randomBirthEnv(seed);
  const { birthYear, profile } = deriveBirth(env, seed);
  return { env, birthYear, profile };
}

/** 出生初始四维（K8 合成，v4 八因素版）。阶段小结淡影与演化曲线的起点取 here。 */
export function initialDimsOf(state: RunState): Dims {
  return initialDims(state.env, state.profile);
}

/** 按 id 取事件；阶段聚合（history 无阶段字段）与终局关键抉择回顾取 here。未知 id 返回 undefined。 */
export function eventById(eventId: string): GameEvent | undefined {
  return EVENTS.find((e) => e.id === eventId);
}

/** 按 id 取年代锚（timeline/curve 等视图反查；未知 id 返回 undefined）。 */
export function eraEventById(eventId: string): EraEvent | undefined {
  return ERA_EVENTS.find((e) => e.id === eventId);
}

// ── v4 年代卡注入（plan/v4/02 §二 ▸ M1''' 增补；判定核调度零改动——注入在 pickEvent 之外）──

/** 每阶段时代卡上限。 */
export const ERA_PER_STAGE_MAX = 2;

/**
 * 时代卡抽取（注入细则单源 plan/v4/02 §二 ▸ M1''' 增补）：
 * 下一张命运线事件的 runYear 命中锚年且当前阶段 ∈ stageFit 时返回该锚；
 * 已入 history 的锚不重复；本阶段已插满 2 张不再插；与 critical 双向错开 1 张卡。
 * null = 当前不插卡。纯函数：同状态恒同结果。
 */
export function eraEventFor(state: RunState): EraEvent | null {
  const stage = STAGES[state.stageIndex];
  if (!stage) return null;
  const next = pickEvent(state);
  if (!next || next.type === "critical") return null;
  const last = state.history[state.history.length - 1];
  if (last) {
    if (last.kind === "era") return null; // 时代卡不连发
    if (EVENT_BY_ID.get(last.eventId)?.type === "critical") return null; // 上一张是重大抉择
  }
  const year = runYearOf(state.birthYear, next.ageMonths);
  const anchor = ERA_BY_YEAR.get(year);
  if (!anchor) return null;
  if (!anchor.stageFit.includes(stage)) return null;
  if (state.history.some((h) => h.eventId === anchor.id)) return null;
  // 本阶段已插数：history 末段连续的（kind:"era" 或本阶段事件）条目中的时代卡数
  let eraInStage = 0;
  for (let i = state.history.length - 1; i >= 0; i--) {
    const h = state.history[i]!;
    if (h.kind === "era") {
      eraInStage += 1;
      continue;
    }
    if (EVENT_BY_ID.get(h.eventId)?.stage !== stage) break;
  }
  if (eraInStage >= ERA_PER_STAGE_MAX) return null;
  return anchor;
}

/** 时代卡入账：增量只走既有通道（deltas3→三观+四维派生 / resourceDeltas→资源）；history 记 kind:"era"。 */
export function applyEraCard(state: RunState): RunState {
  const event = eraEventFor(state);
  if (!event) throw new Error("applyEraCard：当前无时代卡");
  const withValues = applyValues(state, event.deltas3);
  const offsets = dimsOffsetOf(event.deltas3);
  const dims = { ...state.dims };
  for (const dim of DIM_KEYS) {
    const off = offsets[dim];
    if (typeof off === "number" && off !== 0) dims[dim] = clamp(dims[dim] + off);
  }
  const withResources = applyResources(withValues, event.resourceDeltas);
  const history = state.history.concat({
    eventId: event.id,
    option: -1,
    dimsAfter: { ...dims },
    kind: "era",
  });
  return { ...withResources, dims, history };
}
