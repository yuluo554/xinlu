// 领域模型与枚举常量。数值口径唯一事实源是 plan/v3/02（v3 增量）与 plan/02（v1 基线），
// 本档只承载类型与枚举名，不表述口径。

export const DIM_KEYS = ["ei", "sn", "tf", "jp"] as const;
export type DimKey = (typeof DIM_KEYS)[number];

export interface Dims {
  ei: number;
  sn: number;
  tf: number;
  jp: number;
}

// ── v3 三观中间层（plan/v3/02 §二）──

export const VALUES_AXES = ["worldview", "outlook", "values"] as const;
export type ValuesAxis = (typeof VALUES_AXES)[number];

/** 三观向量：三轴 [0,100] 整数，初始 50。 */
export interface Values3 {
  worldview: number;
  outlook: number;
  values: number;
}

/** 三观增量（选项主效应 / 阶段漂移共用形状）。 */
export type Deltas3 = Partial<Record<ValuesAxis, number>>;

// ── v3 轻量资源（plan/v3/02 §三）──

export const RES_KEYS = ["mood", "money", "health"] as const;
export type ResKey = (typeof RES_KEYS)[number];

/** 资源三项 [0,100] 整数：心境 / 积蓄 / 健康，初始 60。 */
export interface Resources {
  mood: number;
  money: number;
  health: number;
}

export type ResourceDeltas = Partial<Record<ResKey, number>>;

// ── v3 多线系统（plan/v3/02 §四）──

export const LINE_KEYS = ["fate", "study", "career", "love", "friend", "health"] as const;
export type LineKey = (typeof LINE_KEYS)[number];

/** 五条支线的隐性进度（fate 无进度，不入此表）。 */
export type LineProgress = Record<Exclude<LineKey, "fate">, number>;

/** 线终态枚举（终局口径，plan/v3/02 §四）。 */
export const LINE_STATES = ["圆满", "平顺", "中断", "未启"] as const;
export type LineState = (typeof LINE_STATES)[number];

// ── v3 NPC（状态层；名字/职责注册表 = src/data/npcs.json，validate E.BOND 守门）──

export const NPC_TAGS = ["亲密", "疏离", "决裂", "羁绊"] as const;
export type NpcTag = (typeof NPC_TAGS)[number];

/** NPC 名字/职责/线别注册表条目（数据文件形状；状态层只存 id/bond/tag）。 */
export interface NpcProfile {
  name: string;
  role: string;
  line: LineKey;
}

export interface NpcState {
  id: string;
  bond: number;
  tag: NpcTag;
  /** 出生家庭 NPC 的本局姓名（names.json 池抽取；渲染时覆盖注册表名，plan/v4/02 §三 ▸ M1''' 增补）。 */
  name?: string;
}

/** 出生环境四要素；取值为 birth-map.json 的枚举键，代码不内联枚举清单。 */
export interface BirthEnv {
  era: string;
  place: string;
  mood: string;
  style: string;
}

// ── v4 出生画像六因素（plan/v4/02 §三；birthYear 顶层入 RunState，place 沿 env.place）──

export const PROFILE_REGIONS = ["南方", "北方"] as const;
export const PROFILE_STRUCTURES = ["独生", "双孩", "多孩", "单亲", "隔代"] as const;
export const PROFILE_JOBS = ["工人", "农民", "个体", "教师医生", "公职", "待岗"] as const;
export const PROFILE_WEALTHS = ["拮据", "一般", "宽裕"] as const;

export interface BirthProfile {
  region: (typeof PROFILE_REGIONS)[number];
  structure: (typeof PROFILE_STRUCTURES)[number];
  parentsJob: (typeof PROFILE_JOBS)[number];
  wealth: (typeof PROFILE_WEALTHS)[number];
}

export interface HistoryEntry {
  eventId: string;
  option: number;
  dimsAfter: Dims;
  /** v4 时代卡条目（plan/v4/02 §二 ▸ M1''' 增补）：option = -1 哨兵（无选项）。 */
  kind?: "era";
}

// ── v4 年代事件库（plan/v4/02 §二；数据文件 src/data/era-events.json）──

export type EraScope = "national" | "international";
/** 事实三态：已核对 = 公共事实可核；典型值 = 氛围级典型生活（不声称具体事实）；待核仅过程态。
 *  枚举字面量的首个取值带勾选符号（plan/v4/02 §二 定稿，era-events.json 55 条同值，validate E 区守门）；
 *  它是数据枚举、不进任何渲染路径，不是界面 emoji。 */
export type EraCheckStatus = "✅已核对" | "典型值" | "待核"; // taste-skill-ignore - 数据枚举字面量，非 UI

export interface EraEvent {
  id: string;
  year: number;
  scope: EraScope;
  titleHint: string;
  text: string;
  deltas3: Deltas3;
  resourceDeltas: ResourceDeltas;
  stageFit: Stage[];
  checkStatus: EraCheckStatus;
}

/**
 * 运行态。v1 五字段 + v3 状态层扩展（plan/v3/02 §八）+ v4 历法/画像扩展
 * （plan/v4/02 §一/§三/§九 ▸ M1''' 增补）：birthYear/profile 与存档信封 xinlu.save.v3 同构；
 * 旧档经迁移函数补齐扩展字段，绝不静默清档。
 */
export interface RunState {
  seed: number;
  env: BirthEnv;
  birthYear: number;
  profile: BirthProfile;
  stageIndex: number;
  dims: Dims;
  history: HistoryEntry[];
  flags: string[];
  values3: Values3;
  resources: Resources;
  lines: LineProgress;
  npcs: NpcState[];
  /** 历法迁移标记（v2→v3 迁移局 true；终局提示一句，plan/v4/02 §九 ▸ M1''' 增补）。 */
  migrated?: boolean;
}

export type EventType = "main" | "context" | "critical" | "rescue";

export interface EventOption {
  text: string;
  /** v3 主效应（三观增量）；v1 的四维直改 deltas 字段已从 schema 移除。 */
  deltas3: Deltas3;
  resourceDeltas: ResourceDeltas;
  /** 关系增量（v3/02 §五 ▸ M3'' 增补）：键 = npcs.json 注册 id，|Δ| ≤15，经 values 轴衰减后入账。 */
  bondDeltas?: Record<string, number>;
  /** 选项可用门槛：所列资源各 ≥ 阈值才可选（仅支线选项使用，plan/v3/02 §三）。 */
  requires?: Partial<Record<ResKey, number>>;
  flag?: string;
  aftermath?: string;
}

export interface GameEvent {
  id: string;
  stage: Stage;
  type: EventType;
  line: LineKey;
  ageHint: string;
  ageMonths: number;
  /** 支线进度增益；缺省按类型 context 8 / critical 15，rescue 恒 0（plan/v3/02 §四）。 */
  lineGain?: number;
  /** type = rescue 时必填：触发的资源键。 */
  rescue?: ResKey;
  pre?: string[];
  text: string;
  options: EventOption[];
}

export interface EndingCond {
  dims?: Partial<Record<DimKey, [number, number]>>;
  flags?: string[];
  notFlags?: string[];
}

export interface Ending {
  id: string;
  title: string;
  typeText?: string;
  cond?: EndingCond;
  text: string;
  retrospect: string[];
}

export const STAGES = [
  "infant",
  "toddler",
  "childhood",
  "teen",
  "youth",
  "adult",
  "midlife",
  "elder",
] as const;
export type Stage = (typeof STAGES)[number];
