// 配图语义错配的**棘轮**测试（plan/v5/backlog.md SI-001 的防回退件）。
//
// 为什么是棘轮而不是「必须为 0」：SI-001 是已入队但未修的缺口（处置是产品决策——
// 摘出会把覆盖率从 85.8% 压到 81.0% / 68.1%，且要同步 README、plan/05 发布说明与 docs/v5-scenes.md）。
// 「必须为 0」会让主线永远红；「不设门」会让这个缺口三个月后无声长回去。
// 折中：把当前实测值锁成快照 —— 键集合必须**逐字等于**快照，事件数只能 ≤ 上限。
// 修完后连同 SI-001 一起把快照改小（改到空集即全修完），本测试自动跟着收紧。
//
// 能拦什么 / 拦不住什么（写清楚免得当成万能门）：
//   拦得住：① 往 keyTag 里恢复任一已登记的错配键（键集合不相等 → 红）；
//          ② 新事件用了这批 objectKey（事件数超上限 → 红）；
//          ③ 修完却忘了同步本快照（键集合不相等 → 红，避免"修了但账没翻"）。
//   拦不住：全新的、还没登记进 tools/v5-scene-misfits.mjs 的非场景图标被映射进去——
//          那需要一份「什么算场景」的完整白名单（205 个键），属 SI-001 修完时的产物。
import { describe, expect, it } from "vitest";
import { OFF_SCENE_KEYS } from "../tools/v5-scene-misfits.mjs";
import iconMapRaw from "../src/data/icon-map.json" with { type: "json" };
import eventsRaw from "../src/data/events.json" with { type: "json" };
import sceneMapRaw from "../src/data/scene-map.json" with { type: "json" };

const ICONS = iconMapRaw as Record<string, { objectKey: string | null }>;
const EVENTS = eventsRaw as unknown as Array<{ id: string; type: string }>;
const MAP = sceneMapRaw as unknown as { keyTag: Record<string, string> };

/** v5-M5 运维首查实测快照（2026-10-26）。改小 = 修了一部分；改到空集 = SI-001 修完。 */
const SNAPSHOT = {
  /** 错配键数（keyTag ∩ OFF_SCENE_KEYS）。 */
  keys: 38,
  /** 受影响事件数（52 / 295 = 17.6%）；新事件复用这批 objectKey 时会涨。 */
  events: 52,
};

const misfitKeys = Object.keys(MAP.keyTag).filter((k) => OFF_SCENE_KEYS.includes(k));
const misfitEvents = EVENTS.filter((e) => {
  const key = ICONS[e.id]?.objectKey;
  return key != null && misfitKeys.includes(key);
});

describe("配图语义错配棘轮（SI-001）", () => {
  it("错配清单自身无重复键（重复会让计数虚高，掩盖真实缺口）", () => {
    expect(new Set(OFF_SCENE_KEYS).size).toBe(OFF_SCENE_KEYS.length);
  });

  it(`keyTag 里的错配键数 = 快照 ${SNAPSHOT.keys}（多一个或少一个都要同笔更新快照）`, () => {
    expect(
      misfitKeys.length,
      `实测 ${misfitKeys.length} 个 ≠ 快照 ${SNAPSHOT.keys}。` +
        `变多 = 又往 keyTag 塞了非场景图标（图上说的是别的事）；` +
        `变少 = 修好了 SI-001 的一部分，把 SNAPSHOT.keys 改成 ${misfitKeys.length} 并同步 backlog 证据格`,
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

  it("棘轮不是空跑：清单与数据确实对得上（否则本门静默失效）", () => {
    expect(misfitKeys.length).toBeGreaterThan(0);
    expect(misfitEvents.length).toBeGreaterThan(0);
    for (const k of misfitKeys) expect(MAP.keyTag[k]).toBeTruthy();
  });
});
