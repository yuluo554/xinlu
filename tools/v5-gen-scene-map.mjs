#!/usr/bin/env node
// 语义配图映射（plan/v5/02 §九 D9）：`objectKey → 语义标签` → 生成 src/data/scene-map.json。
//
// 为什么从 objectKey 映射而不是从事件文本猜：v4-M3''' 已按「文本核心物件 ⊆ objectKey」逐条重核过
// 295 条事件的图标（docs/v4-M3-icons.md，100% 全量），所以「图标名」就是那条事件核心物件的**已核事实**。
// 从它出发映射到场景标签，覆盖度是可核查的；从文本跑关键词匹配则会得出「99% 覆盖」这种
// 看着漂亮、实际每条都是最近似的假数——本轮先试过那种做法，弃用。
//
// 判据：一条事件有配图 ⟺ 它的 objectKey 在下面映射表里，且该标签底下有图。
// 未映射的 objectKey = 显式豁免（不配图、不留空框），清单落在 docs/v5-scenes.md。
//
// 标签单源在本文件（16 类，plan/v5/02 §九的首批清单）+ 每类 2–4 张变体。
// 用法：node tools/v5-gen-scene-map.mjs [--report]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** 封闭枚举：标签 → 显示名（场景图文件 = assets/web-ready/scenes/<tag>-<variant>.avif（v5.0.2 具象配图））。 */
export const TAGS = {
  home: "家",
  kitchen: "厨房",
  school: "校园",
  classroom: "教室",
  street: "街巷",
  station: "车站",
  factory: "厂区",
  office: "办公",
  hospital: "医院",
  market: "市场",
  field: "田野",
  wedding: "婚宴",
  rain: "雨天",
  study: "书桌",
  relic: "旧物",
  // v5-M6 SI-001 修复新增四类（原硬塞进 `study` 的宠物/玩物/影音/器乐各归其位）
  pet: "宠物",
  toy: "玩物",
  media: "影音",
  music: "器乐",
};
// 退役（v5-M6）：`night 夜色` 与 `meal 饭桌` —— 摘出情绪/时间/社交图标后这两类事件归零，
// 少事件必留死图（`scenes.test.ts`「无死图」会判红），故整类连同图稿一起退场。

/** objectKey → 标签。只收「图标本身就是这一类场景/场景里的核心物件」的键；
 *  抽象图标（heart-* / choice / crossroad / despair / infinity…）不硬凑——它们不是场景。 */
const KEY_TAG = {
  // ── home ──
  "family-house": "home",
  "family-tree": "home",
  "house-keys": "home",
  "keyring": "home",
  "hanging-sign": "home",
  "bed-lamp": "home",
  "pillow": "home",
  "sleepy": "home",
  "night-sleep": "home",
  "windchimes": "home",
  "new-born": "home",
  "tired-eye": "home",
  "abacus": "home",
  "treasure-map": "home",
  "heart-battery": "home",
  "mountains": "home",
  "campfire": "home",
  "walk": "home",
  "boots": "home",
  "barefoot": "home",
  "pinata": "home",
  // ── kitchen ──
  "fork-knife-spoon": "kitchen",
  "cooking-glove": "kitchen",
  "teapot": "kitchen",
  "fridge": "kitchen",
  "carrot": "kitchen",
  "peas": "kitchen",
  "apple-core": "kitchen",
  "shiny-apple": "kitchen",
  "steak": "kitchen",
  "cake-slice": "kitchen",
  "ice-cream-cone": "kitchen",
  "mouth-watering": "kitchen",
  "baby-bottle": "kitchen",
  // ── market ──
  "basket": "market",
  "cash": "market",
  "banknote": "market",
  "money-stack": "market",
  "gold-stack": "market",
  "wallet": "market",
  "piggy-bank": "market",
  "strongbox": "market",
  "profit": "market",
  "chest": "market",
  // ── school ──
  "school-bag": "school",
  "graduate-cap": "school",
  "teacher": "school",
  "podium": "school",
  "public-speaker": "school",
  "acoustic-megaphone": "school",
  "whistle": "school",
  "sport-medal": "school",
  "laurels": "school",
  "running-shoe": "school",
  "star-formation": "school",
  "ribbon": "school",
  // ── classroom ──
  "notebook": "classroom",
  "book-cover": "classroom",
  "open-book": "classroom",
  "calculator": "classroom",
  "paint-brush": "classroom",
  "palette": "classroom",
  "easel": "classroom",
  "folded-paper": "classroom",
  "paper-boat": "classroom",
  "diagram": "classroom",
  "histogram": "classroom",
  // ── street ──
  "papers": "street",
  "shop": "street",
  "shopping-bag": "street",
  "shopping-cart": "street",
  "price-tag": "street",
  "trade": "street",
  "old-wagon": "street",
  "crossroad": "street",
  "direction-signs": "street",
  "direction-sign": "street",
  "3d-stairs": "street",
  "stairs-goal": "street",
  // ── station ──
  "airplane-departure": "station",
  "rolling-suitcase": "station",
  "suitcase": "station",
  "passport": "station",
  "journey": "station",
  // ── factory ──
  "warehouse": "factory",
  "gears": "factory",
  "drill": "factory",
  "chisel": "factory",
  "claw-hammer": "factory",
  "hand-saw": "factory",
  "watchtower": "factory",
  // ── toy ──
  "brick-pile": "toy",
  "cubes": "toy",
  "dinosaur-rex": "toy",
  "jigsaw-piece": "toy",
  "jigsaw-box": "toy",
  "puzzle": "toy",
  "gamepad": "toy",
  // ── office ──
  "briefcase": "office",
  "files": "office",
  "archive-register": "office",
  "contract": "office",
  "round-table": "office",
  "discussion": "office",
  "network-bars": "office",
  "chess-pawn": "office",
  "pouring-chalice": "office",
  "balloons": "office",
  // ── media ──
  "video-conference": "media",
  "linked-rings": "media",
  "tv": "media",
  "pocket-radio": "media",
  "boombox": "media",
  "phone": "media",
  "smartphone": "media",
  "vibrating-smartphone": "media",
  "tablet": "media",
  "wifi-router": "media",
  "photo-camera": "media",
  "film-spool": "media",
  // ── outdoors ──
  "chess-rook": "outdoors",
  "body-balance": "outdoors",
  "muscle-up": "outdoors",
  "gym-bag": "outdoors",
  "cycling": "outdoors",
  "hiking": "outdoors",
  "kid-slide": "outdoors",
  "sand-castle": "outdoors",
  "walking-boot": "outdoors",
  "caterpillar": "outdoors",
  // ── hospital ──
  "hospital": "hospital",
  "hospital-cross": "hospital",
  "ambulance": "hospital",
  "stethoscope": "hospital",
  "medical-drip": "hospital",
  "medical-pack": "hospital",
  "medical-thermometer": "hospital",
  "medicines": "hospital",
  "medicine-pills": "hospital",
  "pill": "hospital",
  "syringe": "hospital",
  "pulse": "hospital",
  "heart-organ": "hospital",
  "tooth": "hospital",
  "toothbrush": "hospital",
  "protection-glasses": "hospital",
  "heart-bottle": "hospital",
  // ── rain ──
  "thermometer-cold": "rain",
  "water-splash": "rain",
  "snowflake-1": "rain",
  // ── field ──
  "plant-watering": "field",
  "flower-pot": "field",
  "oak": "field",
  "dig-hole": "field",
  // ── wedding ──
  "engagement-ring": "wedding",
  "ring": "wedding",
  "lovers": "wedding",
  "eternal-love": "wedding",
  "theater-curtains": "wedding",
  // ── study ──
  "book-pile": "study",
  "bookshelf": "study",
  "bookmark": "study",
  "black-book": "study",
  "secret-book": "study",
  "quill-ink": "study",
  "scroll-quill": "study",
  "ink-swirl": "study",
  "wax-seal": "study",
  "love-letter": "study",
  "envelope": "study",
  "mailbox": "study",
  // ── pet ──
  "rabbit": "pet",
  "cat": "pet",
  "paw-print": "pet",
  // ── music ──
  "guitar": "music",
  "piano-keys": "music",
  "microphone": "music",
  "old-microphone": "music",
  // ── relic ──
  "cardboard-box": "relic",
  "cardboard-box-closed": "relic",
  "calendar": "relic",
  "alarm-clock": "relic",
};

/** 变体清单（与 assets/web-ready/scenes/ 的文件名一一对应；漏一个 validate 的 S.FILE 会红）。 */
const VARIANTS = {
  home: ["threshold", "courtyard", "bedroom", "window"],
  kitchen: ["stove", "table", "vegetables"],
  school: ["gate", "field", "corridor"],
  classroom: ["blackboard", "desks", "paper"],
  street: ["alley", "shopfront", "crossing"],
  station: ["platform", "luggage", "ticket"],
  factory: ["hall", "machine"],
  office: ["desk", "meeting"],
  hospital: ["ward", "corridor", "medicine"],
  market: ["stall", "scales"],
  field: ["rows", "harvest"],
  wedding: ["table", "hall"],
  rain: ["street", "umbrella"],
  outdoors: ["park", "road"],
  study: ["books", "lamp", "writing"],
  relic: ["box", "photo", "letter"],
  pet: ["cat", "cage"],
  toy: ["jigsaw", "gamepad"],
  media: ["tv", "radio", "phone"],
  music: ["guitar", "piano", "mic"],
};

/**
 * objectKey → 指定变体（v5.0.2 语义错配修复，HANDOFF-v5-M8 观察区「新四类变体语义异质性」转做）。
 *
 * 为什么需要它：默认取图 = 标签内按事件 id 哈希高位轮换（同 id 恒同图、同类分散）。该口径对
 * 「同类内变体语义同质」的标签成立（home 四张都是家、kitchen 三张都是厨房），但对**变体语义异质**
 * 的标签会把具体物件配错：实测 `pet` 的 rabbit/dog/pigeon 事件全落到 pet-cat（猫图配狗/鸽），
 * `media` 的「看电视」落 radio、「收音机」落 tv，`music` 的「吉他」落 piano、「电子琴」落 mic。
 * 机制 = 哈希不感知 objectKey，只感知事件 id；异质变体之间没有「随便哪张都行」的互换性。
 *
 * 规则：表内键 = 固定用该变体（不再轮换）；表外键 = 维持哈希轮换。
 * 判据 = 逐条读事件文本后人工指定（docs/v5-scenes.md §四 留痕），不是自动推断。
 * 未列入的异质键若仍错配，进 docs/v5-scenes.md §四 的「已知残留」清单，不静默。
 */
const KEY_PIN = {
  // pet：猫图只配猫事件；兔事件配笼中兔（pet-cage 画面 = 笼中白兔）；狗/鸽/项圈类配笼筐意象
  rabbit: "cage", // toddler-013 兔子在笼中 → pet-cage（画面即笼中白兔）
  cat: "cat",
  "paw-print": "cage", // 狗走/鸽群/项圈：无狗图鸽图，笼筐是「养小动物」的最贴近意象（残留登记 §四）
  // media：家电对位（video-conference / linked-rings 为 v5.0.2 棒改挂 media 的键：视频通话 = 手持设备画面）
  tv: "tv",
  "pocket-radio": "radio",
  boombox: "radio",
  phone: "phone",
  smartphone: "phone",
  "vibrating-smartphone": "phone",
  tablet: "phone",
  "wifi-router": "phone", // 路由器无专图；phone 画面含通信设备组（残留登记 §四）
  "photo-camera": "phone", // 相机无专图；同上
  "film-spool": "phone",
  "video-conference": "phone", // youth-003 异地视频通话 = 手持设备
  "linked-rings": "phone", // youth-402 视频里说下雨 = 手持设备
  // music：乐器对位
  guitar: "guitar",
  "piano-keys": "piano",
  microphone: "mic",
  "old-microphone": "mic",
  // toy：拼图对手柄；积木（brick-pile/cubes）配积木显眼的 jigsaw 平铺图
  "dinosaur-rex": "jigsaw",
  "jigsaw-piece": "jigsaw",
  "jigsaw-box": "jigsaw",
  puzzle: "jigsaw",
  "brick-pile": "jigsaw", // 积木高塔 = jigsaw 平铺里的木块
  cubes: "jigsaw", // 收积木 = 同上
  gamepad: "gamepad",
  // office：圆桌/会议对位（空会议室只配「开会/面谈」类，不配独白/视频类）
  "round-table": "meeting",
  discussion: "meeting",
  "archive-register": "meeting", // 小组管账 = 围议
  files: "desk", // 实习独读档案 = 桌面文件（空会议室不贴）
};

/** 显式豁免理由（v5.0.2：funeral 三图退役）。键 = objectKey，值 = 退役原因（写进 scene-map._meta 供追溯）。 */
const EXEMPT_NOTES = {
  "grave-flowers": "funeral 类退役（v5.0.2）：三张源图含 AI 生成乱码汉字横幅与 AI 人脸遗像，目检不合格且无法重生成，整类转显式豁免",
  "candle-holder": "funeral 类退役（v5.0.2），同上",
  "candle-light": "funeral 类退役（v5.0.2），同上",
};

const REPORT = process.argv.includes("--report");

const events = JSON.parse(readFileSync(resolve(ROOT, "src/data/events.json"), "utf8"));
const iconMap = JSON.parse(readFileSync(resolve(ROOT, "src/data/icon-map.json"), "utf8"));

// 只保留「标签确有图」的键；映射表里写了不存在的标签 → 立刻报错（防笔误静默丢覆盖）
const badTags = [...new Set(Object.values(KEY_TAG))].filter((t) => !(t in VARIANTS));
if (badTags.length) {
  process.stderr.write(`scene-map：映射表用了不存在的标签 ${badTags.join(",")}\n`);
  process.exit(1);
}
// 死键：映射表里写了 icon-map 从未使用的 objectKey（拼错 / 上游改名）——
// 这种条目对覆盖率零贡献却看起来「映射了 215 个键」，必须报错而不是静默忽略（本轮实测踩到 9 个）。
const liveKeys = new Set(Object.values(iconMap).map((v) => v.objectKey).filter(Boolean));
const deadKeys = Object.keys(KEY_TAG).filter((k) => !liveKeys.has(k));
if (deadKeys.length) {
  process.stderr.write(`scene-map：映射表含 ${deadKeys.length} 个 icon-map 里不存在的 objectKey：${deadKeys.join(", ")}\n`);
  process.exit(1);
}
// pin 表同理：键必须存在于 icon-map，且变体名必须落在该键所属标签的 VARIANTS 里（写错 = 静默回落到哈希，错配复活）
const deadPins = Object.entries(KEY_PIN).filter(([k, v]) => {
  if (!liveKeys.has(k)) return true;
  const tag = KEY_TAG[k];
  return !(tag && (VARIANTS[tag] || []).includes(v));
});
if (deadPins.length) {
  process.stderr.write(
    `scene-map：pin 表含 ${deadPins.length} 个无效条目（键不存在或变体不在该标签清单）：` +
      deadPins.map(([k, v]) => `${k}→${v}`).join(", ") + "\n",
  );
  process.exit(1);
}

const map = Object.fromEntries(Object.entries(VARIANTS).map(([tag, list]) => [tag, list.map((v) => `${tag}-${v}.avif`)]));
const covered = [];
const exempt = [];
for (const ev of events) {
  const key = iconMap[ev.id]?.objectKey ?? null;
  const tag = key ? KEY_TAG[key] : undefined;
  if (tag) covered.push(ev.id);
  else exempt.push({ id: ev.id, objectKey: key });
}
const ratio = covered.length / events.length;

const out = {
  _meta:
    "语义配图映射（plan/v5/02 §九 D9）。结构：{tags: {tag: [场景图文件名…]}, keyTag: {icon objectKey → tag}, " +
    "keyPin: {objectKey → 指定变体（v5.0.2 语义错配修复，异质变体不再哈希轮换）}}。" +
    "事件取图 = iconMap[事件id].objectKey → keyTag → tags（keyPin 命中则用指定变体，否则该标签内按事件 id 的稳定哈希轮换，同 id 恒同图）。" +
    "未命中 keyTag 的事件 = 显式豁免（不配图、不留空框），清单见 docs/v5-scenes.md。" +
    "v5.0.2 豁免增补：" + JSON.stringify(EXEMPT_NOTES),
  tags: map,
  keyTag: KEY_TAG,
  keyPin: KEY_PIN,
};

if (!REPORT) writeFileSync(resolve(ROOT, "src/data/scene-map.json"), JSON.stringify(out, null, 2) + "\n");

const pct100 = (n) => (n * 100).toFixed(1);
process.stdout.write(
  `语义配图映射：标签 ${Object.keys(VARIANTS).length} 类 / 场景图 ${Object.values(VARIANTS).flat().length} 张 / ` +
    `映射键 ${Object.keys(KEY_TAG).length} 个\n` +
    `覆盖率：${covered.length}/${events.length} = ${pct100(ratio)}%（口径 ≥60%）· 豁免 ${exempt.length} 条\n`,
);
if (REPORT) {
  const unmatchedKeys = new Set(
    events.map((e) => iconMap[e.id]?.objectKey).filter((k) => k && !KEY_TAG[k]),
  );
  process.stdout.write(`未映射的 objectKey（${unmatchedKeys.size} 个）：${[...unmatchedKeys].sort().join(", ")}\n`);
}
if (ratio < 0.6) {
  process.stderr.write(`scene-map：覆盖率 ${pct100(ratio)}% < 60%（v5/02 §九）\n`);
  process.exitCode = 1;
}
