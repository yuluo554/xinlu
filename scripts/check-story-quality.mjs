#!/usr/bin/env node
// ═══ 故事写实初筛门（v4-M1''' B 段 · 1.3 落位）═══
// 口径单源 plan/v4/02 §八（含 ▸ B 段增补）：机检四项——
//   S.LEN   字数：critical ≥180 字；main/context/rescue ≥100 字
//   S.ERA   年代锚：年代词表命中 ≥1
//   S.SENSE 五感：五感词表命中去重词数 ≥2（同词重复不计）
//   S.REF   支线互引：line≠fate 命中互引词表 ≥1
// 词表单源在本文件（02 只记构成原则，不誊抄）：年代词取跨年代可感词（事件池
// 1955–2015 出生全年代共用，单一年代专属物只进时代卡不进事件池）；五感词五池分列；
// 互引词 = NPC 称谓 ∪ 前事件回指。地域感/家境感/感官类别覆盖/时代契合归人工抽查
// （docs/v4-story-review.md）。
// 用法：node scripts/check-story-quality.mjs [--batch=1]（默认全六线）
// 退出码：0 绿 / 1 红。
// 本脚本只「查」写实面，不复写口径；改口径必须先改 plan/v4/02 再同步这里。

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
const scoped = events.filter((e) => lines.includes(e.line));

const out = (s) => process.stdout.write(s + "\n");
const problems = [];
const stats = { len: 0, era: 0, sense: 0, ref: 0 };

for (const ev of scoped) {
  const min = LEN_MIN[ev.type] ?? 100;
  const len = countChars(ev.text);
  if (len < min) {
    problems.push(`S.LEN  ${ev.id} 字数 ${len} < ${min}（type=${ev.type}）`);
  } else stats.len++;

  const era = hits(ev.text, ERA_WORDS);
  if (era.length < 1) {
    problems.push(`S.ERA  ${ev.id} 年代锚词 0 命中（词表见本文件 ERA_WORDS）`);
  } else stats.era++;

  const s = senseHits(ev.text);
  if (s.words.length < 2) {
    problems.push(`S.SENSE  ${ev.id} 五感命中去重词数 ${s.words.length} < 2（命中：${s.words.join("/") || "无"}）`);
  } else stats.sense++;

  if (ev.line !== "fate") {
    const ref = hits(ev.text, REF_WORDS);
    if (ref.length < 1) {
      problems.push(`S.REF  ${ev.id} 支线互引 0 命中（line=${ev.line}）`);
    } else stats.ref++;
  }
}

out("故事写实初筛门 · v4/02 §八（含 ▸ B 段增补）· 机检四项 S.LEN/S.ERA/S.SENSE/S.REF");
out("=".repeat(72));
for (const p of problems) out(`FAIL  ${p}`);
out("=".repeat(72));
const label = batchKey === "all" ? "全六线" : `批一（${lines.join("/")}）`;
out(`扫到：${label} ${scoped.length} 条；S.LEN ${stats.len} 过 / S.ERA ${stats.era} 过 / S.SENSE ${stats.sense} 过 / S.REF ${stats.ref} 过（支线 ${scoped.filter((e) => e.line !== "fate").length} 条）`);
out(`结论: ${problems.length === 0 ? "绿（四项全过；地域感/家境感待人工抽查 docs/v4-story-review.md）" : `红（${problems.length} 项不达标）`}`);
process.exitCode = problems.length === 0 ? 0 : 1;
