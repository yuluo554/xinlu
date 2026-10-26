// 配图语义错配的**棘轮**测试（plan/v5/backlog.md SI-001 的防回退件；v5-M6 收紧到 0）。
//
// 演变：v5-M5 首查实测「非场景图标混入 keyTag」38 键 / 52 条事件（17.6%），当时做成
// 「键集合逐字等于快照 38、事件数 ≤52」的棘轮（还不修，但要防无声回涨）。v5-M6 修完
// （一级摘出 13 键 + 二级改挂新建四类 + 退役 night/meal），快照收紧到 **0 / 0**。
//
// 到 0 之后本测试靠什么仍有意义（「不是空跑」这条必须换判据）：
//   ① 黑名单键集合与数据仍要对得上——清单为空就没有意义，故断言清单非空且无重复；
//   ② **阳性对照**：把清单里任一键塞回 keyTag 的副本，检测必须立刻数出 1（否则门静默失效）；
//   ③ 真数据上仍为 0（任何一次回流 → 红）。
// 不能改成 `<=` 宽容式，也不能因为「现在是 0」就删掉本测试——删了三个月后缺口会无声长回来。
//
// 拦不住：全新的、还没登记进 tools/v5-scene-misfits.mjs 的非场景图标被映射进去——
//        那需要一份「什么算场景」的完整白名单，属下次真出缺口时的产物。
import { describe, expect, it } from "vitest";
import { OFF_SCENE_KEYS } from "../tools/v5-scene-misfits.mjs";
import iconMapRaw from "../src/data/icon-map.json" with { type: "json" };
import eventsRaw from "../src/data/events.json" with { type: "json" };
import sceneMapRaw from "../src/data/scene-map.json" with { type: "json" };

const ICONS = iconMapRaw as Record<string, { objectKey: string | null }>;
const EVENTS = eventsRaw as unknown as Array<{ id: string; type: string }>;
const MAP = sceneMapRaw as unknown as { keyTag: Record<string, string> };

/** v5-M6 SI-001 修复后实测快照（2026-10-26）：黑名单键在 keyTag 里的数量与受影响事件数。
 *  这两个数是「不许回涨」的上限；只有真修了才能改小，改到 0 = 全修完（现已到 0）。 */
const SNAPSHOT = {
  /** 错配键数（keyTag ∩ OFF_SCENE_KEYS）。 */
  keys: 0,
  /** 受影响事件数。 */
  events: 0,
};

const misfitOf = (keyTag: Record<string, string>) => Object.keys(keyTag).filter((k) => OFF_SCENE_KEYS.includes(k));
const misfitKeys = misfitOf(MAP.keyTag);
const misfitEvents = EVENTS.filter((e) => {
  const key = ICONS[e.id]?.objectKey;
  return key != null && misfitKeys.includes(key);
});

describe("配图语义错配棘轮（SI-001 · 已收紧到 0）", () => {
  it("错配清单自身无重复键、且非空（清单为空则本门失去判据）", () => {
    expect(OFF_SCENE_KEYS.length).toBeGreaterThan(0);
    expect(new Set(OFF_SCENE_KEYS).size).toBe(OFF_SCENE_KEYS.length);
  });

  it("阳性对照：清单里的键一旦回流 keyTag，检测必须立刻报数（改到 0 也不能空跑）", () => {
    const probeKey = OFF_SCENE_KEYS[0]!;
    const probeTag = { ...MAP.keyTag, [probeKey]: "home" };
    expect(misfitOf(probeTag)).toEqual([probeKey]);
    // 顺带钉住：清单里的键在当前数据里确实是 icon-map 真用到的键（否则阳性对照是假的）
    const live = new Set(Object.values(ICONS).map((v) => v.objectKey).filter(Boolean));
    expect(live.has(probeKey), `阳性对照键「${probeKey}」必须在 icon-map 里真实存在`).toBe(true);
  });

  it(`keyTag 里的错配键数 = 快照 ${SNAPSHOT.keys}（回流一个也红）`, () => {
    expect(
      misfitKeys.length,
      `实测 ${misfitKeys.length} 个 ≠ 快照 ${SNAPSHOT.keys}。` +
        `变多 = 又把非场景图标塞进了 keyTag（图上说的是别的事）——` +
        `要么按 tools/v5-scene-misfits.mjs 段首的两级处置再修一次，要么说明为什么这次可以硬凑；` +
        `变少 = 修得更多了，把 SNAPSHOT.keys 改成 ${misfitKeys.length} 并重跑 docs/v5-scenes.md 生成器`,
    ).toBe(SNAPSHOT.keys);
  });

  it(`受影响事件数 ≤ ${SNAPSHOT.events}（新事件复用这批 objectKey 会涨）`, () => {
    expect(
      misfitEvents.length,
      `实测 ${misfitEvents.length} 条 > 上限 ${SNAPSHOT.events}（${misfitEvents
        .map((e) => e.id)
        .slice(0, 6)
        .join("/")}…）。新增事件若用了这批 objectKey，配图语义会继续漂`,
    ).toBeLessThanOrEqual(SNAPSHOT.events);
  });

  it("非空跑的正向证据：错配为 0 的同时覆盖率仍 ≥60%（修的是错配，不是把配图删光）", () => {
    let covered = 0;
    for (const e of EVENTS) {
      const key = ICONS[e.id]?.objectKey;
      if (key && MAP.keyTag[key]) covered += 1;
    }
    expect(covered / EVENTS.length).toBeGreaterThanOrEqual(0.6);
  });
});