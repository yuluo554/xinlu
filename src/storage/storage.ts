// 存档：localStorage 单 key 读写 + schema v3 校验 + v1/v2→v3 迁移链。损坏/不识别一律返回 null
// 且绝不静默清档，由 UI 据此给出「存档无法读取，可重新开始」的提示（plan/v4/02 §九 ▸ M1''' 增补、plan/02 §六）。
import birthMapRaw from "../data/birth-map.json";
import { deriveBirth } from "../engine/engine";
import { generateFamily } from "../engine/family";
import { seedCodeOf } from "../engine/seedcode";
import {
  DIM_KEYS,
  NPC_TAGS,
  RES_KEYS,
  STAGES,
  VALUES_AXES,
  type BirthEnv,
  type BirthProfile,
  type DimKey,
  type Dims,
  type HistoryEntry,
  type LineProgress,
  type NpcState,
  type ResKey,
  type Resources,
  type RunState,
  type Values3,
  type ValuesAxis,
} from "../engine/model";
import { eraMidYearOf } from "../engine/year";

export const SAVE_KEY = "xinlu.save.v3";
/** v2 旧 key：仅迁移链读取；v2 档成功迁入 v3 后清理。 */
export const LEGACY_SAVE_KEY_V2 = "xinlu.save.v2";
/** v1 更旧 key：仅迁移链读取；v1 档成功迁入后清理。 */
export const LEGACY_SAVE_KEY_V1 = "xinlu.save.v1";
const SAVE_VERSION = 3;

const ENV_KEYS = ["era", "place", "mood", "style"] as const;
const PROFILE_KEYS = ["region", "structure", "parentsJob", "wealth"] as const;
/** 顶层键集：seedCode 与 migrated 为可选字段（旧 v3 信封两种形态都合法）。 */
const TOP_KEYS = [
  "v",
  "seed",
  "birthYear",
  "profile",
  "env",
  "stageIndex",
  "dims",
  "history",
  "flags",
  "values3",
  "resources",
  "lines",
  "npcs",
] as const;
const OPTIONAL_TOP_KEYS = ["seedCode", "migrated"] as const;
const LINE_KEYS = ["study", "career", "love", "friend", "health"] as const;

type BirthMap = Record<string, Record<string, unknown>>;
const BIRTH_MAP = birthMapRaw as unknown as BirthMap;

function store(): Storage {
  const s = globalThis.localStorage;
  if (!s) throw new Error("localStorage 不可用");
  return s;
}

export function save(state: RunState): void {
  const envelope: Record<string, unknown> = {
    v: SAVE_VERSION,
    seed: state.seed,
    // v3-M3'' 种子码（可选字段；数值键 seed 为真值，码是它的文本形）
    seedCode: seedCodeOf(state.seed),
    birthYear: state.birthYear,
    profile: { ...state.profile },
    env: state.env,
    stageIndex: state.stageIndex,
    dims: state.dims,
    history: state.history,
    flags: state.flags,
    values3: state.values3,
    resources: state.resources,
    lines: state.lines,
    npcs: state.npcs,
  };
  if (state.migrated) envelope.migrated = true;
  store().setItem(SAVE_KEY, JSON.stringify(envelope));
}

export function load(): RunState | null {
  const raw = store().getItem(SAVE_KEY);
  if (raw !== null) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    return migrateCurrent(parsed);
  }
  // v3 key 不在位：尝试 v2 旧档迁移（读 → 校验 → 补派生 → 写 v3 成功后清理旧 key）。
  const legacyV2 = store().getItem(LEGACY_SAVE_KEY_V2);
  if (legacyV2 !== null) {
    let parsedV2: unknown;
    try {
      parsedV2 = JSON.parse(legacyV2);
    } catch {
      return null;
    }
    const migratedV2 = migrateLegacyV2ToV3(parsedV2);
    if (migratedV2) {
      try {
        save(migratedV2);
        store().removeItem(LEGACY_SAVE_KEY_V2);
      } catch {
        // 写不进 v3：保留旧档原样，本次内存续玩（绝不静默清档）
      }
    }
    return migratedV2;
  }
  // v1 更旧档：先走 v1→v2 补齐链，再走 v2→v3。
  const legacyV1 = store().getItem(LEGACY_SAVE_KEY_V1);
  if (legacyV1 === null) return null;
  let parsedV1: unknown;
  try {
    parsedV1 = JSON.parse(legacyV1);
  } catch {
    return null;
  }
  const v2Shape = migrateLegacyV1ToV2(parsedV1);
  if (!v2Shape) return null;
  const migrated = migrateLegacyV2ToV3(v2Shape);
  if (migrated) {
    try {
      save(migrated);
      store().removeItem(LEGACY_SAVE_KEY_V1);
    } catch {
      // 存储不可用：内存续玩
    }
  }
  return migrated;
}

export function clear(): void {
  store().removeItem(SAVE_KEY);
}

/** key 是否在位（无论内容合法与否）：UI 据此区分「无档」与「有档但损坏」，损坏提示绝不静默清档。 */
export function hasSaveKey(): boolean {
  const s = store();
  return s.getItem(SAVE_KEY) !== null || s.getItem(LEGACY_SAVE_KEY_V2) !== null || s.getItem(LEGACY_SAVE_KEY_V1) !== null;
}

/** v3 当前版迁移入口：只透传校验。 */
function migrateCurrent(raw: unknown): RunState | null {
  if (!isRecord(raw) || raw.v !== SAVE_VERSION) return null;
  return validateV3(raw);
}

// ── v3 校验 ──

function validateV3(raw: Record<string, unknown>): RunState | null {
  // seedCode/migrated 可选（缺省按 seed 数值键/非迁移局工作；码形非法也当缺省，不清档）
  if (
    !exactKeys(raw, TOP_KEYS) &&
    !exactKeys(raw, [...TOP_KEYS, "seedCode"]) &&
    !exactKeys(raw, [...TOP_KEYS, "migrated"]) &&
    !exactKeys(raw, [...TOP_KEYS, ...OPTIONAL_TOP_KEYS])
  ) {
    return null;
  }
  const seed = raw.seed;
  if (typeof seed !== "number") return null;
  const birthYear = raw.birthYear;
  if (typeof birthYear !== "number" || !Number.isInteger(birthYear) || birthYear < 1955 || birthYear > 2015) {
    return null;
  }
  const profile = readProfile(raw.profile);
  if (!profile) return null;
  const env = readEnv(raw.env);
  if (!env) return null;
  const stageIndex = raw.stageIndex;
  if (
    typeof stageIndex !== "number" ||
    !Number.isInteger(stageIndex) ||
    stageIndex < 0 ||
    stageIndex > STAGES.length
  ) {
    return null;
  }
  const dims = readDims(raw.dims);
  if (!dims) return null;
  const history = readHistory(raw.history);
  if (!history) return null;
  if (!Array.isArray(raw.flags) || raw.flags.some((f) => typeof f !== "string")) return null;
  const values3 = readValues3(raw.values3);
  if (!values3) return null;
  const resources = readResources(raw.resources);
  if (!resources) return null;
  const lines = readLines(raw.lines);
  if (!lines) return null;
  const npcs = readNpcs(raw.npcs);
  if (!npcs) return null;
  if (raw.migrated !== undefined && typeof raw.migrated !== "boolean") return null;
  return {
    seed,
    birthYear,
    profile,
    env,
    stageIndex,
    dims,
    history,
    flags: raw.flags as string[],
    values3,
    resources,
    lines,
    npcs,
    ...(raw.migrated === true ? { migrated: true } : {}),
  };
}

// ── v2 → v3 迁移（plan/v4/02 §九 ▸ M1''' 增补）──

/**
 * v2 → v3：birthYear 由 era 中值派生、profile 按存档 seed 复算、家庭补生成（既有 NPC 的
 * bond/tag 保留，只补缺失成员与缺失姓名）；迁移局打 migrated 标记（终局提示一句）。
 */
function migrateLegacyV2ToV3(raw: unknown): RunState | null {
  if (!isRecord(raw) || raw.v !== 2) return null;
  const v2Keys = [
    "v",
    "seed",
    "env",
    "stageIndex",
    "dims",
    "history",
    "flags",
    "values3",
    "resources",
    "lines",
    "npcs",
  ];
  if (!exactKeys(raw, v2Keys) && !exactKeys(raw, [...v2Keys, "seedCode"])) return null;
  const env = readEnv(raw.env);
  if (!env) return null;
  const seed = raw.seed;
  if (typeof seed !== "number") return null;
  const birthYear = eraMidYearOf(env.era);
  const { profile } = deriveBirth(env, seed);
  const base = validateV3({
    ...raw,
    v: SAVE_VERSION,
    birthYear,
    profile,
    migrated: true,
  });
  if (!base) return null;
  // 家庭补生成：既有 NPC 保留原 bond/tag；缺失成员与缺失姓名由生成器补齐（同口径同 seed 可复算）。
  const family = generateFamily(env, birthYear, profile, seed);
  const byId = new Map(base.npcs.map((n) => [n.id, n]));
  const merged: NpcState[] = base.npcs.map((n) => {
    const gen = family.find((f) => f.id === n.id);
    return gen && !n.name ? { ...n, name: gen.name } : n;
  });
  for (const gen of family) {
    if (!byId.has(gen.id)) merged.push(gen);
  }
  return { ...base, npcs: merged };
}

/** v1 → v2 形状补齐（plan/v3/02 §八）：三观/资源补初始中位、线进度补 0、NPC 补父母默认。 */
function migrateLegacyV1ToV2(raw: unknown): Record<string, unknown> | null {
  if (!isRecord(raw) || raw.v !== 1) return null;
  if (!exactKeys(raw, ["v", "seed", "env", "stageIndex", "dims", "history", "flags"])) return null;
  return {
    ...raw,
    v: 2,
    values3: { worldview: 50, outlook: 50, values: 50 },
    resources: { mood: 60, money: 60, health: 60 },
    lines: { study: 0, career: 0, love: 0, friend: 0, health: 0 },
    npcs: [
      { id: "mother", bond: 70, tag: "亲密" },
      { id: "father", bond: 70, tag: "亲密" },
    ],
  };
}

// ── 共用读取器 ──

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function exactKeys(obj: Record<string, unknown>, keys: readonly string[]): boolean {
  const want = new Set(keys);
  const got = Object.keys(obj);
  return got.length === want.size && got.every((k) => want.has(k));
}

function readEnv(v: unknown): BirthEnv | null {
  if (!isRecord(v) || !exactKeys(v, ENV_KEYS)) return null;
  const env = {} as Record<(typeof ENV_KEYS)[number], string>;
  for (const key of ENV_KEYS) {
    const value = v[key];
    const group = BIRTH_MAP[key];
    if (typeof value !== "string" || !group || !(value in group)) return null;
    env[key] = value;
  }
  return env;
}

function readProfile(v: unknown): BirthProfile | null {
  if (!isRecord(v) || !exactKeys(v, PROFILE_KEYS)) return null;
  const profile = {} as Record<(typeof PROFILE_KEYS)[number], string>;
  for (const key of PROFILE_KEYS) {
    const value = v[key];
    const group = BIRTH_MAP[key];
    if (typeof value !== "string" || !group || !(value in group)) return null;
    profile[key] = value;
  }
  return profile as BirthProfile;
}

function readDims(v: unknown): Dims | null {
  if (!isRecord(v) || !exactKeys(v, DIM_KEYS)) return null;
  const dims = {} as Record<DimKey, number>;
  for (const dim of DIM_KEYS) {
    const value = v[dim];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    dims[dim] = value;
  }
  return dims;
}

function readHistory(v: unknown): HistoryEntry[] | null {
  if (!Array.isArray(v)) return null;
  const out: HistoryEntry[] = [];
  for (const item of v) {
    const isEra = isRecord(item) && item.kind === "era";
    if (!isRecord(item)) return null;
    const keys = isEra ? ["eventId", "option", "dimsAfter", "kind"] : ["eventId", "option", "dimsAfter"];
    if (!exactKeys(item, keys)) return null;
    const { eventId, option, dimsAfter } = item;
    if (typeof eventId !== "string") return null;
    if (typeof option !== "number" || !Number.isInteger(option)) return null;
    // 时代卡 option = -1 哨兵；其余条目 option ≥ 0（plan/v4/02 §九 ▸ M1''' 增补）
    if (isEra ? option !== -1 : option < 0) return null;
    const dims = readDims(dimsAfter);
    if (!dims) return null;
    out.push(isEra ? { eventId, option, dimsAfter: dims, kind: "era" } : { eventId, option, dimsAfter: dims });
  }
  return out;
}

function readValues3(v: unknown): Values3 | null {
  if (!isRecord(v) || !exactKeys(v, VALUES_AXES)) return null;
  const out = {} as Values3;
  for (const axis of VALUES_AXES) {
    const value = v[axis];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) return null;
    out[axis as ValuesAxis] = value;
  }
  return out;
}

function readResources(v: unknown): Resources | null {
  if (!isRecord(v) || !exactKeys(v, RES_KEYS)) return null;
  const out = {} as Resources;
  for (const key of RES_KEYS) {
    const value = v[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) return null;
    out[key as ResKey] = value;
  }
  return out;
}

function readLines(v: unknown): LineProgress | null {
  if (!isRecord(v) || !exactKeys(v, LINE_KEYS)) return null;
  const out = {} as LineProgress;
  for (const key of LINE_KEYS) {
    const value = v[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) return null;
    out[key as keyof LineProgress] = value;
  }
  return out;
}

function readNpcs(v: unknown): NpcState[] | null {
  if (!Array.isArray(v)) return null;
  const out: NpcState[] = [];
  for (const item of v) {
    if (!isRecord(item) || (!exactKeys(item, ["id", "bond", "tag"]) && !exactKeys(item, ["id", "bond", "tag", "name"]))) {
      return null;
    }
    if (typeof item.id !== "string" || !item.id) return null;
    if (typeof item.bond !== "number" || !Number.isInteger(item.bond) || item.bond < 0 || item.bond > 100) {
      return null;
    }
    if (typeof item.tag !== "string" || !(NPC_TAGS as readonly string[]).includes(item.tag)) return null;
    if (item.name !== undefined && (typeof item.name !== "string" || !item.name.trim())) return null;
    out.push({
      id: item.id,
      bond: item.bond,
      tag: item.tag as NpcState["tag"],
      ...(typeof item.name === "string" ? { name: item.name } : {}),
    });
  }
  return out;
}
