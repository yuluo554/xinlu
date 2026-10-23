// 存档：localStorage 单 key 读写 + schema v1 校验。损坏/不识别一律返回 null 且绝不静默清档，
// 由 UI 据此给出「存档无法读取，可重新开始」的提示（plan/02 §六、plan/03 §3）。
import birthMapRaw from "../data/birth-map.json";
import { DIM_KEYS, STAGES, type BirthEnv, type DimKey, type Dims, type HistoryEntry, type RunState } from "../engine/model";

export const SAVE_KEY = "xinlu.save.v1";
const SAVE_VERSION = 1;

const ENV_KEYS = ["era", "place", "mood", "style"] as const;
const TOP_KEYS = ["v", "seed", "env", "stageIndex", "dims", "history", "flags"] as const;

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
      env: state.env,
      stageIndex: state.stageIndex,
      dims: state.dims,
      history: state.history,
      flags: state.flags,
    }),
  );
}

export function load(): RunState | null {
  const raw = store().getItem(SAVE_KEY);
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return migrate(parsed);
}

export function clear(): void {
  store().removeItem(SAVE_KEY);
}

/** 版本迁移链：v1 为首版（透传校验）。今后破坏性改动 v+1 时在此追加迁移函数，迁入新 key 后清理旧 key。 */
function migrate(raw: unknown): RunState | null {
  if (!isRecord(raw) || raw.v !== SAVE_VERSION) return null;
  return validateV1(raw);
}

function validateV1(raw: Record<string, unknown>): RunState | null {
  if (!exactKeys(raw, TOP_KEYS)) return null;
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
  return { seed: raw.seed, env, stageIndex, dims, history, flags: raw.flags as string[] };
}

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
