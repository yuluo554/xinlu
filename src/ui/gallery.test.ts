// 16 型图鉴单测（v2/03 §4 验收：读写 / 损坏重建 / 16 型封闭 / endings 键 ⊆ 枚举）。
// localStorage 用内存 stub（套路同 src/storage/storage.test.ts）；一律黑盒走 loadGallery/recordRun。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRun, mbtiLetters } from "../engine/engine";
import portraitsRaw from "../data/portraits.json" with { type: "json" };
import {
  ENDING_META,
  GALLERY_KEY,
  GALLERY_TYPES,
  emptyGallery,
  loadGallery,
  recordRun,
  representativeDims,
} from "./gallery";

class MemoryStorage implements Storage {
  constructor(private readonly backing: Map<string, string>) {}
  get length(): number {
    return this.backing.size;
  }
  clear(): void {
    this.backing.clear();
  }
  getItem(key: string): string | null {
    return this.backing.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.backing.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.backing.delete(key);
  }
  setItem(key: string, value: string): void {
    this.backing.set(key, String(value));
  }
}

let backing: Map<string, string>;

beforeEach(() => {
  backing = new Map();
  vi.stubGlobal("localStorage", new MemoryStorage(backing));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const T0 = 1730000000000;
const record = (letters = "INTJ", endingId = "end-07", now = T0) => recordRun({ letters, endingId, now });

describe("02 §三 schema：读写", () => {
  it("无 key 读回空图鉴（runs 0 / 两表皆空 / v 2）", () => {
    expect(loadGallery()).toEqual(emptyGallery());
    expect(loadGallery()).toEqual({ v: 2, types: {}, endings: {}, runs: 0 });
  });

  it("recordRun 记一笔并回读一致（型计数 + 首见 + 结局计数 + runs）", () => {
    const g = record();
    expect(g.types.INTJ).toEqual({ count: 1, firstSeenAt: T0 });
    expect(g.endings["end-07"]).toBe(1);
    expect(g.runs).toBe(1);
    expect(loadGallery()).toEqual(g);
  });

  it("重复通关累计：count +1、firstSeenAt 保持首见、runs 递增；异型分键", () => {
    record();
    const second = record("INTJ", "end-02", T0 + 1000);
    expect(second.types.INTJ).toEqual({ count: 2, firstSeenAt: T0 });
    expect(second.runs).toBe(2);
    const third = record("ESFP", "end-02", T0 + 2000);
    expect(third.types.ESFP).toEqual({ count: 1, firstSeenAt: T0 + 2000 });
    expect(third.endings["end-02"]).toBe(2);
    expect(Object.keys(third.types).sort()).toEqual(["ESFP", "INTJ"]);
  });

  it("16 型 × 9 结局全量各记一笔：键集全开、runs = 25（封闭集全律动）", () => {
    let g = emptyGallery();
    for (const t of GALLERY_TYPES) g = recordRun({ letters: t, endingId: "end-01", now: T0 });
    for (const e of ENDING_META) g = recordRun({ letters: "INTJ", endingId: e.id, now: T0 });
    expect(Object.keys(g.types)).toHaveLength(16);
    expect(Object.keys(g.endings).sort()).toEqual([...ENDING_META.map((e) => e.id)].sort());
    expect(g.runs).toBe(25);
    expect(loadGallery()).toEqual(g);
  });
});

describe("02 §三 schema：损坏 → 视为空图鉴重建（不提示不清档）", () => {
  it("非 JSON / 非 v2 / 缺键 / 多键 / 表非对象 → 一律回空图鉴", () => {
    for (const raw of [
      "not json{",
      JSON.stringify({ v: 1, types: {}, endings: {}, runs: 0 }),
      JSON.stringify({ v: 2, types: {}, endings: {} }),
      JSON.stringify({ v: 2, types: {}, endings: {}, runs: 0, extra: 1 }),
      JSON.stringify({ v: 2, types: [], endings: {}, runs: 0 }),
    ]) {
      backing.set(GALLERY_KEY, raw);
      expect(loadGallery()).toEqual(emptyGallery());
    }
  });

  it("损坏后 recordRun 从空重建：旧污染不残留、本笔在册", () => {
    backing.set(GALLERY_KEY, "{{{broken");
    const g = record("ENFP", "end-04");
    expect(g.types.ENFP).toEqual({ count: 1, firstSeenAt: T0 });
    expect(g.runs).toBe(1);
    expect(Object.keys(g.types)).toEqual(["ENFP"]);
  });

  it("存储不可用（localStorage 缺失）读侧永不 throw，回空图鉴", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadGallery()).toEqual(emptyGallery());
  });
});

describe("封闭校验：16 型封闭 / endings 键 ⊆ 结局枚举", () => {
  it("types 混入 16 型之外的键 → 空图鉴", () => {
    backing.set(
      GALLERY_KEY,
      JSON.stringify({ v: 2, types: { INTJ: { count: 1, firstSeenAt: T0 }, XXXX: { count: 1, firstSeenAt: T0 } }, endings: {}, runs: 1 }),
    );
    expect(loadGallery()).toEqual(emptyGallery());
  });

  it("型条目形状错（count 0 / 负数 / 小数、firstSeenAt 非数、多键）→ 空图鉴", () => {
    for (const entry of [
      { count: 0, firstSeenAt: T0 },
      { count: -1, firstSeenAt: T0 },
      { count: 1.5, firstSeenAt: T0 },
      { count: 1 },
      { count: 1, firstSeenAt: "x" },
      { count: 1, firstSeenAt: T0, extra: 1 },
    ]) {
      backing.set(
        GALLERY_KEY,
        JSON.stringify({ v: 2, types: { INTJ: entry }, endings: {}, runs: 1 }),
      );
      expect(loadGallery()).toEqual(emptyGallery());
    }
  });

  it("endings 混入枚举之外键（end-99）或计数形状错 → 空图鉴", () => {
    backing.set(
      GALLERY_KEY,
      JSON.stringify({ v: 2, types: {}, endings: { "end-99": 1 }, runs: 1 }),
    );
    expect(loadGallery()).toEqual(emptyGallery());
    backing.set(
      GALLERY_KEY,
      JSON.stringify({ v: 2, types: {}, endings: { "end-01": 0 }, runs: 1 }),
    );
    expect(loadGallery()).toEqual(emptyGallery());
  });

  it("recordRun 输入防御：未知型号 / 未知结局 id → throw（fail-fast）", () => {
    expect(() => record("ABCD")).toThrow(/未知型号/);
    expect(() => record("INTJ", "end-42")).toThrow(/未知结局/);
  });
});

describe("封闭集派生与展示代表四维", () => {
  it("GALLERY_TYPES：16 个、唯一、均匹配四维字母域，且与 portraits.json 键集相等", () => {
    expect(GALLERY_TYPES).toHaveLength(16);
    expect(new Set(GALLERY_TYPES).size).toBe(16);
    for (const t of GALLERY_TYPES) expect(t).toMatch(/^[EI][SN][TF][JP]$/);
    expect([...GALLERY_TYPES].sort()).toEqual(Object.keys(portraitsRaw).sort());
  });

  it("ENDING_META：9 条、id 与 endings.json 文件序一致（兜底居末）、标题非空", () => {
    expect(ENDING_META).toHaveLength(9);
    expect(ENDING_META.map((e) => e.id)).toEqual([
      "end-01", "end-02", "end-03", "end-04", "end-05", "end-06", "end-07", "end-08", "end-fallback",
    ]);
    for (const e of ENDING_META) expect(e.title.length).toBeGreaterThan(0);
  });

  it("representativeDims 经引擎 mbtiLetters 回环还原原型号（全 16 型 × 两个出生环境）", () => {
    const envs = [
      { era: "90s", place: "小城", mood: "和睦", style: "权威" },
      { era: "10s", place: "农村", mood: "单亲", style: "忽视" },
    ];
    for (const t of GALLERY_TYPES) {
      for (const env of envs) {
        // v4：mbtiLetters 需画像第三参（代表值远离 50，任取合法画像不改变字母）
        expect(mbtiLetters(representativeDims(t), env, createRun(env, 1).profile)).toBe(t);
      }
    }
  });

  it("representativeDims 确定性：同型号两次调用全等", () => {
    expect(representativeDims("INTJ")).toEqual(representativeDims("INTJ"));
    expect(representativeDims("ESFP")).toEqual({ ei: 75, sn: 75, tf: 75, jp: 25 });
  });
});
