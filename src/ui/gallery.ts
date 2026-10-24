// 16 型图鉴（v2/03 §4 契约；存储口径唯一事实源 plan/v2/02 §三，本文件不复写数值）。
// 独立 key xinlu.gallery.v2，不读写 xinlu.save.v1（K6 schema 冻结不动）；
// 损坏 → 视为空图鉴重建，不提示不清档（图鉴无用户可损失内容，02 §三刻意放宽并记录理由）。
import endingsRaw from "../data/endings.json" with { type: "json" };
import type { Dims, Ending } from "../engine/model";

export const GALLERY_KEY = "xinlu.gallery.v2";
const GALLERY_VERSION = 2;

// 16 型封闭集 = 四维字母的笛卡尔积（与引擎 mbtiLetters 同一字母域；不内联 16 型清单）。
const AXIS_LETTERS = [
  ["E", "I"],
  ["S", "N"],
  ["T", "F"],
  ["J", "P"],
] as const;
export const GALLERY_TYPES: readonly string[] = AXIS_LETTERS.reduce<string[]>(
  (acc, axis) => acc.flatMap((prefix) => axis.map((letter) => prefix + letter)),
  [""],
);

/** 结局枚举（endings.json 文件序；兜底结局居末位，validate 保证）。图鉴结局记录与 endings 键封闭校验的唯一来源。 */
export const ENDING_META: ReadonlyArray<{ id: string; title: string }> = (
  endingsRaw as Ending[]
).map((e) => ({ id: e.id, title: e.title }));

export interface GalleryTypeEntry {
  count: number;
  firstSeenAt: number;
}

/** 与 02 §三 schema 同构；v 是信封版本字段。 */
export interface GalleryData {
  v: number;
  types: Record<string, GalleryTypeEntry>;
  endings: Record<string, number>;
  runs: number;
}

export function emptyGallery(): GalleryData {
  return { v: GALLERY_VERSION, types: {}, endings: {}, runs: 0 };
}

function store(): Storage {
  const s = globalThis.localStorage;
  if (!s) throw new Error("localStorage 不可用");
  return s;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function exactKeys(obj: Record<string, unknown>, keys: readonly string[]): boolean {
  const want = new Set(keys);
  const got = Object.keys(obj);
  return got.length === want.size && got.every((k) => want.has(k));
}

/** schema 校验（02 §三）：16 型键封闭 / endings 键 ⊆ 结局枚举 / 数值形状；任何不符 → null（调用方视为空图鉴）。 */
function validateGallery(raw: unknown): GalleryData | null {
  if (!isRecord(raw) || !exactKeys(raw, ["v", "types", "endings", "runs"])) return null;
  if (raw.v !== GALLERY_VERSION) return null;
  if (!isRecord(raw.types) || !isRecord(raw.endings)) return null;
  const types: Record<string, GalleryTypeEntry> = {};
  for (const [key, value] of Object.entries(raw.types)) {
    if (!GALLERY_TYPES.includes(key)) return null;
    if (!isRecord(value) || !exactKeys(value, ["count", "firstSeenAt"])) return null;
    const { count, firstSeenAt } = value;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) return null;
    if (typeof firstSeenAt !== "number" || !Number.isFinite(firstSeenAt)) return null;
    types[key] = { count, firstSeenAt };
  }
  const endings: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw.endings)) {
    if (!ENDING_META.some((e) => e.id === key)) return null;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1) return null;
    endings[key] = value;
  }
  if (typeof raw.runs !== "number" || !Number.isInteger(raw.runs) || raw.runs < 0) return null;
  return { v: GALLERY_VERSION, types, endings, runs: raw.runs };
}

/** 读图鉴：无 key / 损坏 / 存储不可用一律回空图鉴（不提示不清档，02 §三）。永不 throw。 */
export function loadGallery(): GalleryData {
  try {
    const raw = store().getItem(GALLERY_KEY);
    if (raw === null) return emptyGallery();
    return validateGallery(JSON.parse(raw)) ?? emptyGallery();
  } catch {
    return emptyGallery();
  }
}

export interface RunRecordInput {
  letters: string;
  endingId: string;
  now: number;
}

/** 记一笔通关：runs +1、型计数/首见时间、结局计数；损坏旧档在此次写入时被空图鉴重建覆盖。 */
export function recordRun(input: RunRecordInput): GalleryData {
  if (!GALLERY_TYPES.includes(input.letters)) {
    throw new Error(`recordRun：未知型号「${input.letters}」（16 型封闭集之外）`);
  }
  if (!ENDING_META.some((e) => e.id === input.endingId)) {
    throw new Error(`recordRun：未知结局 id「${input.endingId}」（endings 枚举之外）`);
  }
  const prev = loadGallery();
  const typeEntry = prev.types[input.letters];
  const next: GalleryData = {
    v: GALLERY_VERSION,
    types: {
      ...prev.types,
      [input.letters]: {
        count: (typeEntry?.count ?? 0) + 1,
        firstSeenAt: typeEntry?.firstSeenAt ?? input.now,
      },
    },
    endings: { ...prev.endings, [input.endingId]: (prev.endings[input.endingId] ?? 0) + 1 },
    runs: prev.runs + 1,
  };
  store().setItem(GALLERY_KEY, JSON.stringify(next));
  return next;
}

// 四维高位字母（与 engine.mbtiLetters 的高位侧一致：E/S/F/J）。单测用
// mbtiLetters(representativeDims(t), env) === t 全 16 型回环钉死，不构成第二表述。
const HIGH_LETTERS = ["E", "S", "F", "J"] as const;
const DIM_ORDER = ["ei", "sn", "tf", "jp"] as const;

/** 展示用代表四维：高位字母侧 75 / 低位侧 25。仅用于图鉴格 avatar 渲染，不入存档、不参与结局判定。 */
export function representativeDims(letters: string): Dims {
  const dims = { ei: 25, sn: 25, tf: 25, jp: 25 };
  [...letters].forEach((letter, i) => {
    const key = DIM_ORDER[i];
    if (key && HIGH_LETTERS[i] === letter) dims[key] = 75;
  });
  return dims;
}
