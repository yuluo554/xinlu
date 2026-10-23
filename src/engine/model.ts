// 领域模型与枚举常量。数值口径唯一事实源是 plan/02，本档只承载类型与枚举名，不表述口径。

export const DIM_KEYS = ["ei", "sn", "tf", "jp"] as const;
export type DimKey = (typeof DIM_KEYS)[number];

export interface Dims {
  ei: number;
  sn: number;
  tf: number;
  jp: number;
}

/** 出生环境四要素；取值为 birth-map.json 的枚举键，代码不内联枚举清单。 */
export interface BirthEnv {
  era: string;
  place: string;
  mood: string;
  style: string;
}

export interface HistoryEntry {
  eventId: string;
  option: number;
  dimsAfter: Dims;
}

/** 与 plan/02 §六存档 schema v1 同构；版本号 v 是存档信封字段，不属于 RunState。 */
export interface RunState {
  seed: number;
  env: BirthEnv;
  stageIndex: number;
  dims: Dims;
  history: HistoryEntry[];
  flags: string[];
}

export type EventType = "main" | "context" | "critical";

export interface EventOption {
  text: string;
  deltas: Partial<Record<DimKey, number>>;
  flag?: string;
  aftermath?: string;
}

export interface GameEvent {
  id: string;
  stage: Stage;
  type: EventType;
  ageHint: string;
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
