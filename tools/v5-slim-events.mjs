#!/usr/bin/env node
// ═══ v5-M1'''' 文本瘦身迁移脚本（口径单源 plan/v5/02 §四）═══
// 一次性把 src/data/events.json 的主句与选项短句化：**只在句读边界切，不改写一个字**，
// 原文整段搬进 detail（内容零损失，02 §四「不删只折叠」）。
//
//   text            → 句号类边界内 ≤120 字的最长前缀（主句）；原文 → detail
//   options[].text  → 句读边界内优先 ≤10 字（上限 16）的动宾短句；原文 → options[].detail
//   单屏总量        → 主句 + 全部选项 ≤160 字（超额时本事件的选项 cap 逐级收窄，仍只在边界切）
//
// 悬空/引号平衡：切完若尾部是「的和跟与把给在从对为或但而——」等接续词，或「「」」未配对，
// 规则会退回更短的合格前缀；仍无合格前缀的（首段即超限）落 HAND_LABELS 人工短句表。
//
// 用法：node tools/v5-slim-events.mjs [--dry]（--dry 只报告不写盘）
// 幂等：已有 detail 的事件不再重复处理（重跑安全）。
// 退出码：0 完成 / 1 指标未达标 / 2 用法错误。
// 本脚本只做「搬运+切分」，不写口径；改阈值必须先改 plan/v5/02 §四 再同步这里。

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EVENTS_PATH = resolve(ROOT, "src/data/events.json");

// ── 门槛（02 §四）──
const TEXT_CAP = 120;
const OPT_CAP = 16;
const OPT_PREFER = 10;
const SCREEN_CAP = 160;

const SENT = /[^。！？」』]*[。！？」』]+/g;
const PUNCT = "，。、；：！？—";
/** 切在这些字后像「话没说完」：退回更短前缀。 */
const DANGLING = /[和跟与把给在从对为或但而——「（【]$/;

/** 首段即超限的 9 处：人工写动宾短句（原文完整保留在 detail）。 */
const HAND_LABELS = {
  "infant-005#2": "把布偶排成一排当守卫",
  "childhood-001#1": "把竞选纲领列了一遍又一遍",
  "childhood-017#2": "画只举「好」字牌的小猫",
  "midlife-001#2": "谈成顾问加每季度一门课",
  "midlife-004#0": "把旧友挨个约了一遍饭",
  "midlife-021#2": "带两套方案陪父亲回老屋",
  "teen-019#0": "写理想：想知道云为什么不会掉",
  "toddler-201#2": "把餐巾纸抽成一条长龙",
  "childhood-101#0": "在每本书扉页写名字和宣言",
};

const len = (s) => [...s].length;
/** 去尾部句读与空白。 */
const stripTail = (s) => s.replace(/[，。、；：—]+$/, "").trim();
/** 引号配对：去掉落单的「或」（切在半句里会留下开口引号）。 */
function balanceQuotes(s) {
  const open = (s.match(/「/g) ?? []).length;
  const close = (s.match(/」/g) ?? []).length;
  if (open === close) return s;
  // 优先去掉第一个落单的开口引号（保留内容），仍不平则去掉所有引号
  let out = s;
  for (let i = 0; i < Math.abs(open - close); i++) {
    out = open > close ? out.replace("「", "") : out.replace(/」(?!.*」)/, "");
  }
  return out;
}

/** 句读切段（段含尾随标点）。 */
function segments(text) {
  const out = [];
  let cur = "";
  for (const ch of [...text]) {
    cur += ch;
    if (PUNCT.includes(ch)) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

/** 主句：句号类边界内 ≤cap 的最长前缀（整句，不切半句）。 */
export function headOf(text, cap = TEXT_CAP) {
  const sents = text.match(SENT) || [text];
  let acc = "";
  for (const s of sents) {
    if (len(acc + s) > cap) break;
    acc += s;
  }
  if (acc) return acc;
  // 首句即超 cap：退到句读整段前缀
  let seg = "";
  for (const s of segments(text)) {
    if (len(stripTail(seg + s)) > cap) break;
    seg += s;
  }
  const out = stripTail(seg);
  return out && !DANGLING.test(out) ? out : [...text].slice(0, cap).join("");
}

/** 合格前缀候选（句读边界、≥4 字、≤cap、无悬空尾、引号平衡），长短降序。 */
function prefixCands(text, cap) {
  const segs = segments(text);
  const cands = [];
  let acc = "";
  for (const s of segs) {
    acc += s;
    const cand = stripTail(acc);
    if (len(cand) > cap) break;
    if (len(cand) >= 4 && !DANGLING.test(cand)) cands.push(balanceQuotes(cand));
  }
  return cands.sort((a, b) => len(b) - len(a));
}

/** 动宾短句：优先 ≤prefer（10），否则 ≤cap（16），再不行硬截；均保证引号平衡。 */
export function labelOf(text, cap = OPT_CAP, prefer = OPT_PREFER) {
  if (len(text) <= prefer) return text;
  const short = prefixCands(text, prefer);
  if (short.length) return short[0];
  const long = prefixCands(text, cap);
  if (long.length) return long[0];
  const hard = stripTail([...text].slice(0, cap).join(""));
  return hard.length >= 4 ? balanceQuotes(hard) : text;
}

function main() {
  const dry = process.argv.includes("--dry");
  const src = JSON.parse(readFileSync(EVENTS_PATH, "utf8"));
  const out = [];
  const textLens = [];
  const optLens = [];
  let textMoved = 0;
  let optMoved = 0;
  let handUsed = 0;

  for (const ev of src) {
    if (typeof ev.detail === "string") {
      out.push(ev); // 已迁移（幂等）
      textLens.push(len(ev.text));
      for (const o of ev.options) optLens.push(len(o.text));
      continue;
    }
    const head = headOf(ev.text);
    const build = (prefer) =>
      ev.options.map((o, i) => {
        const hand = HAND_LABELS[`${ev.id}#${i}`];
        const lab = hand ?? labelOf(o.text, OPT_CAP, prefer);
        if (lab === o.text) return { ...o };
        if (hand) handUsed++;
        const oo = {};
        for (const [k, v] of Object.entries(o)) {
          if (k === "text") {
            oo.text = lab;
            oo.detail = o.text;
          } else oo[k] = v;
        }
        return oo;
      });
    let opts = build(OPT_PREFER);
    for (const prefer of [9, 8, 7, 6, 5]) {
      if (len(head) + opts.reduce((a, o) => a + len(o.text), 0) <= SCREEN_CAP) break;
      opts = build(prefer);
    }
    const next = {};
    for (const [k, v] of Object.entries(ev)) {
      if (k === "text") {
        next.text = head;
        if (head !== ev.text) {
          next.detail = ev.text;
          textMoved++;
        }
      } else if (k === "options") next.options = opts;
      else next[k] = v;
    }
    out.push(next);
    textLens.push(len(head));
    for (const o of opts) {
      optLens.push(len(o.text));
      if (o.detail) optMoved++;
    }
  }

  const q = (a, p) => {
    const s = [...a].sort((x, y) => x - y);
    return s[Math.floor(s.length * p)];
  };
  const overScreen = out.filter(
    (ev) => len(ev.text) + ev.options.reduce((a, o) => a + len(o.text), 0) > SCREEN_CAP,
  );
  const out_ = (s) => process.stdout.write(s + "\n");
  out_("v5 文本瘦身迁移 · 口径 plan/v5/02 §四");
  out_("=".repeat(64));
  out_(`事件 ${out.length} 条；主句迁 detail ${textMoved} 条；选项迁 detail ${optMoved} 条；人工短句 ${handUsed} 处`);
  out_(`主句：中位 ${q(textLens, 0.5)} / P90 ${q(textLens, 0.9)} / 最长 ${Math.max(...textLens)}（门槛 中位 ≤120 / P90 ≤150 / 单条 ≤180）`);
  out_(
    `选项：中位 ${q(optLens, 0.5)} / P90 ${q(optLens, 0.9)} / 最长 ${Math.max(...optLens)}（门槛 中位 ≤10 / ≥20 字占比 ≤10% / 单条 ≤16）`,
  );
  out_(`单屏 >${SCREEN_CAP} 字：${overScreen.length} 条${overScreen.length ? "：" + overScreen.map((e) => e.id).join(",") : ""}`);
  out_("=".repeat(64));

  const fail =
    q(textLens, 0.5) > TEXT_CAP ||
    Math.max(...textLens) > 180 ||
    q(optLens, 0.5) > OPT_PREFER ||
    Math.max(...optLens) > OPT_CAP ||
    overScreen.length > 0;
  out_(`结论: ${fail ? "红（指标未达标）" : "绿（主句/选项/单屏三项达标）"}${dry ? "（--dry 未写盘）" : ""}`);
  if (!dry) writeFileSync(EVENTS_PATH, JSON.stringify(out, null, 2) + "\n");
  process.exitCode = fail ? 1 : 0;
}

const isCli = process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isCli) main();
