// 生成 docs/v5-scenes.md 的逐张对文案表（表格数据从 scene-map + icon-map + 事件库实算，不手抄）。
// 保留在 tools/ 下（名字不带 tmp）：内容口径变化时可重跑刷新留痕表，不必手改 markdown。
// v5.0.2：配图层由线稿换为具象配图（AVIF），档内叙述同步改写；表格仍从数据实算。
// 用法：node tools/v5-scenes-doc.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OFF_SCENE_KEYS } from "./v5-scene-misfits.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const map = JSON.parse(readFileSync(resolve(ROOT, "src/data/scene-map.json"), "utf8"));
const im = JSON.parse(readFileSync(resolve(ROOT, "src/data/icon-map.json"), "utf8"));
const ev = JSON.parse(readFileSync(resolve(ROOT, "src/data/events.json"), "utf8"));

/** 与 src/ui/scenes.ts 同一取图口径：FNV-1a 高位取模。 */
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
  rain: "雨雪", outdoors: "户外", study: "书桌", relic: "旧物", pet: "宠物", toy: "玩物",
  media: "影音", music: "器乐",
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
const tagCount = Object.keys(map.tags).length;

const nullKeys = exemptKeys.filter((x) => x.key === null);
const heartKeys = exemptKeys.filter((x) => x.key && x.key.includes("heart"));
const restKeys = exemptKeys.filter((x) => x.key && !x.key.includes("heart"));
const abstractMapped = Object.keys(map.keyTag).filter((k) => OFF_SCENE_KEYS.includes(k));
const restByKey = new Map();
for (const x of restKeys) restByKey.set(x.key, (restByKey.get(x.key) ?? 0) + 1);
const restLabel = [...restByKey.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([k, n]) => (n > 1 ? `\`${k}\` ×${n}` : `\`${k}\``))
  .join(" / ");

const head = `# v5.0.2 · 语义配图层（D9）逐张对文案留痕

> 依据 [plan/v5/02 §九](../plan/v5/02-数据与口径.md)（D9 口径）与 [plan/10 §五](../plan/10-5.0优化方案.md)。
> 判据单源 = [src/data/scene-map.json](../src/data/scene-map.json)（映射表）与 \`assets/web-ready/scenes/\`（图库实物，AVIF）。
> 机检 = validate 的 \`S\` 区（标签 ≥16 类 / 每类 ≥2 张 / 实物在位 / 无孤儿图 / keyTag 无死键 / 覆盖 ≥60%）
> + \`src/ui/scenes.test.ts\`（取图稳定 + 无死图 + 覆盖复算）。本档是**逐张对文案**的人工留痕。
> 重跑本档：\`node tools/v5-scenes-doc.mjs\`（表格从数据实算，不手抄）。

## §一、v5.0.2 换层：线稿 → 具象配图（AVIF）

| 项 | v5.0.x（线稿） | v5.0.2（本版） | 依据 |
|---|---|---|---|
| 画面 | 自产 CC0 单色线稿 SVG，\`?raw\` 内联进 JS | **AI 生成具象配图，800×280，AVIF 分发** | 素材来源与许可见 [assets/README.md](../assets/README.md)；体积与格式决策见 [docs/v5-M9-scene-webp.md](v5-M9-scene-webp.md) |
| 体积 | 55 张合计 38.8KB 原始 / 19.3KB gzip（内联） | **${fileCount} 张，分发 AVIF 合计 86.2KB（均匀 crf58）** | 源 WebP 合计 913.3KB（退役 3 张后；此前 55 张为 990.8KB），任何 WebP 画质都压不进 850KB 预算门；AVIF 800×280 全分辨率 crf58 是唯一两全的档位 |
| 预算门 | 850KB | **850KB（未抬）**，实测 dist **844.03KB**（余量 5.97KB） | [plan/v5/00 §决策记录](../plan/v5/00-README总览.md) + [docs/v5-M9-scene-webp.md](v5-M9-scene-webp.md) |
| 引用方式 | 内联 SVG（随 JS 一起到） | \`import.meta.glob(?url)\` + \`<img>\` | 每张图独立成文件；\`.avif\` 强制不内联（Vite 默认把 <4KB 转 base64，会吃 33% 体积） |
| 图库规模 | 55 张 / 21 类 | **${fileCount} 张 / ${tagCount} 类**（\`funeral\` 整类退役，见 §三） | 覆盖 ${ratio}%（口径 ≥60%） |
| 覆盖 | 239/295 = 81.0% | **${covered}/${ev.length} = ${ratio}%** | 语义订正后摘出 7 键 + 退役 1 类；宁可豁免也不给错图（v5.0.1 教训） |

## §二、图库与逐张对文案（${fileCount} 张 / ${tagCount} 类）

图库总览：[docs/assets/v5-scenes-sheet.png](assets/v5-scenes-sheet.png)（\`node tools/v5-scenes-sheet.mjs\`）。

**画面纪律**：一张只有一个主体、居中；400:140 画幅裁切不变（与 v5.0.x 同一构图口径，换的是画法而不是版式）。
下表「用图事件数」由事件库 + 哈希实算，不是手抄。
`;

const tail = `
## §三、语义审计（v5.0.2 交付重点）与处置留痕

**判据**：逐张看图 → 对照该图实际命中的事件文案 → 判「图画的场景是否就是文案的场景」。
只看「图 ↔ 标签」永远是对的（${tagCount} 类全对），错配全部发生在**标签 ↔ 事件**这层——
根因是 \`keyTag\` 从 icon \`objectKey\` 派生，而不少 objectKey 是**隐喻**（婚礼气球、音乐音符、心电符号），
线稿时代靠抽象画法遮掩得住，换成具象照片就藏不住了。

### 3.1 处置汇总

| 处置 | 键数 | 命中事件 | 示例 |
|---|---|---|---|
| 改挂到更贴的类 | 22 | 24 | \`candle-light\`（晚自习停电点蜡烛）\`funeral\`→\`classroom\`；\`balloons\`（公司年会抽奖）\`wedding\`→\`office\`；\`cubes\`/\`brick-pile\`（积木/收玩具）\`factory\`→\`toy\`；\`video-conference\`（异地恋视频）\`office\`→\`media\`；\`papers\`（街头发传单）\`classroom\`→\`street\` |
| 摘出为显式豁免 | 7 | 9 | \`musical-notes\`（婚礼当伴郎/外地口音）、\`spring\`（鼠标颈）、\`weight-scale\`（返聘顾问）、\`scales\`（竞赛传纸条）、\`desk-lamp\`（写字楼通宵）、\`checklist\`（公司日报）、\`wavy-itinerary\`（同学聚会）——都不是那个场景，宁可无图 |
| 整类退役 | \`funeral\` | 2 | 见 3.2 |

### 3.2 为什么 \`funeral\` 整类退役（3 张图退库）

订正后真正的丧事事件只剩 2 条（\`midlife-004\` 葬礼、\`elder-501\` 追悼会）。55 张里 funeral 有 3 张，
而稳定哈希对这两条 id 取模**恒落同一槽**（实测 \`idx2\` 均为 1）——留任意 2 张都必有 1 张「画了没人用」。
项目纪律是「不留死图」，且原第 3 张（烛台）唯一命中的是「晚自习停电点蜡烛」，不是丧事。
→ 3 张移入 \`assets/web-ready/scenes-src/retired/\`（不参与分发），2 条事件转显式豁免。
**代价**：死亡/追悼两卡的配图位置空出（不渲染、不留空框）。补法（下轮）：补丧事事件，或补一张「遗像/黑纱」类图，
使图数 ≤ 可分配事件数。已登记 [plan/v5/backlog.md](../plan/v5/backlog.md) 观察区。

### 3.3 keyPin：把「异质变体」钉死在语义正确的图上

\`keyTag\` 只决定**类**，同类的多张变体仍按事件 id 哈希轮换——于是 \`pet\`（2 张：猫/兔笼）会把狗、鸽子事件也配成猫，
\`media\`（3 张：电视/收音机/手机）会把「看电视」配成收音机。这是 v5-M7 登记的观察项，具象照片下比线稿更刺眼。

v5.0.2 引入 **\`keyPin\`（objectKey → 指定变体）** 一并解决：

| 类 | pin 示例 | 效果 |
|---|---|---|
| \`pet\` | \`cat\`→\`cat\`、\`rabbit\`→\`cage\`、\`paw-print\`→\`cage\` | 狗/兔/鸽事件不再配猫 |
| \`media\` | \`tv\`→\`tv\`、\`pocket-radio\`/\`boombox\`→\`radio\`、\`phone\` 系→\`phone\` | 「看电视」真的配电视 |
| \`music\` | \`guitar\`→\`guitar\`、\`piano-keys\`→\`piano\`、\`microphone\`/\`old-microphone\`→\`mic\` | 吉他配吉他、电子琴配琴键、话筒配话筒 |
| \`toy\` | \`dinosaur-rex\`/\`jigsaw-piece\`/\`jigsaw-box\`/\`puzzle\`→\`jigsaw\`、\`gamepad\`→\`gamepad\` | 拼图与游戏机分开 |
| \`office\`/\`media\` | \`round-table\`/\`discussion\`→\`meeting\`、\`video-conference\`→\`media\` 的 \`phone\` | 会议室与工位分开 |

共 **25 键**。未 pin 的键仍走哈希轮换（口径未变，「一图多事件」不变）。
**守卫**：\`scenes.test.ts\` 新增「keyPin 无死键且变体可解析」——pin 的值必须能在该键当前所属标签下解析到真实文件
（改 \`keyTag\` 而忘改 \`keyPin\` 会 pin 到不存在的图，运行时静默回落到哈希轮换 = 「修了语义却失效」；已用破坏性对照验红）。

### 3.4 仍然「主题近似」但**明确接受**的两处（不是漏网）

| 类 | 现状 | 为什么接受 |
|---|---|---|
| \`market\`（菜场）承接「钱」类事件（学费/首付/零花钱/余额） | 蔬菜摊照片配「首付差三十万」 | 55 张里没有任何「钱包/存折/账单」类画面；菜场是**唯一**带交易语义的场景。已实测：摘掉这批键会让 \`market-scales\` 立刻零使用（它只被压岁钱/清点两条命中），故保留并在此声明。下轮补一张「账本/钱包」类图即可彻底解决 |
| \`street\`（街巷/路口）承接「人生岔路」类抽象事件（志愿/录用/提拔） | 街景配「两份录用通知怎么选」 | 街景本身是中性环境，不构成**事实错误**（不像「花圈配情绪低落」），且这批是全游戏最核心的抉择卡，退成无图损失更大 |

### 3.5 逐张判定

- **图 ↔ 标签**：${fileCount}/${fileCount} 全部一致（逐张目检 4 组接触表 + 原图抽查），无不符。
- **退役 3 张**：\`funeral-hall\` / \`funeral-flowers\` / \`funeral-candles\`（理由见 3.2）。
- **事件 ↔ 标签**：改挂 24 条 + 摘出 9 条 = 33 条事件从「明显不符」转为「贴切」或「显式豁免」；
  剩余接受项见 3.3（两类，已逐条声明理由）。

## §四、显式豁免清单（不配图、不留空框）

覆盖 ${covered}/${ev.length}（${ratio}%），显式豁免 ${exemptIds.length} 条：

${exemptIds.join("、")}

**豁免的构成**（从数据实算）：

| 构成 | 条数 | 说明 |
|---|---|---|
| \`heart-*\` 系（情绪符号） | ${heartKeys.length} | ${heartKeys.map((x) => `\`${x.key}\``).join(" / ") || "—"}——画的是一颗心，不是某个场景 |
| 图标层已豁免（\`objectKey: null\`） | ${nullKeys.length} | ${nullKeys.map((x) => `\`${x.id}\``).join(" / ") || "—"} |
| 其余抽象符号 / 非场景实物 | ${restKeys.length} | ${restLabel} |

这些事件继续靠事件图标（Game-Icons，295/295 全覆盖）表达量感，不渲染场景图也**不留空框**。
棘轮：\`tests/scene-misfits.test.ts\` 守住 \`OFF_SCENE\` 那批键不再回流 \`keyTag\`（v5-M6 修复后快照为 0；
本轮复核 keyTag 内错配键 ${abstractMapped.length} 个）。

## §五、与其他门的边界

- **预算门**：\`assets/web-ready/scenes/*.avif\` 各自成文件（\`assetsInlineLimit\` 对 .avif 关闭内联），
  dist gzip 实测见 [docs/v5-M9-scene-webp.md](v5-M9-scene-webp.md) §四 与 [plan/05](../plan/05-发布留档.md) v5.1.0 节。
- **许可门**：AI 生成，无第三方素材；溯源声明见 [assets/README.md](../assets/README.md) §AI 生成配图。
- **E2E 钩子**：配图节点 = \`figure.ev-scene[data-ev-scene]\`，内含 \`<img>\`（\`naturalWidth\` 必须 800、\`naturalHeight\` 280）；
  豁免事件该节点**不存在**（可机检「不留空框」）。
- **单屏字数**：配图不计入 \`validate:story\` 的单屏 ≤160 口径，但**不得顶掉年份戳**——年份戳在配图之上，顺序未变。
- **源图**：\`assets/web-ready/scenes-src/*.webp\` 只作编码输入，**不参与分发**；编码器 \`tools/v5-scenes-encode.mjs\`。
`;

writeFileSync(resolve(ROOT, "docs/v5-scenes.md"), head + table + tail);
process.stdout.write(`docs/v5-scenes.md：${(head + table + tail).split("\n").length} 行 / 覆盖 ${covered}/${ev.length} = ${ratio}% / 图 ${fileCount} 张\n`);
