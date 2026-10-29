// 语义配图单测（plan/v5/02 §九 D9）：标签封闭、映射无死键、取图稳定（同事件恒同图）、
// 覆盖 ≥60%、豁免清单可从数据复算。判据面 = scene-map.json 与 icon-map.json 的一致性；
// 逐张对文案的人工留痕在 docs/v5-scenes.md。
import { describe, expect, it } from "vitest";
import iconMapRaw from "../data/icon-map.json" with { type: "json" };
import eventsRaw from "../data/events.json" with { type: "json" };
import sceneMapRaw from "../data/scene-map.json" with { type: "json" };
import { SCENE_FILES, SCENE_TAGS, sceneCoverage, sceneFileOf, sceneTagOf } from "./scenes";

const ICONS = iconMapRaw as Record<string, { objectKey: string | null }>;
const EVENTS = eventsRaw as unknown as Array<{ id: string }>;
const MAP = sceneMapRaw as unknown as { tags: Record<string, string[]>; keyTag: Record<string, string> };

/** 事件 id → objectKey（与 app 层同一读取路径）。 */
const keyOf = (id: string) => ICONS[id]?.objectKey ?? null;

describe("标签与图库（scene-map.json）", () => {
  it("标签 ≥16 类，每类 ≥2 张，文件名前缀 = 标签名", () => {
    expect(SCENE_TAGS.length).toBeGreaterThanOrEqual(16);
    for (const tag of SCENE_TAGS) {
      const list = MAP.tags[tag]!;
      expect(list.length, `标签 ${tag} 图数`).toBeGreaterThanOrEqual(2);
      for (const f of list) expect(f.startsWith(`${tag}-`), `${f} 前缀应为 ${tag}-`).toBe(true);
    }
  });

  it("场景图清单 = 各标签图的并集，无重复登记", () => {
    const union = SCENE_TAGS.flatMap((t) => MAP.tags[t]!);
    expect(new Set(SCENE_FILES).size).toBe(SCENE_FILES.length);
    expect(new Set(union).size).toBe(SCENE_FILES.length);
  });

  it("keyTag 无死键：每个键都是 icon-map 真用到的 objectKey，每个值都是已声明标签", () => {
    const live = new Set(Object.values(ICONS).map((v) => v.objectKey).filter(Boolean));
    for (const [key, tag] of Object.entries(MAP.keyTag)) {
      expect(live.has(key), `keyTag「${key}」在 icon-map 里不存在`).toBe(true);
      expect(SCENE_TAGS).toContain(tag);
    }
  });

  it("keyPin 无死键且变体可解析：pin 的键必须挂在该变体所属标签下", () => {
    // v5.1.0（合并另一会话的 keyPin 机制后补的守卫）：pin 是「图标 → 指定变体」，
    // 一旦 keyTag 被改挂到别的标签而 pin 没跟着改，就会 pin 到不存在的 `${tag}-${variant}.avif`——
    // 运行时回落到哈希轮换（不报错），于是「修了语义却静默失效」。这条门就是防它。
    const pin = (MAP as { keyPin?: Record<string, string> }).keyPin;
    if (!pin) return;
    const problems: string[] = [];
    for (const [key, variant] of Object.entries(pin)) {
      const tag = MAP.keyTag[key];
      if (!tag) { problems.push(`${key}：pin 存在但 keyTag 里没有这个键`); continue; }
      const file = `${tag}-${variant}.avif`;
      if (!(MAP.tags[tag] ?? []).includes(file)) problems.push(`${key}：pin「${variant}」解析不到 ${file}`);
    }
    expect(problems, problems.join("；")).toEqual([]);
  });
});

describe("取图（sceneTagOf / sceneFileOf）", () => {
  it("objectKey 命中 → 标签；未命中或空 → null（显式豁免）", () => {
    expect(sceneTagOf("hospital")).toBe("hospital");
    expect(sceneTagOf("stethoscope")).toBe("hospital");
    expect(sceneTagOf("choice")).toBeNull(); // 抽象图标不硬凑成场景
    expect(sceneTagOf(null)).toBeNull();
    expect(sceneTagOf(undefined)).toBeNull();
  });

  it("同一事件恒同一张图（可复现）；不同事件会分散到该类的各张变体上", () => {
    const a1 = sceneFileOf("infant-001", "family-house");
    const a2 = sceneFileOf("infant-001", "family-house");
    expect(a1).toBe(a2);
    // 同标签的多个事件 id：应该用过不止一张变体（否则「多张变体」是摆设）
    const ids = EVENTS.slice(0, 80).map((e) => e.id);
    const used = new Set(ids.map((id) => sceneFileOf(id, "family-house")));
    expect(used.size).toBeGreaterThan(1);
  });

  it("每张场景图都至少被一条事件用到（不留「画了没人用」的死图）", () => {
    // 逐图统计使用次数：0 次 = 死图。这条门是本轮实测抓到的——
    // rain 类 2 张、meal 类 2 张，用低比特哈希取模时全撞在同一个变体上。
    const use = new Map<string, number>(SCENE_FILES.map((f) => [f, 0]));
    for (const e of EVENTS) {
      const f = sceneFileOf(e.id, keyOf(e.id));
      if (f) use.set(f, (use.get(f) ?? 0) + 1);
    }
    const dead = [...use.entries()].filter(([, n]) => n === 0).map(([f]) => f);
    expect(dead, `以下场景图零使用：${dead.join(", ")}`).toEqual([]);
  });

  it("豁免事件返回 null（调用方不渲染配图、不留空框）", () => {
    expect(sceneFileOf("x", "choice")).toBeNull();
    expect(sceneFileOf("x", null)).toBeNull();
  });
});

describe("覆盖率（v5/02 §九：≥60%，豁免可复算）", () => {
  const rows = EVENTS.map((e) => ({ id: e.id, objectKey: keyOf(e.id) }));

  it("覆盖 ≥60%，且豁免清单非空时逐条可列出", () => {
    const cov = sceneCoverage(rows);
    expect(cov.total).toBe(EVENTS.length);
    expect(cov.ratio).toBeGreaterThanOrEqual(0.6);
    expect(cov.covered + cov.exempt.length).toBe(cov.total);
  });

  it("线索解锁事件也有配图（新事件不能落在覆盖之外）", () => {
    for (const id of ["childhood-018", "teen-020", "elder-405"]) {
      expect(sceneFileOf(id, keyOf(id)), `${id} 应有配图`).not.toBeNull();
    }
  });
});
