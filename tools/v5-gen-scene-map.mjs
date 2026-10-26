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

/** 封闭枚举：标签 → 显示名（场景图文件 = assets/web-ready/scenes/<tag>-<variant>.svg）。 */
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
  funeral: "丧事",
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
  // ── home 家：房屋、家庭、室内陈设 ──
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
  "tired-eye": "home", // v5-M6：原 night（夜色），困倦/歇息 = 居家场景

  // ── kitchen 厨房：灶台、食材、餐具 ──
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
  "basket": "kitchen",
  "weight-scale": "kitchen",

  // ── school 校园：校门、操场、学籍 ──
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

  // ── classroom 教室：课桌与纸笔 ──
  "notebook": "classroom",
  "book-cover": "classroom",
  "open-book": "classroom",
  "papers": "classroom",
  "checklist": "classroom",
  "calculator": "classroom",
  "abacus": "classroom",
  "desk-lamp": "classroom",
  "paint-brush": "classroom",
  "palette": "classroom",
  "easel": "classroom",
  "folded-paper": "classroom",
  "paper-boat": "classroom",
  "diagram": "classroom",
  "histogram": "classroom",

  // ── street 街巷：街面、店铺、路 ──
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

  // ── station 车站：交通与行李 ──
  "airplane-departure": "station",
  "rolling-suitcase": "station",
  "suitcase": "station",
  "passport": "station",
  "journey": "station",
  "wavy-itinerary": "station",
  "treasure-map": "station",

  // ── factory 厂区：厂房、工地、工具 ──
  "warehouse": "factory",
  "brick-pile": "factory",
  "gears": "factory",
  "drill": "factory",
  "chisel": "factory",
  "claw-hammer": "factory",
  "hand-saw": "factory",
  "cubes": "factory",

  // ── office 办公：工位、会议、文件 ──
  "briefcase": "office",
  "files": "office",
  "archive-register": "office",
  "contract": "office",
  "round-table": "office",
  "discussion": "office",
  "video-conference": "office",
  "network-bars": "office",
  "chess-pawn": "office",
  "chess-rook": "office",

  // ── hospital 医院：诊疗与药物 ──
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
  "thermometer-cold": "rain",
  "heart-organ": "hospital",
  "tooth": "hospital",
  "toothbrush": "hospital",
  "protection-glasses": "hospital",
  "heart-battery": "hospital",
  "heart-bottle": "hospital",

  // ── outdoors 户外：公园晨练、街边摊、远行（不是医院也不是病房）──
  "body-balance": "outdoors",
  "muscle-up": "outdoors",
  "gym-bag": "outdoors",
  "cycling": "outdoors",
  "hiking": "outdoors",
  "mountains": "outdoors",
  "kid-slide": "outdoors",
  "sand-castle": "outdoors",
  "watchtower": "outdoors",
  "campfire": "outdoors",
  "walk": "outdoors",
  "walking-boot": "outdoors",
  "boots": "outdoors",
  "barefoot": "outdoors",
  "caterpillar": "outdoors", // v5-M6：原 study（书桌）——蚕/蚯蚓是户外小生物
  "star-formation": "outdoors", // v5-M6：原 night（夜色）——星群是户外天象

  // ── market 市场：买卖与秤 ──
  "scales": "market",
  "cash": "market",
  "banknote": "market",
  "money-stack": "market",
  "gold-stack": "market",
  "wallet": "market",
  "piggy-bank": "market",
  "strongbox": "market",
  "profit": "market",
  "chest": "market",

  // ── field 田野：农事与土地 ──
  "plant-watering": "field",
  "flower-pot": "field",
  "spring": "field",
  "oak": "field",
  "dig-hole": "field",

  // ── wedding 婚宴：婚礼与誓约 ──
  "engagement-ring": "wedding",
  "ring": "wedding",
  "linked-rings": "wedding",
  "lovers": "wedding",
  "eternal-love": "wedding",
  "pouring-chalice": "wedding",
  "theater-curtains": "wedding",
  "balloons": "wedding",
  "pinata": "wedding",
  "ribbon": "wedding",

  // ── funeral 丧事：告别与纪念 ──
  "grave-flowers": "funeral",
  "candle-holder": "funeral",
  "candle-light": "funeral",
  // v5-M6 SI-001 修：情绪/时间类抽象符号（hourglass / broken-heart / shattered-heart /
  // tear-tracks / despair / two-shadows / sunrise / sundial / sparkles）**摘出**——
  // 它们不是任何场景的物件（`heart-*` 系的例外见 study 段末注），摘出后转显式豁免。

  // ── night 夜色：v5-M6 退役（摘出上列图标后该类只剩 tired-eye 与 star-formation 两条事件，
  //    少于 2 张图在哈希下必留死图；两条改挂 home / outdoors，图稿同笔删除）──

  // ── rain 雨天：雨雪与水（标签含义 = 「雨雪天气」，故 snowflake 归此类而非夜色）──
  "water-splash": "rain",
  "snowflake-1": "rain",

  // ── meal 饭桌：v5-M6 退役（社交图标 meeple-group / three-friends / shaking-hands 摘出后事件归零）──

  // ── study 书桌：读写与自学（v5-M6 起只留「读写/文书」类物件）──
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

  // ── v5-M6 SI-001 修复：原硬塞进 study 的四批键改挂各自的语义场景 ──
  // 判据仍是同一条（「图标本身是这类场景的核心物件」）——兔子是 `pet` 的主体、拼图是 `toy`、
  // 电视收音机是 `media`、吉他琴键话筒是 `music`；它们不是书桌的物件，落 study 才会「画书堆配兔子」。
  // ── pet 宠物：家养小动物 ──
  "rabbit": "pet",
  "cat": "pet",
  "paw-print": "pet",
  // ── toy 玩物：玩具与游戏 ──
  "dinosaur-rex": "toy",
  "jigsaw-piece": "toy",
  "jigsaw-box": "toy",
  "puzzle": "toy",
  "gamepad": "toy",
  // ── media 影音：家电、通信与影像器材 ──
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
  // ── music 器乐：乐器与演唱器材 ──
  "musical-notes": "music",
  "guitar": "music",
  "piano-keys": "music",
  "microphone": "music",
  "old-microphone": "music",
  // 仍摘出：drama-masks（戏剧面具 = 舞台行当，本图库无舞台类）→ 显式豁免。

  // 也随 v5-M6 改挂：tired-eye → home（困倦/歇息 = 居家），caterpillar / star-formation → outdoors（户外）。

  // ── relic 旧物：旧盒子、老照片、旧信 ──
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
  // funeral 第 3 张（v5-M6 补）：摘出情绪图标后该类只剩 3 条事件，2 张图在哈希下必死 1 张
  funeral: ["hall", "flowers", "candles"],
  rain: ["street", "umbrella"],
  outdoors: ["park", "road"],
  study: ["books", "lamp", "writing"],
  relic: ["box", "photo", "letter"],
  // v5-M6 SI-001 修复新增四类（图稿见 tools/v5-gen-scenes.mjs 对应段）
  pet: ["cat", "cage"],
  toy: ["jigsaw", "gamepad"],
  media: ["tv", "radio", "phone"],
  music: ["guitar", "piano", "mic"],
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

const map = Object.fromEntries(Object.entries(VARIANTS).map(([tag, list]) => [tag, list.map((v) => `${tag}-${v}.svg`)]));
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
    "语义配图映射（plan/v5/02 §九 D9）。结构：{tags: {tag: [场景图文件名…]}, keyTag: {icon objectKey → tag}}。" +
    "事件取图 = iconMap[事件id].objectKey → keyTag → tags（该标签内按事件 id 的稳定哈希轮换，同 id 恒同图）。" +
    "未命中 keyTag 的事件 = 显式豁免（不配图、不留空框），清单见 docs/v5-scenes.md。",
  tags: map,
  keyTag: KEY_TAG,
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
