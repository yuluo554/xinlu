#!/usr/bin/env node
// ═══ 故事写实 + v5 文本长度门（v4-M1''' B 段 1.3 起建；v5-M1'''' 扩三项）═══
// 口径单源 plan/v4/02 §八（含 ▸ B 段增补）+ plan/v5/02 §四（文本长度口径）。
// v4 四项（扫**完整原文** = detail ?? text，v5 瘦身后原文整段在 detail，内容零损失）：
//   S.LEN   字数：critical ≥180 字；main/context/rescue ≥100 字
//   S.ERA   年代锚：年代词表命中 ≥1
//   S.SENSE 五感：五感词表命中去重词数 ≥2（同词重复不计）
//   S.REF   支线互引：line≠fate 命中互引词表 ≥1
// v5 三项（扫展示面）：
//   S.LEN2  主句 text：中位 ≤120 / P90 ≤150 / 单条 ≤180（02 §四）
//   S.OPT   选项 text：中位 ≤10 / ≥20 字占比 ≤10% / 单条 ≤16；每题 2–3 个
//   S.DETAIL detail 覆盖 100% 且单条 ≤600 字；detail 必须以主句开头（原文前缀，防改写）
// 词表单源在本文件（02 只记构成原则，不誊抄）：年代词取跨年代可感词（事件池
// 1955–2015 出生全年代共用，单一年代专属物只进时代卡不进事件池）；五感词五池分列；
// 互引词 = NPC 称谓 ∪ 前事件回指。地域感/家境感/感官类别覆盖/时代契合归人工抽查
// （docs/v4-story-review.md）。
// 用法：node scripts/check-story-quality.mjs [--batch=1]（默认全六线）
// 退出码：0 绿 / 1 红。
// 本脚本只「查」写实面与长度，不复写口径；改口径必须先改 plan 文档再同步这里。

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── 批次（02 §八 ▸ B 段增补）──
const BATCH_LINES = {
  1: ["fate", "study", "career"],
  all: ["fate", "study", "career", "love", "friend", "health"],
};

// ── 年代词表（跨年代可感：物件/物价/流行措辞）──
const ERA_WORDS = [
  // 物件与场所
  "自行车", "三轮车", "板车", "公交", "电车", "绿皮车", "火车", "火车票", "硬座", "月台",
  "钢笔", "铅笔", "作业本", "课本", "书包", "连环画", "小人书", "收音机", "广播", "电视",
  "闹钟", "手表", "缝纫机", "洗衣机", "冰箱", "吊扇", "蒲扇", "凉席", "蚊帐",
  "煤炉", "蜂窝煤", "煤油灯", "搪瓷缸", "搪瓷盆", "暖水瓶", "铁皮暖壶", "搓衣板",
  "算盘", "存折", "工资", "工资条", "汇款单", "邮票", "信封", "信纸", "邮筒", "电报",
  "胶卷", "照相馆", "相机", "挂历", "台历", "日历", "粉笔", "黑板", "讲台", "课桌", "台灯",
  "灯泡", "日光灯", "火柴", "饭盒", "铝饭盒", "军大衣", "棉袄", "布鞋", "胶鞋", "澡堂", "理发店",
  "大院", "筒子楼", "胡同", "弄堂", "平房", "小卖部",
  "弹珠", "皮筋", "沙包", "铁环",
  // 物价与票子
  "冰棍", "汽水", "水果糖", "泡面", "方便面", "麦乳精",
  "分钱", "毛钱", "块钱", "五毛", "几毛", "几分", "一毛", "两毛", "五分", "块八毛",
  "压岁钱", "零花钱",
  // 相对化年代措辞（事件池全年代共用的锚）
  "那时候", "那几年", "那阵子", "当年", "春运", "夜校",
];

// ── 五感词表（五池分列、互不重叠；命中去重词数 ≥2）──
const SENSE_POOLS = {
  视: [
    "看见", "望见", "瞧见", "瞥见", "盯着", "望着", "眯起眼", "映入", "视线", "目光",
    "眼前", "发亮", "反光", "晃眼", "刺眼", "灰扑扑", "亮晶晶", "明明灭灭", "阴影", "影子",
    "灯光", "日光", "月光", "路灯", "灯泡", "烛光", "火光", "霓虹", "蓝光", "褪色", "斑驳", "泛黄",
  ],
  听: [
    "听见", "听到", "声音", "响起", "哗啦", "吱呀", "咯吱", "轰隆", "嗡嗡", "咔嗒",
    "咳嗽声", "脚步声", "铃声", "汽笛", "广播里", "收音机里", "歌声", "哼着", "喧哗",
    "寂静", "静得", "耳边", "耳朵里", "轰鸣", "哐当", "滋滋", "沙沙", "淅淅沥沥", "噼里啪啦",
  ],
  嗅: [
    "闻到", "气味", "味儿", "饭香", "菜香", "油烟味", "煤烟味", "霉味", "潮味", "汗味",
    "药味", "消毒水味", "肥皂味", "樟脑味", "花香", "泥土味", "土腥味", "腥味", "焦味", "糊味", "臭味",
  ],
  味: [
    "尝到", "嘴里", "舌尖", "咽下", "嚼着", "咬着", "甜味", "咸得", "苦得", "辣得",
    "发苦", "回甘", "香甜", "饿得", "噎", "牙碜", "咸淡",
  ],
  触: [
    "摸着", "摸到", "碰到", "烫", "冰得", "凉", "热得", "冷得", "疼", "痛", "痒", "麻",
    "粗糙", "光滑", "磨得", "勒得", "压得", "攥着", "握着", "捏着", "抱紧", "冻得", "晒得",
    "湿", "黏", "硬邦邦", "软和", "扎手", "起茧",
  ],
};

// ── 互引词表（支线专用：NPC 称谓 ∪ 前事件回指）──
const REF_WORDS = [
  // 称谓（含注册 NPC：周老师/老康/阿澈/小满/林医生）
  "妈妈", "母亲", "爸爸", "父亲", "爸妈", "父母", "家里人", "外婆", "姥姥", "奶奶", "爷爷",
  "姥爷", "祖母", "祖父", "哥哥", "姐姐", "弟弟", "妹妹", "兄妹", "姊妹",
  "老师", "班主任", "周老师", "师傅", "师父", "老康", "同学", "同桌", "室友", "同事", "领导",
  "上司", "阿澈", "小满", "林医生", "医生", "发小", "挚友", "恋人", "对象", "邻居", "街坊",
  // 前事件回指
  "那年", "那一年", "当年", "还记得", "记得", "后来", "从小", "小时候", "上回", "上次",
  "前些年", "这些年", "多年前", "长大后", "长大以后",
];

// ── 门槛（02 §八：critical ≥180；main/context/rescue ≥100）──
const LEN_MIN = { critical: 180, main: 100, context: 100, rescue: 100 };

// ── v5 长度门门槛（plan/v5/02 §四）──
const V5 = {
  /** 主句 text：中位/P90/单条上限。 */
  TEXT: { median: 120, p90: 150, max: 180 },
  /** 选项 text：中位/P90 上限（单条），≥20 字占比上限。 */
  OPT: { median: 10, max: 16, longAt: 20, longRatio: 0.1 },
  /** detail：单条上限 + 覆盖率。 */
  DETAIL_MAX: 600,
  /** 每题选项数区间。 */
  OPT_COUNT: [2, 3],
  /** 单屏可见总量（主句 + 全部选项）。 */
  SCREEN_MAX: 160,
};

const countChars = (s) => [...s].length;
const hits = (text, words) => words.filter((w) => text.includes(w));
const senseHits = (text) => {
  const found = new Set();
  const senses = [];
  for (const [sense, pool] of Object.entries(SENSE_POOLS)) {
    for (const w of pool) {
      if (text.includes(w)) {
        found.add(w);
        senses.push(sense);
      }
    }
  }
  return { words: [...found], senses: [...new Set(senses)] };
};

// ── CLI ──
const arg = process.argv.slice(2).find((a) => a.startsWith("--batch="));
const batchKey = arg ? arg.slice("--batch=".length) : "all";
if (!(batchKey in BATCH_LINES)) {
  process.stderr.write(`check-story-quality: 未知批次 ${batchKey}（可用 --batch=1 | 缺省全六线）\n`);
  process.exit(2);
}
const lines = BATCH_LINES[batchKey];

const events = JSON.parse(readFileSync(resolve(ROOT, "src/data/events.json"), "utf8"));
/** v4 四项只扫主线/支线池；偶遇层（encounter）走自己的 40–80 字口径（plan/v5/02 §二），
 *  不参与「critical ≥180 / 常规 ≥100」的写实化门槛——它本就是短句留白。 */
const scoped = events.filter((e) => lines.includes(e.line) && e.type !== "encounter");

const out = (s) => process.stdout.write(s + "\n");
const problems = [];
const stats = { len: 0, era: 0, sense: 0, ref: 0 };

/** 展示面主句（v5 瘦身后 ≤120 字）；v4 四项扫**完整原文** = detail ?? text（内容零损失）。 */
const fullTextOf = (ev) => (typeof ev.detail === "string" && ev.detail ? ev.detail : ev.text);

for (const ev of scoped) {
  const full = fullTextOf(ev);
  const min = LEN_MIN[ev.type] ?? 100;
  const len = countChars(full);
  if (len < min) {
    problems.push(`S.LEN  ${ev.id} 原文 ${len} 字 < ${min}（type=${ev.type}；扫 detail ?? text）`);
  } else stats.len++;

  const era = hits(full, ERA_WORDS);
  if (era.length < 1) {
    problems.push(`S.ERA  ${ev.id} 年代锚词 0 命中（词表见本文件 ERA_WORDS）`);
  } else stats.era++;

  const s = senseHits(full);
  if (s.words.length < 2) {
    problems.push(`S.SENSE  ${ev.id} 五感命中去重词数 ${s.words.length} < 2（命中：${s.words.join("/") || "无"}）`);
  } else stats.sense++;

  if (ev.line !== "fate") {
    const ref = hits(full, REF_WORDS);
    if (ref.length < 1) {
      problems.push(`S.REF  ${ev.id} 支线互引 0 命中（line=${ev.line}）`);
    } else stats.ref++;
  }
}

// ── v5 三项（扫展示面；plan/v5/02 §四）──
const pct = (arr, p) => {
  const s = [...arr].sort((a, b) => a - b);
  if (!s.length) return 0;
  // 中位取上中位（偶数取靠上），P90 取 90% 分位（与报告口径一致）
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
};
const textLens = scoped.map((e) => countChars(e.text));
const optLens = [];
let detailMissing = 0;
let detailTooLong = 0;
let detailNotPrefix = 0;
let optCountBad = 0;
let screenOver = 0;
for (const ev of scoped) {
  // S.DETAIL：覆盖 100% + 单条 ≤600 + detail 以主句开头（原文前缀，防「瘦身」变改写）
  if (typeof ev.detail !== "string" || !ev.detail) {
    detailMissing++;
    problems.push(`S.DETAIL ${ev.id} 缺 detail（原文必须整段保留，02 §四 内容零损失）`);
  } else {
    if (countChars(ev.detail) > V5.DETAIL_MAX) {
      detailTooLong++;
      problems.push(`S.DETAIL ${ev.id} detail ${countChars(ev.detail)} 字 > ${V5.DETAIL_MAX}`);
    }
    if (!ev.detail.startsWith(ev.text)) {
      detailNotPrefix++;
      problems.push(`S.DETAIL ${ev.id} detail 未以主句开头（主句须是原文前缀）`);
    }
  }
  // S.OPT：每题选项数 2–3
  const n = Array.isArray(ev.options) ? ev.options.length : 0;
  if (n < V5.OPT_COUNT[0] || n > V5.OPT_COUNT[1]) {
    optCountBad++;
    problems.push(`S.OPT   ${ev.id} 选项数 ${n} 不在 ${V5.OPT_COUNT[0]}–${V5.OPT_COUNT[1]}（02 §四）`);
  }
  for (const o of ev.options ?? []) {
    const l = countChars(o.text);
    optLens.push(l);
    if (l > V5.OPT.max) problems.push(`S.OPT   ${ev.id} 选项「${o.text}」${l} 字 > 单条上限 ${V5.OPT.max}`);
    // 选项原文折叠层同样零损失
    if (typeof o.detail === "string" && o.detail && o.detail === o.text) {
      problems.push(`S.DETAIL ${ev.id} 选项 detail 与 text 相同（无折叠意义）`);
    }
  }
  // 单屏可见总量 = 主句 + 全部选项
  const screen = countChars(ev.text) + (ev.options ?? []).reduce((a, o) => a + countChars(o.text), 0);
  if (screen > V5.SCREEN_MAX) {
    screenOver++;
    problems.push(`S.OPT   ${ev.id} 单屏可见 ${screen} 字 > ${V5.SCREEN_MAX}（02 §四）`);
  }
}

const textMedian = pct(textLens, 0.5);
const textP90 = pct(textLens, 0.9);
const textMax = Math.max(0, ...textLens);
const optMedian = pct(optLens, 0.5);
const optMax = Math.max(0, ...optLens);
const optLongRatio = optLens.length ? optLens.filter((l) => l >= V5.OPT.longAt).length / optLens.length : 0;

if (textMedian > V5.TEXT.median) problems.push(`S.LEN2  主句中位 ${textMedian} > ${V5.TEXT.median}`);
if (textP90 > V5.TEXT.p90) problems.push(`S.LEN2  主句 P90 ${textP90} > ${V5.TEXT.p90}`);
if (textMax > V5.TEXT.max) problems.push(`S.LEN2  主句最长 ${textMax} > ${V5.TEXT.max}`);
if (optMedian > V5.OPT.median) problems.push(`S.OPT   选项中位 ${optMedian} > ${V5.OPT.median}`);
if (optMax > V5.OPT.max) problems.push(`S.OPT   选项最长 ${optMax} > ${V5.OPT.max}`);
if (optLongRatio > V5.OPT.longRatio) {
  problems.push(`S.OPT   ≥${V5.OPT.longAt} 字选项占比 ${(optLongRatio * 100).toFixed(1)}% > ${V5.OPT.longRatio * 100}%`);
}

const outLine = (s) => out(s);
outLine("故事写实 + v5 文本长度门 · v4/02 §八 四项（S.LEN/S.ERA/S.SENSE/S.REF，扫原文）+ v5/02 §四 三项（S.LEN2/S.OPT/S.DETAIL）");
outLine("=".repeat(78));
for (const p of problems) outLine(`FAIL  ${p}`);
outLine("=".repeat(78));
const label = batchKey === "all" ? "全六线" : `批一（${lines.join("/")}）`;
outLine(`扫到：${label} ${scoped.length} 条；S.LEN ${stats.len} 过 / S.ERA ${stats.era} 过 / S.SENSE ${stats.sense} 过 / S.REF ${stats.ref} 过（支线 ${scoped.filter((e) => e.line !== "fate").length} 条）`);
outLine(`长度：主句 中位 ${textMedian} / P90 ${textP90} / 最长 ${textMax}（≤${V5.TEXT.median}/${V5.TEXT.p90}/${V5.TEXT.max}）` +
  `；选项 中位 ${optMedian} / 最长 ${optMax} / ≥${V5.OPT.longAt} 字占比 ${(optLongRatio * 100).toFixed(1)}%（≤${V5.OPT.median}/≤${V5.OPT.max}/≤${V5.OPT.longRatio * 100}%）` +
  `；detail 缺 ${detailMissing} / 超长 ${detailTooLong} / 非前缀 ${detailNotPrefix}；单屏 >${V5.SCREEN_MAX} ${screenOver} 条`);
outLine(`结论: ${problems.length === 0 ? "绿（七项全过；地域感/家境感待人工抽查 docs/v4-story-review.md）" : `红（${problems.length} 项不达标）`}`);
process.exitCode = problems.length === 0 ? 0 : 1;
