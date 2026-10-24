// 存档：localStorage 单 key 读写 + schema v2 校验 + v1→v2 迁移。损坏/不识别一律返回 null
// 且绝不静默清档，由 UI 据此给出「存档无法读取，可重新开始」的提示（plan/v3/02 §八、plan/02 §六）。
import birthMapRaw from "../data/birth-map.json";
import { seedCodeOf } from "../engine/seedcode";
import {
  DIM_KEYS,
  NPC_TAGS,
  RES_KEYS,
  STAGES,
  VALUES_AXES,
  type BirthEnv,
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

export const SAVE_KEY = "xinlu.save.v2";
/** v1 旧 key：仅迁移链读取；v1 档成功迁入 v2 后清理（沿迁移链注释口径）。 */
export const LEGACY_SAVE_KEY = "xinlu.save.v1";
const SAVE_VERSION = 2;

const ENV_KEYS = ["era", "place", "mood", "style"] as const;
/** 顶层键集：seedCode 为 v3-M3'' 可选字段（旧 v2 信封 11 键与新 12 键两种形态都合法）。 */
const TOP_KEYS = [
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
] as const;
const OPTIONAL_TOP_KEYS = ["seedCode"] as const;
const LINE_KEYS = ["study", "career", "love", "friend", "health"] as const;

type BirthMap = Record<(typeof ENV_KEYS)[number], Record<string, unknown>>;
const BIRTH_MAP = birthMapRaw as unknown as BirthMap;

function store(): Storage {
  const s = globalThis.localStorage;
  if (!s) throw new Error("localStorage 不可用");
  return s;
}

export function save(state: RunState): void {
  store().setItem(
    SAVE_KEY,
    JSON.stringify({
      v: SAVE_VERSION,
      seed: state.seed,
      // v3-M3'' 种子码（v3/02 §八 ▸ M1'' 增补：可选字段；数值键 seed 为真值，码是它的文本形）
      seedCode: seedCodeOf(state.seed),
      env: state.env,
      stageIndex: state.stageIndex,
      dims: state.dims,
      history: state.history,
      flags: state.flags,
      values3: state.values3,
      resources: state.resources,
      lines: state.lines,
      npcs: state.npcs,
    }),
  );
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
    return migrate(parsed);
  }
  // v2 key 不在位：尝试 v1 旧档迁移（读 → 校验 → 补中位 → 写 v2 成功后清理旧 key）。
  const legacy = store().getItem(LEGACY_SAVE_KEY);
  if (legacy === null) return null;
  let parsedLegacy: unknown;
  try {
    parsedLegacy = JSON.parse(legacy);
  } catch {
    return null;
  }
  const migrated = migrateLegacyV1(parsedLegacy);
  if (!migrated) return null;
  try {
    save(migrated);
    store().removeItem(LEGACY_SAVE_KEY);
  } catch {
    // 写不进 v2：保留旧档原样，本次内存续玩（绝不静默清档）
  }
  return migrated;
}

export function clear(): void {
  store().removeItem(SAVE_KEY);
}

/** key 是否在位（无论内容合法与否）：UI 据此区分「无档」与「有档但损坏」，损坏提示绝不静默清档。 */
export function hasSaveKey(): boolean {
  const s = store();
  return s.getItem(SAVE_KEY) !== null || s.getItem(LEGACY_SAVE_KEY) !== null;
}

/** 版本迁移链：v2 为当前版（透传校验）。v1 档走 migrateLegacyV1。 */
function migrate(raw: unknown): RunState | null {
  if (!isRecord(raw) || raw.v !== SAVE_VERSION) return null;
  return validateV2(raw);
}

// ── v2 校验 ──

function validateV2(raw: Record<string, unknown>): RunState | null {
  // seedCode 可选（02 §八 ▸ M1'' 增补：读取缺省按 seed 数值键工作；码形非法也当缺省，不清档）
  if (!exactKeys(raw, TOP_KEYS) && !exactKeys(raw, [...TOP_KEYS, ...OPTIONAL_TOP_KEYS])) return null;
  if (typeof raw.seed !== "number") return null;
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
  return {
    seed: raw.seed,
    env,
    stageIndex,
    dims,
    history,
    flags: raw.flags as string[],
    values3,
    resources,
    lines,
    npcs,
  };
}

/** v1 → v2 迁移（plan/v3/02 §八）：三观/资源补初始中位、线进度补 0、NPC 补父母默认。 */
function migrateLegacyV1(raw: unknown): RunState | null {
  if (!isRecord(raw) || raw.v !== 1) return null;
  if (!exactKeys(raw, ["v", "seed", "env", "stageIndex", "dims", "history", "flags"])) return null;
  const base = validateV2({
    ...raw,
    v: SAVE_VERSION,
    values3: { worldview: 50, outlook: 50, values: 50 },
    resources: { mood: 60, money: 60, health: 60 },
    lines: { study: 0, career: 0, love: 0, friend: 0, health: 0 },
    npcs: [
      { id: "mother", bond: 70, tag: "亲密" },
      { id: "father", bond: 70, tag: "亲密" },
    ],
  });
  return base;
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
    if (typeof value !== "string") return null;
    if (!(value in BIRTH_MAP[key])) return null;
    env[key] = value;
  }
  return env;
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
    if (!isRecord(item) || !exactKeys(item, ["eventId", "option", "dimsAfter"])) return null;
    const { eventId, option, dimsAfter } = item;
    if (typeof eventId !== "string") return null;
    if (typeof option !== "number" || !Number.isInteger(option) || option < 0) return null;
    const dims = readDims(dimsAfter);
    if (!dims) return null;
    out.push({ eventId, option, dimsAfter: dims });
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
    if (!isRecord(item) || !exactKeys(item, ["id", "bond", "tag"])) return null;
    if (typeof item.id !== "string" || !item.id) return null;
    if (typeof item.bond !== "number" || !Number.isInteger(item.bond) || item.bond < 0 || item.bond > 100) {
      return null;
    }
    if (typeof item.tag !== "string" || !(NPC_TAGS as readonly string[]).includes(item.tag)) return null;
    out.push({ id: item.id, bond: item.bond, tag: item.tag as NpcState["tag"] });
  }
  return out;
}
