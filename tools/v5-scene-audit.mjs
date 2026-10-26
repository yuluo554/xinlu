#!/usr/bin/env node
// 配图语义审计（v5/06 第 16 类「配图语义漂移」的机检件）——**只读，不改数据**。
//
// 为什么需要它：`tools/v5-gen-scene-map.mjs` 的段首注释自己写着纪律——
//   「objectKey → 标签。只收『图标本身就是这一类场景/场景里的核心物件』的键；
//     抽象图标（heart-* / choice / crossroad / despair / infinity…）**不硬凑**——它们不是场景。」
// v5-M5 运维首查实测该纪律被自家破了 38 键 / 52 条事件（17.6%）：卡片画着花圈/台灯/碗/书堆，
// 配的却是情绪低落、公园晨练、庙会走丢、兔子。→ 入队 SI-001。
//
// **v5-M6 已修复**：一级（情绪/时间/氛围/社交/舞台抽象符号）从 keyTag 摘出转显式豁免；
// 二级（宠物/玩物/影音/器乐等具体物件）改挂新建的 `pet`/`toy`/`media`/`music` 四类；
// 原 `night`/`meal` 两类事件归零 → 退役。错配键 38 → **0**，覆盖 85.8% → **81.0%**，豁免 42 → **56**。
// 本工具自此的角色：**回归哨兵**——清单里的键只要再出现在 keyTag 就立刻报出来（棘轮同判据）。
//
// 判据（本文件的单源）：`tools/v5-scene-misfits.mjs` 的 OFF_SCENE 清单里的 objectKey **本身不是场景**，
// 不应出现在 scene-map 的 keyTag 里。清单与修复留痕都在那个文件（消费者共用，不许各写一遍）。
// 故本工具**只报告不判红**（退出码恒 0）。
//
// 用法：
//   node tools/v5-scene-audit.mjs           # 人读报告
//   node tools/v5-scene-audit.mjs --json    # 机读（CI/对账用）
import { readFileSync } from "node:fs";
import { OFF_SCENE, OFF_SCENE_KEYS, OFF_SCENE_FIXED } from "./v5-scene-misfits.mjs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));

const rawEvents = read("src/data/events.json");
const events = Array.isArray(rawEvents) ? rawEvents : rawEvents.events;
const sceneMap = read("src/data/scene-map.json");
const iconMap = read("src/data/icon-map.json");

/** 取图规则与 src/ui/scenes.ts 同源：事件 id 稳定哈希的**高位**取模（低位会与 id 尾部强相关）。 */
function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const offKeys = new Set(OFF_SCENE_KEYS);

// ── 事件 → 图（与 src/ui/scenes.ts 同规则）──
const imageOf = new Map();
const exempt = [];
const usage = {};
for (const e of events) {
  const ic = iconMap[e.id];
  const objectKey = ic && (ic.objectKey || ic);
  const tag = objectKey && sceneMap.keyTag[objectKey];
  const list = tag && sceneMap.tags[tag];
  if (!list || !list.length) {
    exempt.push(e.id);
    continue;
  }
  const img = list[(fnv1a(e.id) >>> 16) % list.length];
  imageOf.set(e.id, { img, tag, objectKey });
  usage[img] = (usage[img] || 0) + 1;
}

// ── 错配清单（按 OFF_SCENE 分组）──
const groups = [];
let offEvents = 0;
for (const [label, keys] of Object.entries(OFF_SCENE)) {
  const hit = events.filter((e) => {
    const m = imageOf.get(e.id);
    return m && keys.includes(m.objectKey);
  });
  offEvents += hit.length;
  groups.push({
    label,
    keys: keys.length,
    events: hit.length,
    samples: hit.slice(0, 3).map((e) => ({
      id: e.id,
      type: e.type,
      objectKey: imageOf.get(e.id).objectKey,
      tag: imageOf.get(e.id).tag,
      img: imageOf.get(e.id).img,
      text: e.text.slice(0, 40),
    })),
  });
}

// 清单里写了、但当前 keyTag 里没有的键 = v5-M6 已摘出（期望态；只有「回流」才是异常）
const removedKeys = [...offKeys].filter((k) => !sceneMap.keyTag[k]);
const returnedKeys = [...offKeys].filter((k) => sceneMap.keyTag[k]);

const allImages = Object.values(sceneMap.tags).flat();
const deadImages = allImages.filter((x) => !usage[x]);
const topReuse = Object.entries(usage)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([img, n]) => ({ img, n }));

const report = {
  events: events.length,
  sceneImages: allImages.length,
  sceneTags: Object.keys(sceneMap.tags).length,
  usedImages: Object.keys(usage).length,
  deadImages,
  exempt: exempt.length,
  covered: events.length - exempt.length,
  coveragePct: +(((events.length - exempt.length) / events.length) * 100).toFixed(1),
  offSceneEvents: offEvents,
  offScenePct: +((offEvents / events.length) * 100).toFixed(1),
  coverageIfFixedPct: +(((events.length - exempt.length - offEvents) / events.length) * 100).toFixed(1),
  exemptIfFixed: exempt.length + offEvents,
  groups,
  removedKeys,
  returnedKeys,
  fixedRecord: OFF_SCENE_FIXED.after,
  topReuse,
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const out = (s = "") => process.stdout.write(`${s}\n`);
  out("配图语义审计 · v5/06 第 16 类（只读报告，退出码恒 0）");
  out("=".repeat(64));
  out(
    `图库 ${report.sceneImages} 张 / ${report.sceneTags} 类；用到 ${report.usedImages} 张，死图 ${report.deadImages.length} 张`
  );
  out(
    `覆盖 ${report.covered}/${report.events} = ${report.coveragePct}%；豁免 ${report.exempt} 条（不渲染、不留空框）`
  );
  out(`复用 top5：${report.topReuse.map((r) => `${r.img}×${r.n}`).join("  ")}`);
  out("");
  if (report.offSceneEvents === 0) {
    out(
      `✅ 非场景图标已清零（黑名单 ${OFF_SCENE_KEYS.length} 键全部摘出/改挂，v5-M6 SI-001）：keyTag 里错配键 ${report.returnedKeys.length} 键 / 命中事件 0 条`
    );
    out(`   修复留痕：一级摘出 ${OFF_SCENE_FIXED.tier1Removed.length} 键；二级改挂 pet/toy/media/music + home/outdoors；退役标签 ${OFF_SCENE_FIXED.retiredTags.join("/")}`);
    out(`   修复时实测：错配键 0 / 覆盖 ${OFF_SCENE_FIXED.after.coverage} / 豁免 ${OFF_SCENE_FIXED.after.exempt} / 图库 ${OFF_SCENE_FIXED.after.images}`);
  } else {
    out(
      `⚠ 非场景图标混入 keyTag：涉及 ${report.offSceneEvents} 条事件 = ${report.offScenePct}%（若全部摘出：覆盖 ${report.coverageIfFixedPct}% / 豁免 ${report.exemptIfFixed} 条）`
    );
    out(`   回流键（${report.returnedKeys.length}）：${report.returnedKeys.join(", ")}`);
  }
  for (const g of groups) {
    if (g.events === 0) continue;
    out("");
    out(`[${g.label}] 清单 ${g.keys} 键 / 命中 ${g.events} 条`);
    for (const s of g.samples) {
      out(`  ${s.id.padEnd(13)} ${String(s.objectKey).padEnd(20)} → ${s.img}  「${s.text}…」`);
    }
    if (g.events > g.samples.length) out(`  …另有 ${g.events - g.samples.length} 条`);
  }
  out("");
  out(`黑名单已摘出 ${report.removedKeys.length} 键（期望态；本清单的作用 = 谁把它加回 keyTag 就报谁，棘轮 tests/scene-misfits.test.ts 同判据）。`);
  out("处置留痕见 plan/v5/backlog.md SI-001（✅ 2026-10-26 修复）与 tools/v5-scene-misfits.mjs 段首注。");
}

process.exitCode = 0;
