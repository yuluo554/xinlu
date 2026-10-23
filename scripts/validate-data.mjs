#!/usr/bin/env node
// ═══ 数据校验门（plan/04 M1 1.3）═══
// 依据 plan/02（单一定义源）§一/二/三/四/五 实现其点名的全部校验项。
// 本脚本只"查"口径、不复写口径：下方常量是从 plan/02 抄录的校验阈值——
// 改口径必须先改 plan/02 再同步这里；发现第二份口径表述 = 缺陷进 backlog。
//
// 用法：node scripts/validate-data.mjs [--count] [--full]
//   --count  输出分母汇总（plan/02 §二第 6 项：供 README / plan/00 台账数字对账）。
//   --full   开启 M4 全量内容门：事件密度矩阵（§二）+ 画像字数（§五 80–150 字）。
//            M1–M3 阶段默认不开启（plan/04 §风险：密度口径是底线，允许先低密度后补齐）；
//            M4 出口必须以 --full 全绿，届时把 package.json 的 validate 命令加上 --flag（同提交）。
// 退出码：0 全绿 / 1 有 FAIL / 2 用法错误。

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = (rel) => join(ROOT, "src", "data", rel);

const ARGS = process.argv.slice(2);
const WANT_COUNT = ARGS.includes("--count");
const WANT_FULL = ARGS.includes("--full");
if (ARGS.some((a) => !["--count", "--full"].includes(a))) {
  process.stderr.write("validate-data: 用法 node scripts/validate-data.mjs [--count] [--full]\n");
  process.exit(2);
}

// ── 口径常量（来源：plan/02，只抄数值不改写表述）──
const STAGES = ["infant", "toddler", "childhood", "teen", "youth", "adult", "midlife", "elder"];
const STAGE_LABEL = { infant: "婴儿", toddler: "幼儿", childhood: "童年", teen: "少年", youth: "青年", adult: "壮年", midlife: "中年", elder: "老年" };
const DIMS = ["ei", "sn", "tf", "jp"];
const EVENT_TYPES = ["main", "context", "critical"];
/** §一：常规 |Δ| ≤ 3，重大抉择（critical）|Δ| ≤ 8 */
const DELTA_MAX = { main: 3, context: 3, critical: 8 };
/** plan/04 M1 1.1：骨架数据每阶段 ≥2 条样例（M4 全量密度开启后自动被矩阵覆盖，仍保持为底线） */
const SKELETON_MIN_PER_STAGE = 2;
/** §二密度矩阵：main 4–6 / context ≥8 / critical ≥2（仅 --full 门启用） */
const DENSITY = { main: [4, 6], context: [8, Infinity], critical: [2, Infinity] };
/** §一：50 = 中立；§三合成口径：初始值 = 50 + 四要素修正量之和，须落域 [0,100] */
const BIRTH_BASE = 50;
const BIRTH_COMBOS = 288; // 6×4×4×3
const BIRTH_ENUMS = {
  era: ["60s", "70s", "80s", "90s", "00s", "10s"],
  place: ["大城", "小城", "县镇", "农村"],
  mood: ["和睦", "紧张", "疏离", "单亲"],
  style: ["权威", "宽容", "忽视"],
};
/** §四：≥8 个结局 + 1 个兜底结局（兜底必须末位：按列表序首个命中） */
const ENDING_MIN_CONDITIONED = 8;
/** §五：16 型封闭枚举 */
const PORTRAIT_TYPES = ["ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP", "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ"];
/** §五：画像各 80–150 字（仅 --full 门启用） */
const PORTRAIT_LEN = [80, 150];

const FLAG_RE = /^[a-z][a-z0-9-]*$/; // flag 命名卫生：小写 kebab（大小写漂移会被 pre/结局引用检查拦住）

const fails = [];
const fail = (id, msg) => fails.push(`[${id}] ${msg}`);

function readJson(file) {
  try {
    return JSON.parse(readFileSync(dataPath(file), "utf8"));
  } catch (e) {
    fail("FILE", `src/data/${file} 读取/解析失败：${e.message}`);
    return null;
  }
}

const events = readJson("events.json");
const birthMap = readJson("birth-map.json");
const endings = readJson("endings.json");
const portraits = readJson("portraits.json");

// ── 一、事件库（§二第 1–4 项 + §七文案去重）──
const flagsDefined = new Set(); // 按库内顺序累积：pre 只许引用更早事件定义的 flag（§二第 3 项，防不可达死锁）
const firstFlagSource = new Map();
const perStage = new Map(STAGES.map((s) => [s, { main: 0, context: 0, critical: 0 }]));
const seenEventIds = new Set();
const seenEventTexts = new Set();
let eventCount = 0;

if (Array.isArray(events)) {
  eventCount = events.length;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const at = `events.json#${i}`;
    if (!ev || typeof ev !== "object" || Array.isArray(ev)) {
      fail("E.SCHEMA", `${at} 不是对象`);
      continue;
    }

    // id：全库唯一，{stage缩写}-{序号}
    if (typeof ev.id !== "string" || !/^(infant|toddler|childhood|teen|youth|adult|midlife|elder)-\d{3}$/.test(ev.id)) {
      fail("E.SCHEMA", `${at} id 非法：${JSON.stringify(ev.id)}（应为 {stage缩写}-{三位序号}）`);
    } else if (seenEventIds.has(ev.id)) {
      fail("E.SCHEMA", `id 重复：${ev.id}`);
    }
    if (typeof ev.id === "string") seenEventIds.add(ev.id);

    // stage / type 枚举；ageHint / text 非空
    if (!STAGES.includes(ev.stage)) fail("E.SCHEMA", `${at} stage 非法：${JSON.stringify(ev.stage)}`);
    else if (typeof ev.id === "string" && !ev.id.startsWith(`${ev.stage}-`)) fail("E.SCHEMA", `${ev.id} 前缀与 stage「${ev.stage}」不一致`);
    if (!EVENT_TYPES.includes(ev.type)) fail("E.SCHEMA", `${at} type 非法：${JSON.stringify(ev.type)}`);
    if (typeof ev.ageHint !== "string" || !ev.ageHint.trim()) fail("E.SCHEMA", `${at} 缺 ageHint`);
    if (typeof ev.text !== "string" || !ev.text.trim()) fail("E.SCHEMA", `${at} 缺 text`);
    else if (seenEventTexts.has(ev.text)) fail("E.DUP", `${at} 事件文案与更早事件完全重复（§七：禁止换标签充数）`);
    else seenEventTexts.add(ev.text);

    // pre：只许引用此前事件定义过的 flag
    if (ev.pre !== undefined) {
      if (!Array.isArray(ev.pre)) fail("E.PRE", `${at} pre 不是数组`);
      else {
        for (const f of ev.pre) {
          if (typeof f !== "string" || !FLAG_RE.test(f)) fail("E.PRE", `${at} pre flag 命名非法：${JSON.stringify(f)}`);
          else if (!flagsDefined.has(f)) fail("E.PRE", `${at} pre 引用「${f}」但此前无事件定义它（不可达死锁，§二第 3 项）`);
        }
      }
    }

    // options：≥2 条；至少一维 delta 非零或带 flag；|Δ| 不超口径
    if (!Array.isArray(ev.options) || ev.options.length < 2) {
      fail("E.SCHEMA", `${at} options 缺失或不足 2 条（§二第 1 项）`);
    } else {
      const seenOptText = new Set();
      for (let j = 0; j < ev.options.length; j++) {
        const op = ev.options[j];
        const oat = `${at} 选项${j + 1}`;
        if (!op || typeof op !== "object" || Array.isArray(op)) {
          fail("E.SCHEMA", `${oat} 不是对象`);
          continue;
        }
        if (typeof op.text !== "string" || !op.text.trim()) fail("E.SCHEMA", `${oat} 缺 text`);
        else if (seenOptText.has(op.text)) fail("E.DUP", `${at} 选项文案重复：「${op.text.slice(0, 20)}…」`);
        else seenOptText.add(op.text);

        if (op.flag !== undefined) {
          if (typeof op.flag !== "string" || !FLAG_RE.test(op.flag)) fail("E.FLAG", `${oat} flag 命名非法（应小写 kebab）：${JSON.stringify(op.flag)}`);
          else {
            if (!flagsDefined.has(op.flag)) firstFlagSource.set(op.flag, typeof ev.id === "string" ? ev.id : at);
            flagsDefined.add(op.flag);
          }
        }

        const deltas = op.deltas ?? {};
        if (typeof deltas !== "object" || Array.isArray(deltas)) {
          fail("E.SCHEMA", `${oat} deltas 不是对象`);
          continue;
        }
        if (Object.keys(deltas).length === 0 && op.flag === undefined) fail("E.DELTA", `${oat} 既无 delta 也无 flag（§二第 2 项）`);
        const maxAbs = DELTA_MAX[ev.type] ?? 3;
        for (const [k, v] of Object.entries(deltas)) {
          if (!DIMS.includes(k)) fail("E.DELTA", `${oat} delta 维度非法：${k}`);
          else if (!Number.isInteger(v)) fail("E.DELTA", `${oat} delta ${k} 不是整数：${JSON.stringify(v)}`);
          else if (v === 0) fail("E.DELTA", `${oat} delta ${k}=0（零偏移请删掉该维）`);
          else if (Math.abs(v) > maxAbs) fail("E.DELTA", `${oat} delta ${k}=${v} 超口径（${ev.type} |Δ|≤${maxAbs}，§一）`);
        }
        if (op.aftermath !== undefined && (typeof op.aftermath !== "string" || !op.aftermath.trim())) fail("E.SCHEMA", `${oat} aftermath 应为非空字符串`);
      }
    }

    // 阶段计数（供骨架密度与 --full 密度矩阵）
    if (perStage.has(ev.stage)) perStage.get(ev.stage)[ev.type] += 1;
  }
} 

// 骨架密度（常开）：每阶段 ≥2 条
for (const s of STAGES) {
  const c = perStage.get(s);
  const total = c.main + c.context + c.critical;
  if (total < SKELETON_MIN_PER_STAGE) fail("E.DENSITY", `阶段 ${s}（${STAGE_LABEL[s]}）仅 ${total} 条（骨架要求每阶段 ≥${SKELETON_MIN_PER_STAGE}，plan/04 1.1）`);
}
// --full 密度矩阵（M4 门）：main 4–6 / context ≥8 / critical ≥2
if (WANT_FULL) {
  for (const s of STAGES) {
    const c = perStage.get(s);
    if (c.main < DENSITY.main[0] || c.main > DENSITY.main[1]) fail("E.DENSITY", `阶段 ${s} main ${c.main} 条（口径 ${DENSITY.main[0]}–${DENSITY.main[1]}）`);
    if (c.context < DENSITY.context[0]) fail("E.DENSITY", `阶段 ${s} context ${c.context} 条（口径 ≥${DENSITY.context[0]}）`);
    if (c.critical < DENSITY.critical[0]) fail("E.DENSITY", `阶段 ${s} critical ${c.critical} 条（口径 ≥${DENSITY.critical[0]}）`);
  }
}

// ── 二、birth-map（§三）──
let birthStats = null;
if (birthMap && typeof birthMap === "object" && !Array.isArray(birthMap)) {
  let schemaOk = true;
  const product = Object.values(BIRTH_ENUMS).reduce((a, b) => a * b.length, 1);
  if (product !== BIRTH_COMBOS) {
    fail("B.COVER", `校验器枚举积 ${product} ≠ ${BIRTH_COMBOS}（校验器与 plan/02 §三漂移，先修枚举）`);
    schemaOk = false;
  }
  for (const [el, values] of Object.entries(BIRTH_ENUMS)) {
    const group = birthMap[el];
    if (!group || typeof group !== "object" || Array.isArray(group)) {
      fail("B.SCHEMA", `birth-map 缺要素「${el}」`);
      schemaOk = false;
      continue;
    }
    for (const key of Object.keys(group)) {
      if (!values.includes(key)) fail("B.SCHEMA", `birth-map ${el} 含未枚举值「${key}」`);
    }
    for (const key of values) {
      const row = group[key];
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        fail("B.SCHEMA", `birth-map ${el}.${key} 缺修正量行`);
        schemaOk = false;
        continue;
      }
      for (const k of Object.keys(row)) {
        if (!DIMS.includes(k)) fail("B.SCHEMA", `birth-map ${el}.${key} 维度非法：${k}`);
      }
      for (const d of DIMS) {
        if (!Number.isInteger(row[d])) fail("B.SCHEMA", `birth-map ${el}.${key}.${d} 非整数：${JSON.stringify(row[d])}`);
      }
    }
  }
  // 288 组合全覆盖 + 合成落域（plan/02 §三合成口径：50 + 四要素修正量之和 ∈ [0,100]）
  if (schemaOk) {
    const stats = Object.fromEntries(DIMS.map((d) => [d, { min: Infinity, max: -Infinity }]));
    let combos = 0;
    let bad = 0;
    for (const era of BIRTH_ENUMS.era) {
      for (const place of BIRTH_ENUMS.place) {
        for (const mood of BIRTH_ENUMS.mood) {
          for (const style of BIRTH_ENUMS.style) {
            combos++;
            const rows = [birthMap.era[era], birthMap.place[place], birthMap.mood[mood], birthMap.style[style]];
            for (const d of DIMS) {
              const init = BIRTH_BASE + rows[0][d] + rows[1][d] + rows[2][d] + rows[3][d];
              if (init < 0 || init > 100) {
                bad++;
                if (bad <= 5) fail("B.COVER", `组合 ${era}/${place}/${mood}/${style} 的 ${d} 初始值 ${init} 出域 [0,100]（birth-map 设计错误，不钳制）`);
                continue;
              }
              stats[d].min = Math.min(stats[d].min, init);
              stats[d].max = Math.max(stats[d].max, init);
            }
          }
        }
      }
    }
    if (bad > 5) fail("B.COVER", `……另有 ${bad - 5} 处出域未逐条列出`);
    if (combos !== BIRTH_COMBOS) fail("B.COVER", `枚举积 ${combos} ≠ ${BIRTH_COMBOS}`);
    birthStats = { combos, stats, bad };
  }
}

// ── 三、endings（§四）──
let endingSummary = null;
if (Array.isArray(endings)) {
  let conditioned = 0;
  let fallbackCount = 0;
  const seenIds = new Set();
  for (let i = 0; i < endings.length; i++) {
    const e = endings[i];
    const at = `endings.json#${i}`;
    if (!e || typeof e !== "object" || Array.isArray(e)) {
      fail("X.SCHEMA", `${at} 不是对象`);
      continue;
    }
    if (typeof e.id !== "string" || !e.id.trim()) fail("X.SCHEMA", `${at} 缺 id`);
    else if (seenIds.has(e.id)) fail("X.SCHEMA", `结局 id 重复：${e.id}`);
    else seenIds.add(e.id);

    if (e.cond === undefined) {
      // 兜底结局：无条件必中 → 必须末位（顺序即优先级），且不得写死 MBTI 字母（由终局四维实算）
      fallbackCount++;
      if (i !== endings.length - 1) fail("X.FALLBACK", `${at} 兜底结局（无 cond）不在末位——按列表序首个命中，它会遮蔽其后所有结局`);
      if (typeof e.typeText === "string" && e.typeText.trim()) fail("X.SCHEMA", `${at} 兜底结局不应写死 typeText（终局 MBTI 字母由四维实算）`);
    } else {
      conditioned++;
      if (!/^[EI][SN][TF][JP]$/.test(e.typeText ?? "")) fail("X.SCHEMA", `${at} typeText 非法：${JSON.stringify(e.typeText)}（应为 4 字母 MBTI 型）`);
      const dims = (e.cond && typeof e.cond === "object" ? e.cond.dims : null) ?? {};
      for (const d of DIMS) {
        const iv = dims[d];
        if (!Array.isArray(iv) || iv.length !== 2 || !Number.isInteger(iv[0]) || !Number.isInteger(iv[1]) || iv[0] < 0 || iv[0] > iv[1] || iv[1] > 100) {
          fail("X.SCHEMA", `${at} cond.dims.${d} 非法区间：${JSON.stringify(iv)}（应 [low,high] 且 0≤low≤high≤100）`);
        }
      }
      for (const key of ["flags", "notFlags"]) {
        const arr = e.cond[key];
        if (arr === undefined) continue;
        if (!Array.isArray(arr) || arr.some((f) => typeof f !== "string" || !FLAG_RE.test(f))) {
          fail("X.SCHEMA", `${at} cond.${key} 应为 flag 字符串数组`);
        } else {
          for (const f of arr) {
            if (!flagsDefined.has(f)) fail("X.REF", `${at} cond.${key} 引用「${f}」，但事件库从未定义该 flag（不可达条件）`);
          }
        }
      }
    }
    if (typeof e.title !== "string" || !e.title.trim()) fail("X.SCHEMA", `${at} 缺 title`);
    if (typeof e.text !== "string" || !e.text.trim()) fail("X.SCHEMA", `${at} 缺 text`);
    if (!Array.isArray(e.retrospect) || e.retrospect.length === 0 || e.retrospect.some((s) => typeof s !== "string" || !s.trim())) {
      fail("X.SCHEMA", `${at} retrospect 应为非空字符串数组（复盘要点）`);
    }
  }
  if (fallbackCount !== 1) fail("X.FALLBACK", `兜底结局应恰好 1 个，实为 ${fallbackCount}（§四：防全条件不落空）`);
  if (conditioned < ENDING_MIN_CONDITIONED) fail("X.COUNT", `条件结局 ${conditioned} 个 < 口径 ${ENDING_MIN_CONDITIONED} 个（§四）`);
  endingSummary = { conditioned, fallbackCount };
}

// ── 四、portraits（§五）──
let portraitFilled = 0;
if (portraits && typeof portraits === "object" && !Array.isArray(portraits)) {
  const got = new Set(Object.keys(portraits));
  const missing = PORTRAIT_TYPES.filter((t) => !got.has(t));
  const extra = [...got].filter((t) => !PORTRAIT_TYPES.includes(t));
  if (missing.length) fail("P.COUNT", `画像缺 ${missing.length} 型：${missing.join(",")}`);
  if (extra.length) fail("P.COUNT", `画像含封闭枚举之外的键：${extra.join(",")}`);
  for (const t of PORTRAIT_TYPES) {
    const txt = portraits[t];
    if (typeof txt !== "string" || !txt.trim()) {
      fail("P.SCHEMA", `画像 ${t} 缺非空文案`);
      continue;
    }
    portraitFilled++;
    if (WANT_FULL) {
      const len = txt.replace(/\s/g, "").length;
      if (len < PORTRAIT_LEN[0] || len > PORTRAIT_LEN[1]) fail("P.LENGTH", `画像 ${t} ${len} 字（口径 ${PORTRAIT_LEN[0]}–${PORTRAIT_LEN[1]} 字，§五）`);
    }
  }
}

// ── 输出 ──
const out = (s) => process.stdout.write(s + "\n");
out("数据校验门 · 依据 plan/02（单一定义源）");
out("=".repeat(56));

const areaOk = (p) => !fails.some((f) => f.startsWith(`[${p}`));
const lines = [
  ["FILE", "数据文件 4 份可读且 JSON 合法"],
  ["E", `事件库 ${eventCount} 条：id 唯一 / 枚举合法 / 选项 ≥2 / 偏移口径 / pre 防死锁 / 骨架密度 ≥${SKELETON_MIN_PER_STAGE} / 文案去重`],
  ["B", `birth-map ${birthStats ? `${birthStats.combos}/${BIRTH_COMBOS}` : "—"} 组合覆盖 + 初始值全部落域 [0,100]`],
  ["X", `endings ${endingSummary ? `${endingSummary.conditioned} 条件 + ${endingSummary.fallbackCount} 兜底` : "—"}：schema / 末位兜底 / flag 引用闭合`],
  ["P", `portraits ${portraitFilled}/${PORTRAIT_TYPES.length} 型封闭枚举${WANT_FULL ? " + 80–150 字" : ""}`],
];
for (const [p, label] of lines) out(`${areaOk(p) ? "PASS" : "FAIL"}  ${label}`);
for (const f of fails) out(`FAIL  ${f}`);

if (WANT_COUNT) {
  out("=".repeat(56));
  out("== 分母汇总（供 README / plan/00 台账数字对账，plan/02 §二第 6 项）==");
  out(`事件总数: ${eventCount}`);
  for (const s of STAGES) {
    const c = perStage.get(s);
    out(`  ${s.padEnd(10)} ${STAGE_LABEL[s]}: main ${c.main} / context ${c.context} / critical ${c.critical}（计 ${c.main + c.context + c.critical}）`);
  }
  out(`结局: 条件结局 ${endingSummary?.conditioned ?? "—"} + 兜底 ${endingSummary?.fallbackCount ?? "—"}（口径 ≥${ENDING_MIN_CONDITIONED} + 1）`);
  out(`画像: ${portraitFilled}/${PORTRAIT_TYPES.length} 型在位`);
  if (birthStats) {
    const ranges = DIMS.map((d) => `${d} ${birthStats.stats[d].min}–${birthStats.stats[d].max}`).join(" / ");
    out(`birth-map: ${birthStats.combos}/${BIRTH_COMBOS} 组合全覆盖，出域 ${birthStats.bad} 处；初始值范围 ${ranges}`);
  } else {
    out(`birth-map: 覆盖检查未完成（schema 有 FAIL，见上）`);
  }
  out(`密度门（--full）: ${WANT_FULL ? "已开启（M4 口径）" : "未开启（M4 出口前默认关）"}`);
}

out("=".repeat(56));
out(`结论: ${fails.length === 0 ? "0 FAIL，数据门全绿" : `${fails.length} 项 FAIL`}`);
process.exitCode = fails.length === 0 ? 0 : 1;
