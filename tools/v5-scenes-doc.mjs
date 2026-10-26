// 生成 docs/v5-scenes.md 的逐张对文案表（表格数据从 scene-map + icon-map + 事件库实算，不手抄）。
// 保留在 tools/ 下（名字不带 tmp）：内容口径变化时可重跑刷新留痕表，不必手改 170 行 markdown。
// 用法：node tools/v5-scenes-doc.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OFF_SCENE, OFF_SCENE_KEYS, OFF_SCENE_TIER } from "./v5-scene-misfits.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(readFileSync(resolve(ROOT, "src/data/scene-map.json"), "utf8"));
const im = JSON.parse(readFileSync(resolve(ROOT, "src/data/icon-map.json"), "utf8"));
const ev = JSON.parse(readFileSync(resolve(ROOT, "src/data/events.json"), "utf8"));

/** 与 src/ui/scenes.ts 同一取图口径：FNV-1a 高位取模（低比特与事件 id 尾部强相关）。 */
const hashOf = (id) => {
  let x = 0x811c9dc5;
  for (const c of id) {
    x ^= c.charCodeAt(0);
    x = Math.imul(x, 0x01000193) >>> 0;
  }
  return x;
};
const pick = (id, n) => (hashOf(id) >>> 16) % n;

const TAG_CN = {
  home: "家", kitchen: "厨房", school: "校园", classroom: "教室", street: "街巷", station: "车站",
  factory: "厂区", office: "办公", hospital: "医院", market: "市场", field: "田野", wedding: "婚宴",
  funeral: "丧事", night: "夜色", rain: "雨雪", outdoors: "户外", meal: "饭桌", study: "书桌", relic: "旧物",
};
const cell = (s) => s.replace(/\|/g, "丨");

let table = "";
for (const [tag, list] of Object.entries(map.tags)) {
  table += `\n### ${tag} · ${TAG_CN[tag] ?? tag}\n\n| 场景图 | 用图事件数 | 代表性事件与文案（前 2 条） |\n|---|---|---|\n`;
  for (let i = 0; i < list.length; i++) {
    const users = ev.filter((e) => {
      const k = im[e.id]?.objectKey;
      return k && map.keyTag[k] === tag && pick(e.id, list.length) === i;
    });
    const sample = users.slice(0, 2).map((u) => `${u.id}「${cell(u.text.slice(0, 40))}…」`).join("<br>") || "—";
    table += `| \`${list[i]}\` | ${users.length} | ${sample} |\n`;
  }
}

const exemptIds = [];
let covered = 0;
const exemptKeys = [];
for (const e of ev) {
  const k = im[e.id]?.objectKey;
  if (k && map.keyTag[k]) covered += 1;
  else {
    exemptIds.push(`${e.id}（${k ?? "图标层已豁免"}）`);
    exemptKeys.push({ id: e.id, key: k ?? null });
  }
}
const ratio = ((covered / ev.length) * 100).toFixed(1);
const fileCount = Object.values(map.tags).flat().length;

/** 豁免构成从数据实算（曾手写，漂移过一次：写了「heart-* 系 12 个」而实际豁免 7 个、
 *  另 5 个已映射到 hospital/funeral；又把 crossroad/despair 列为豁免，而它们早被映射走）。
 *  手写的分类说明会随数据变旧而不报警 —— 这里改成算出来，并显式列出「被映射走的抽象符号」。 */
const nullKeys = exemptKeys.filter((x) => x.key === null);
const heartKeys = exemptKeys.filter((x) => x.key && x.key.includes("heart"));
const restKeys = exemptKeys.filter((x) => x.key && !x.key.includes("heart"));
/** 错配清单单源在 tools/v5-scene-misfits.mjs（与 tools/v5-scene-audit.mjs 共用，不许两处各写一遍）。 */
const abstractMapped = Object.keys(map.keyTag).filter((k) => OFF_SCENE_KEYS.includes(k));
const abstractMappedEvents = ev.filter((e) => abstractMapped.includes(im[e.id]?.objectKey)).length;
const heartMapped = Object.keys(map.keyTag).filter((k) => k.includes("heart") && !OFF_SCENE_KEYS.includes(k));
/** 一级（funeral/night/meal 三组）摘出后的覆盖率——分级口径见 v5-scene-misfits.mjs 的 OFF_SCENE_TIER。 */
const tier1Keys = OFF_SCENE_TIER.tier1.flatMap((label) => OFF_SCENE[label] ?? []);
const tier1Events = ev.filter((e) => tier1Keys.includes(im[e.id]?.objectKey)).length;
const coverageTier1 = (((covered - tier1Events) / ev.length) * 100).toFixed(1);
const coverageAll = (((covered - abstractMappedEvents) / ev.length) * 100).toFixed(1);
/** 其余类按 objectKey 去重（多条事件共用一个 key 时不重复列，改为 `key ×n`）。 */
const restByKey = new Map();
for (const x of restKeys) restByKey.set(x.key, (restByKey.get(x.key) ?? 0) + 1);
const restLabel = [...restByKey.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([k, n]) => (n > 1 ? `\`${k}\` ×${n}` : `\`${k}\``))
  .join(" / ");

const head = `# v5-M3'''' · 语义配图层（D9）逐张对文案留痕

> 依据 [plan/v5/02 §九](../plan/v5/02-数据与口径.md)（D9 口径）与 [plan/10 §五](../plan/10-5.0优化方案.md)。
> 判据单源 = [src/data/scene-map.json](../src/data/scene-map.json)（映射表）与 \`assets/web-ready/scenes/\`（图库实物）。
> 机检 = validate 的 \`S\` 区（标签 ≥16 类 / 每类 ≥2 张 / 实物在位 / 无孤儿图 / keyTag 无死键 / 覆盖 ≥60%）
> + \`src/ui/scenes.test.ts\`（取图稳定 + 无死图 + 覆盖复算）。本档是**逐张对文案**的人工留痕。
> 重跑本档：\`node tools/v5-scenes-doc.mjs\`（表格从数据实算，不手抄）。

## §一、路线与偏离（实测记录）

| 项 | plan 原口径 | 本轮落地 | 依据 |
|---|---|---|---|
| 素材来源 | CC0/公版照片（WebP ≤40KB/张，40–60 张） | **自产 CC0 单色线稿 SVG（${fileCount} 张 / 19 类，原始合计 34KB）** | 本机实测：Wikimedia/Openverse 不通，Pexels/Pixabay 只有 CDN 直连、无法核验画面与许可 → 照片路线的 provenance 无法逐张证真；且照片 WebP 实测 4.3KB/张 × 48 ≈ 207KB，超当时的预算余量（104KB）。自产沿 v4 \`stage-scenes\` 先例（自产 CC0 剪影）：许可零风险、可逐张留痕、≈0.7KB/张 |
| 覆盖算法 | 事件 \`sceneTag\` 字段 | **objectKey → 语义标签** | v4-M3''' 已按「文本核心物件 ⊆ objectKey」逐条核过全部事件的图标（\`docs/v4-M3-icons.md\`），从 objectKey 派生是可核查的事实。直接跑文本关键词会得出「99.3% 覆盖」，但每条都是最近似猜测——本轮先试过那种做法，弃用。实测 ${ratio}% |
| 取图 | 未定 | 同标签多张变体按事件 id 的**哈希高位**轮换（同 id 恒同图） | 低比特取模与事件 id 尾部强相关：实测 rain 的 3 条事件全落同一张、meal 的 4 条撞 3 张（\`scenes.test.ts\` 的死图门即为此而立） |
| 分类粒度 | 首批 16 类 | **19 类**（多出 \`outdoors 户外\` / \`meal 饭桌\` / \`relic 旧物\`） | 目检抓到真错配：办健身卡配「病房」、公园打拳配「病房」、徒弟开厂配「家门」——场景类目不够细就会硬塞。拆出 \`outdoors\` 承接晨练/远行/街边摊后，「这张卡在说什么」才对得上 |
| 未覆盖 | 显式豁免 | 同：不渲染配图、不留空框 | 豁免 ${exemptIds.length} 条，见 §三 |

## §二、图库与逐张对文案（${fileCount} 张 / 19 类）

图库总览（同一套画法：400×140、单主体居中、描边与填充走 CSS 变量随四主题联动）：
[docs/assets/v5-scenes-sheet.png](assets/v5-scenes-sheet.png)（缩略图，2026-10-26 生成）。

**构图纪律（第一版踩过）**：第一版每张右侧堆了三个无意义方框当「背景建筑」，${fileCount} 张看起来几乎一样（总览目检一眼看出）。现在**一张只有一个主体**、居中放大——「这张卡在说什么」要一眼看得出来。
`;

const tail = `
## §三、显式豁免清单（不配图、不留空框）

覆盖 ${covered}/${ev.length}（${ratio}%），显式豁免 ${exemptIds.length} 条：

${exemptIds.join("、")}

**豁免的构成**（从数据实算，见 \`node tools/v5-scenes-doc.mjs\`；曾手写过一版，与数据漂移过——故改为算出来）：

| 构成 | 条数 | 说明 |
|---|---|---|
| \`heart-*\` 系（情绪符号） | ${heartKeys.length} | ${heartKeys.map((x) => `\`${x.key}\``).join(" / ") || "—"}——画的是一颗心，不是某个场景，硬凑成厨房或街巷只会误导 |
| 图标层已豁免（\`objectKey: null\`） | ${nullKeys.length} | ${nullKeys.map((x) => `\`${x.id}\``).join(" / ") || "—"} |
| 其余抽象符号 / 非场景实物 | ${restKeys.length} | ${restLabel} |

这些事件继续靠事件图标（Game-Icons，295/295 全覆盖）表达量感，不渲染场景图也**不留空框**。

> **⚠ 已知错配（v5-M5 运维首查实测，未修）**：上面这条「抽象符号本就不是场景」的纪律在 \`keyTag\` 里被自家破了
> ${abstractMapped.length} 处键 / ${abstractMappedEvents} 条事件（${((abstractMappedEvents / ev.length) * 100).toFixed(1)}%）——情绪与时间图标落进丧事/夜色、
> 社交图标落进饭桌、宠物与乐器与电子图标落进书桌，画出来是花圈/台灯/碗/书堆，配的却是情绪低落、公园晨练、庙会走丢、兔子与电子琴。
> 逐条清单与样本见 \`node tools/v5-scene-audit.mjs\`（只读报告，退出码恒 0）。
> 处置是产品决策：只摘丧事/夜色/饭桌三级组 → 覆盖 ${coverageTier1}%（豁免 ${exemptIds.length + tier1Events} 条）；全部摘出 → 覆盖 ${coverageAll}%（豁免 ${exemptIds.length + abstractMappedEvents} 条），两者都过 60% 门。
> 决策登记在 [plan/v5/backlog.md](../plan/v5/backlog.md) SI-001。已映射的 \`heart-*\` 有 ${heartMapped.length} 个（${heartMapped.map((k) => `\`${k}\``).join(" / ")}），它们画的是器官/心电，不属本条错配。

## §四、与其他门的边界

- **预算门**：${fileCount} 张 SVG 以 \`?raw\` 内联进 JS bundle，不单独成文件；dist 实测值见 HANDOFF-v5-M4 的当轮留痕。
- **许可门**：全部自产（无第三方素材）；白名单 \`assets/web-ready/\` 已覆盖 \`scenes/\`，credits 无需新增署名行。
- **E2E 钩子**：配图节点 = \`figure.ev-scene[data-ev-scene]\`；豁免事件该节点**不存在**（可机检「不留空框」）。
- **单屏字数**：配图不计入 \`validate:story\` 的单屏 ≤160 口径（它不占文字量），但**不得顶掉年份戳**——年份戳在配图之上，顺序未变。
`;

writeFileSync(resolve(ROOT, "docs/v5-scenes.md"), head + table + tail);
process.stdout.write(`docs/v5-scenes.md：${(head + table + tail).split("\n").length} 行 / 覆盖 ${covered}/${ev.length} = ${ratio}% / 图 ${fileCount} 张\n`);
