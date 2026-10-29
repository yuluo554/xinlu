#!/usr/bin/env node
// ═══ 数据校验门（plan/04 M1 1.3 + plan/v2/04 v2-M2' 2.3）═══
// 依据 plan/02（v1 单一定义源）§一/二/三/四/五 与 plan/v2/02（v2 增量单源）§二 实现其点名的全部校验项。
// 本脚本只"查"口径、不复写口径：下方常量是从 plan/02 抄录的校验阈值——
// 改口径必须先改 plan/02 再同步这里；发现第二份口径表述 = 缺陷进 backlog。
//
// 用法：node scripts/validate-data.mjs [--count] [--full]
//   --count  输出分母汇总（plan/02 §二第 6 项：供 README / plan/00 台账数字对账）。
//   --full   开启 M4 全量内容门：事件密度矩阵（§二）+ 画像字数（§五 80–150 字）。
//            M1–M3 阶段默认不开启（plan/04 §风险：密度口径是底线，允许先低密度后补齐）；
//            M4 出口必须以 --full 全绿，届时把 package.json 的 validate 命令加上 --flag（同提交）。
// 退出码：0 全绿 / 1 有 FAIL / 2 用法错误。

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
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

// ── 口径常量（来源：plan/02 + plan/v3/02 ▸ M1'' 增补，只抄数值不改写表述）──
const STAGES = ["infant", "toddler", "childhood", "teen", "youth", "adult", "midlife", "elder"];
const STAGE_LABEL = { infant: "婴儿", toddler: "幼儿", childhood: "童年", teen: "少年", youth: "青年", adult: "壮年", midlife: "中年", elder: "老年" };
const DIMS = ["ei", "sn", "tf", "jp"];
/** 事件类型（v5/02 §二 ▸ v5-M1'''' 增补 encounter 偶遇层；偶遇不推 line、不占进度） */
const EVENT_TYPES = ["main", "context", "critical", "rescue", "encounter"];
/** 每题选项数（v5/02 §四：放宽下限、收紧上限——2–3；v3 的「≥3」口径已废止） */
const OPT_COUNT = [2, 3];
/** 偶遇层密度（v5/02 §二 ▸ v5-M1''''）：首批 ≥40 条，每阶段 ≥5 */
const ENC_TOTAL_MIN = 40;
const ENC_PER_STAGE_MIN = 5;
const VALUES_AXES = ["worldview", "outlook", "values"];
const RES_KEYS = ["mood", "money", "health"];
const LINE_KEYS = ["fate", "study", "career", "love", "friend", "health"];
/** v3-M3'' 分批开启密度的支线（02 §四：M1'' study+career，M2'' love+friend，M3'' health——本行随批次扩到全开） */
const LINE_DENSITY_ON = ["study", "career", "love", "friend", "health"];
/** v3/02 §四 ▸ M1'' 增补：支线每阶段每线 ≥3 */
const LINE_DENSITY_MIN = 3;
/** 三观增量口径（v3/02 §二）：常规 |Δ| ≤3 / critical ≤8；rescue 同常规。
 *  v5 偶遇层（v5/02 §二）：|Δ3| ≤1——偶遇只给氛围，不动判定核。 */
const D3_MAX = { main: 3, context: 3, critical: 8, rescue: 3, encounter: 1 };
/** 资源增量口径（v3/02 §三）：常规 |Δ| ≤10 / critical 与 rescue ≤25。
 *  v5 偶遇层：|Δ| ≤3，且允许整条不带 resourceDeltas（02 §二「无 resourceDeltas 或 |Δ| ≤3」）。 */
const RES_MAX = { main: 10, context: 10, critical: 25, rescue: 25, encounter: 3 };
/** 月龄解析格式（v3/02 §一 ▸ M1'' 增补）：N个月 / N岁 / N岁半 / N岁M个月 */
function parseAgeMonths(hint) {
  let m = /^(\d+)岁(\d+)个月$/.exec(hint);
  if (m) return Number(m[1]) * 12 + Number(m[2]);
  m = /^(\d+)岁半$/.exec(hint);
  if (m) return Number(m[1]) * 12 + 6;
  m = /^(\d+)岁$/.exec(hint);
  if (m) return Number(m[1]) * 12;
  m = /^(\d+)个月$/.exec(hint);
  if (m) return Number(m[1]);
  return null;
}
/** plan/04 M1 1.1：骨架数据每阶段 ≥2 条样例（M4 全量密度开启后自动被矩阵覆盖，仍保持为底线） */
const SKELETON_MIN_PER_STAGE = 2;
/** §二密度矩阵（fate 线内）：main 4–6 / context ≥8 / critical ≥2（仅 --full 门启用） */
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
/** v2/02 §二：fish-mood-map 帧库 19 张（帧名清单扫 assets/dafeiyu/fish/ 目录，不在此复写） */
const MOOD_FRAME_COUNT = 19;
/** v2/02 §一/二：tf 三段枚举与 delta 方向枚举 */
const MOOD_SEGS = ["thoughtful", "neutral", "warm"];
const MOOD_DIRS = ["pos", "neg", "neutral"];

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
const moodMap = readJson("fish-mood-map.json");
const stageDrift = readJson("stage-drift.json");
const monologues = readJson("monologues.json");
const npcRegistry = readJson("npcs.json");
const cluesFile = readJson("clues.json");

// ── 〇、NPC 注册表（v3/02 §五 ▸ M3'' 增补：bondDeltas 键与图谱名字/职责的唯一事实源）──
const NPC_ID_RE = /^[a-z][a-z0-9-]*$/;
const npcIds = new Set();
if (npcRegistry && typeof npcRegistry === "object" && !Array.isArray(npcRegistry)) {
  for (const [id, entry] of Object.entries(npcRegistry)) {
    if (!NPC_ID_RE.test(id)) fail("N.REG", `npcs.json id 命名非法（应小写 kebab）：${JSON.stringify(id)}`);
    else npcIds.add(id);
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      fail("N.REG", `npcs.json ${id} 不是对象`);
      continue;
    }
    if (typeof entry.name !== "string" || !entry.name.trim()) fail("N.REG", `npcs.json ${id} 缺非空 name`);
    if (typeof entry.role !== "string" || !entry.role.trim()) fail("N.REG", `npcs.json ${id} 缺非空 role`);
    if (!LINE_KEYS.includes(entry.line)) fail("N.REG", `npcs.json ${id} line 非法：${JSON.stringify(entry.line)}`);
  }
  // 父母默认在册（v3/02 §八）：mother/father 必须注册且挂 fate 线
  for (const p of ["mother", "father"]) {
    const row = npcRegistry?.[p];
    if (!row || row.line !== "fate") fail("N.REG", `npcs.json 缺父母注册项「${p}」（line=fate，v3/02 §八）`);
  }
} else {
  fail("N.REG", "npcs.json 应为对象（{npcId: {name, role, line}}）");
}

// ── 一、事件库（plan/02 §二 + plan/v3/02 ▸ M1'' 增补：ageMonths / line / deltas3 / 资源 / ≥3 选项 / 单调）──
const flagsDefined = new Set(); // 按库内顺序累积：pre 只许引用更早事件定义的 flag（§二第 3 项，防不可达死锁）
/**
 * 线索 flag（v5/02 §十 ▸ v5-M3''''）：由 src/engine/clues.ts 的 resolveClue 写入，**不是**选项 flag。
 * 它们先于事件库进 `flagsDefined`，让线索解锁事件的 `pre` 能引用它们；
 * 但「线索 flag 是否真有人写」由下面 C 区单独守门（不靠事件库自证，防自我参照）。
 */
const clueFlags = new Set();
if (cluesFile && Array.isArray(cluesFile.clues)) {
  for (const clue of cluesFile.clues) {
    for (const ch of clue.choices ?? []) {
      if (typeof ch.flag === "string") {
        clueFlags.add(ch.flag);
        flagsDefined.add(ch.flag);
      }
    }
  }
}
const firstFlagSource = new Map();
const perStage = new Map(STAGES.map((s) => [s, { main: 0, context: 0, critical: 0, rescue: 0, encounter: 0 }]));
const perStageLine = new Map(STAGES.map((s) => [s, Object.fromEntries(LINE_KEYS.map((l) => [l, 0]))]));
const seenEventIds = new Set();
const seenEventTexts = new Set();
const rescuePerRes = { mood: 0, money: 0, health: 0 };
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

    // stage / type / line 枚举；ageHint / text 非空
    if (!STAGES.includes(ev.stage)) fail("E.SCHEMA", `${at} stage 非法：${JSON.stringify(ev.stage)}`);
    else if (typeof ev.id === "string" && !ev.id.startsWith(`${ev.stage}-`)) fail("E.SCHEMA", `${ev.id} 前缀与 stage「${ev.stage}」不一致`);
    if (!EVENT_TYPES.includes(ev.type)) fail("E.SCHEMA", `${at} type 非法：${JSON.stringify(ev.type)}`);
    if (!LINE_KEYS.includes(ev.line)) fail("E.LINE", `${at} line 缺失或非法：${JSON.stringify(ev.line)}（枚举 fate/study/career/love/friend/health，v3/02 §四）`);
    else if (ev.type === "main" && ev.line !== "fate") fail("E.LINE", `${ev.id} main 事件必须挂 fate 线（主线定锚）`);
    // v5 偶遇层（v5/02 §二）：line 恒 fate（不推支线进度）；lineGain 不得出现（偶遇不占进度）
    else if (ev.type === "encounter" && ev.line !== "fate") fail("E.LINE", `${ev.id} encounter 事件 line 必须 fate（偶遇不推 line，v5/02 §二）`);
    if (ev.type === "encounter") {
      if (ev.lineGain !== undefined) fail("E.ENC", `${ev.id} encounter 不应带 lineGain（偶遇不占主线/支线进度，v5/02 §二）`);
      if (typeof ev.detail !== "string" || !ev.detail) fail("E.ENC", `${ev.id} encounter 缺 detail（细看层与主句同为必备，v5/02 §四）`);
      const tlen = [...(ev.text ?? "")].length;
      if (tlen < 40 || tlen > 80) fail("E.ENC", `${ev.id} encounter 文案 ${tlen} 字（口径 40–80 字，v5/02 §二）`);
      // 变体面（v5/02 §三：encounter → draw 或 quick）；本棒曾误写 read 被节奏门抓到，门里补上
      if (ev.variant !== undefined && !["draw", "quick"].includes(ev.variant)) {
        fail("E.ENC", `${ev.id} encounter variant 非法：${JSON.stringify(ev.variant)}（只认 draw|quick，v5/02 §三）`);
      }
    }
    if (ev.type === "rescue") {
      if (!RES_KEYS.includes(ev.rescue)) fail("E.LINE", `${at} rescue 事件缺 rescue 资源键或非法：${JSON.stringify(ev.rescue)}`);
      else rescuePerRes[ev.rescue] += 1;
    } else if (ev.rescue !== undefined) {
      fail("E.LINE", `${at} 非 rescue 事件不应有 rescue 键：${JSON.stringify(ev.rescue)}`);
    }
    if (ev.lineGain !== undefined && (typeof ev.lineGain !== "number" || !Number.isInteger(ev.lineGain) || ev.lineGain < 0 || ev.lineGain > 100)) {
      fail("E.LINE", `${at} lineGain 应为 [0,100] 整数：${JSON.stringify(ev.lineGain)}`);
    }
    if (typeof ev.ageHint !== "string" || !ev.ageHint.trim()) fail("E.SCHEMA", `${at} 缺 ageHint`);
    if (typeof ev.text !== "string" || !ev.text.trim()) fail("E.SCHEMA", `${at} 缺 text`);
    else if (seenEventTexts.has(ev.text)) fail("E.DUP", `${at} 事件文案与更早事件完全重复（§七：禁止换标签充数）`);
    else seenEventTexts.add(ev.text);

    // v3 年龄单调键（v3/02 §一 ▸ M1'' 增补）：ageMonths 与 ageHint 机判全等
    if (!Number.isInteger(ev.ageMonths) || ev.ageMonths < 0 || ev.ageMonths > 1200) {
      fail("E.AGE", `${at} ageMonths 缺失或非法：${JSON.stringify(ev.ageMonths)}（应为 [0,1200] 整数）`);
    } else if (typeof ev.ageHint === "string") {
      const parsed = parseAgeMonths(ev.ageHint);
      if (parsed === null) fail("E.AGE", `${ev.id} ageHint「${ev.ageHint}」不可解析（格式 N个月/N岁/N岁半/N岁M个月）`);
      else if (parsed !== ev.ageMonths) fail("E.AGE", `${ev.id} ageMonths=${ev.ageMonths} ≠ ageHint「${ev.ageHint}」解析值 ${parsed}`);
    }

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

    // options：2–3 条（v5/02 §四：放宽下限、收紧上限；v3 的「≥3」口径已废止）；
    // 至少一轴 deltas3 非零或带 flag；|Δ| 不超口径。encounter 允许单选项「就这样走过去」。
    const optMin = ev.type === "encounter" ? 1 : OPT_COUNT[0];
    if (!Array.isArray(ev.options) || ev.options.length < optMin || ev.options.length > OPT_COUNT[1]) {
      fail("E.OPTIONS", `${at} options 数 ${Array.isArray(ev.options) ? ev.options.length : "非数组"} 不在 ${optMin}–${OPT_COUNT[1]}（v5/02 §四：每题 2–3；偶遇层允许单选项「就这样走过去」，02 §二）`);
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

        // v3 三观主效应（v3/02 §二）：deltas3 必填对象；旧四维 deltas 字段禁止回潮
        if (op.deltas !== undefined) fail("E.VALUES", `${oat} 携带已移除的旧 deltas 字段（v3 schema 只认 deltas3，防回退）`);
        const d3 = op.deltas3 ?? {};
        if (typeof d3 !== "object" || Array.isArray(d3)) {
          fail("E.VALUES", `${oat} deltas3 不是对象`);
        } else {
          if (Object.keys(d3).length === 0 && op.flag === undefined) fail("E.VALUES", `${oat} 既无三观增量也无 flag（v3/02 §二）`);
          const maxAbs = D3_MAX[ev.type] ?? 3;
          for (const [k, v] of Object.entries(d3)) {
            if (!VALUES_AXES.includes(k)) fail("E.VALUES", `${oat} deltas3 轴非法：${k}（枚举 worldview/outlook/values）`);
            else if (!Number.isInteger(v)) fail("E.VALUES", `${oat} deltas3 ${k} 不是整数：${JSON.stringify(v)}`);
            else if (v === 0) fail("E.VALUES", `${oat} deltas3 ${k}=0（零偏移请删掉该轴）`);
            else if (Math.abs(v) > maxAbs) fail("E.VALUES", `${oat} deltas3 ${k}=${v} 超口径（${ev.type} |Δ|≤${maxAbs}，v3/02 §二）`);
          }
        }

        // v3 资源增损（v3/02 §三 ▸ M1'' 增补）：≥1 键、整数非零、不超口径
        const rd = op.resourceDeltas;
        if (rd === undefined || typeof rd !== "object" || Array.isArray(rd)) {
          fail("E.RES", `${oat} resourceDeltas 缺失或不是对象（每选项必填）`);
        } else {
          if (Object.keys(rd).length === 0) fail("E.RES", `${oat} resourceDeltas 为空（每选项 ≥1 项非零增损）`);
          const maxAbs = RES_MAX[ev.type] ?? 10;
          for (const [k, v] of Object.entries(rd)) {
            if (!RES_KEYS.includes(k)) fail("E.RES", `${oat} 资源键非法：${k}（枚举 mood/money/health）`);
            else if (!Number.isInteger(v)) fail("E.RES", `${oat} 资源 ${k} 不是整数：${JSON.stringify(v)}`);
            else if (v === 0) fail("E.RES", `${oat} 资源 ${k}=0（零偏移请删掉该键）`);
            else if (Math.abs(v) > maxAbs) fail("E.RES", `${oat} 资源 ${k}=${v} 超口径（${ev.type} |Δ|≤${maxAbs}，v3/02 §三）`);
          }
        }

        // v3 选项资源门槛（v3/02 §三 ▸ M1'' 增补）
        if (op.requires !== undefined) {
          if (typeof op.requires !== "object" || Array.isArray(op.requires) || Object.keys(op.requires).length === 0) {
            fail("E.REQ", `${oat} requires 应为非空对象`);
          } else {
            for (const [k, v] of Object.entries(op.requires)) {
              if (!RES_KEYS.includes(k)) fail("E.REQ", `${oat} requires 资源键非法：${k}`);
              else if (!Number.isInteger(v) || v < 1 || v > 100) fail("E.REQ", `${oat} requires ${k} 应为 [1,100] 整数：${JSON.stringify(v)}`);
            }
          }
        }
        // v3 关系增量（v3/02 §五 ▸ M3'' 增补）：键须在 npcs.json 注册，|Δ| ≤15，零偏移删键
        if (op.bondDeltas !== undefined) {
          const bd = op.bondDeltas;
          if (typeof bd !== "object" || Array.isArray(bd) || Object.keys(bd).length === 0) {
            fail("N.BOND", `${oat} bondDeltas 应为非空对象`);
          } else {
            for (const [k, v] of Object.entries(bd)) {
              if (!npcIds.has(k)) fail("N.BOND", `${oat} bondDeltas 键「${k}」未在 npcs.json 注册`);
              else if (!Number.isInteger(v)) fail("N.BOND", `${oat} bondDeltas ${k} 不是整数：${JSON.stringify(v)}`);
              else if (v === 0) fail("N.BOND", `${oat} bondDeltas ${k}=0（零偏移请删掉该键）`);
              else if (Math.abs(v) > 15) fail("N.BOND", `${oat} bondDeltas ${k}=${v} 超口径（|Δ| ≤15，v3/02 §五）`);
            }
          }
        }
        if (op.aftermath !== undefined && (typeof op.aftermath !== "string" || !op.aftermath.trim())) fail("E.SCHEMA", `${oat} aftermath 应为非空字符串`);
      }
    }

    // 阶段计数（供骨架密度与 --full 密度矩阵 + v3 线密度）
    if (perStage.has(ev.stage)) perStage.get(ev.stage)[ev.type] += 1;
    if (perStageLine.has(ev.stage) && LINE_KEYS.includes(ev.line)) perStageLine.get(ev.stage)[ev.line] += 1;
  }

  // ── v3 阶段内月龄单调（v3/02 §一 ▸ M1'' 增补①②）──
  for (const s of STAGES) {
    const list = events.filter((e) => e && e.stage === s && Number.isInteger(e.ageMonths));
    let prevMain = -1;
    let maxNonCritical = -1;
    for (const e of list) {
      if (e.type === "main") {
        if (e.ageMonths < prevMain) fail("E.AGE", `${s} main 库序乱序：${e.id}（${e.ageMonths} < 前锚 ${prevMain}）`);
        prevMain = e.ageMonths;
      } else if (e.type !== "critical") {
        maxNonCritical = Math.max(maxNonCritical, e.ageMonths);
      }
    }
    // critical（含支线）全部在普通事件之后出牌：最低月龄的 critical 须 ≥ 非 critical 最大值；
    // critical 之间按月龄排序出牌（同月龄按库序），排序后天然不减。
    const criticals = list.filter((x) => x.type === "critical").sort((a, b) => a.ageMonths - b.ageMonths);
    if (criticals.length && criticals[0].ageMonths < maxNonCritical) {
      fail("E.AGE", `${s} critical 早于本阶段最晚普通事件：${criticals[0].id}（${criticals[0].ageMonths} < ${maxNonCritical}）`);
    }
  }
  // 跨阶段单调（③）：相邻阶段 max ≤ 下一阶段 min
  for (let i = 0; i < STAGES.length - 1; i++) {
    const cur = events.filter((e) => e && e.stage === STAGES[i] && Number.isInteger(e.ageMonths));
    const next = events.filter((e) => e && e.stage === STAGES[i + 1] && Number.isInteger(e.ageMonths));
    if (cur.length && next.length) {
      const curMax = Math.max(...cur.map((e) => e.ageMonths));
      const nextMin = Math.min(...next.map((e) => e.ageMonths));
      if (curMax > nextMin) fail("E.AGE", `跨阶段回退：${STAGES[i]} 最大月龄 ${curMax} > ${STAGES[i + 1]} 最小月龄 ${nextMin}`);
    }
  }
}

// rescue 数量口径（v3/02 §三）：每资源恰好 2 条，共 6 条
for (const r of RES_KEYS) {
  if (rescuePerRes[r] !== 2) fail("E.RES", `rescue 事件 ${r} 资源 ${rescuePerRes[r]} 条 ≠ 口径 2 条（v3/02 §三）`);
} 

// 骨架密度（常开）：每阶段 ≥2 条
for (const s of STAGES) {
  const c = perStage.get(s);
  const total = c.main + c.context + c.critical + c.rescue;
  if (total < SKELETON_MIN_PER_STAGE) fail("E.DENSITY", `阶段 ${s}（${STAGE_LABEL[s]}）仅 ${total} 条（骨架要求每阶段 ≥${SKELETON_MIN_PER_STAGE}，plan/04 1.1）`);
}
// v5 偶遇层密度（v5/02 §二，常开）：全库 ≥40 条且每阶段 ≥5
let encounterTotal = 0;
for (const s of STAGES) {
  const n = perStage.get(s).encounter;
  encounterTotal += n;
  if (n < ENC_PER_STAGE_MIN) {
    fail("E.ENC", `阶段 ${s}（${STAGE_LABEL[s]}）偶遇 ${n} 条 < 口径 ${ENC_PER_STAGE_MIN}（v5/02 §二：每阶段 ≥5）`);
  }
}
if (encounterTotal < ENC_TOTAL_MIN) {
  fail("E.ENC", `偶遇层共 ${encounterTotal} 条 < 口径 ${ENC_TOTAL_MIN}（v5/02 §二：首批 ≥40）`);
}
// --full 密度矩阵（M4 门，fate 线内）：main 4–6 / context ≥8 / critical ≥2
if (WANT_FULL) {
  for (const s of STAGES) {
    const c = perStage.get(s);
    const lines = perStageLine.get(s);
    const fate = { main: c.main, context: c.context, critical: c.critical };
    if (fate.main < DENSITY.main[0] || fate.main > DENSITY.main[1]) fail("E.DENSITY", `阶段 ${s} fate main ${fate.main} 条（口径 ${DENSITY.main[0]}–${DENSITY.main[1]}）`);
    if (fate.context < DENSITY.context[0]) fail("E.DENSITY", `阶段 ${s} fate context ${fate.context} 条（口径 ≥${DENSITY.context[0]}）`);
    if (fate.critical < DENSITY.critical[0]) fail("E.DENSITY", `阶段 ${s} fate critical ${fate.critical} 条（口径 ≥${DENSITY.critical[0]}）`);
  }
}
// v3 支线密度（v3/02 §四 ▸ M1'' 增补，常开分批）：已开启的线每阶段 ≥3
for (const s of STAGES) {
  const lines = perStageLine.get(s);
  for (const l of LINE_DENSITY_ON) {
    if (lines[l] < LINE_DENSITY_MIN) fail("E.DENSITY", `阶段 ${s} ${l} 线 ${lines[l]} 条 < 口径 ${LINE_DENSITY_MIN}（v3/02 §四分批口径）`);
  }
}

// ── 二·五、三观层文件（v3/02 §二 ▸ M1'' 增补：漂移表 + 独白表）──
let driftOk = 0;
if (stageDrift && typeof stageDrift === "object" && !Array.isArray(stageDrift)) {
  for (const s of STAGES) {
    const row = stageDrift[s];
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      fail("V.DRIFT", `stage-drift 缺阶段「${s}」行`);
      continue;
    }
    for (const axis of VALUES_AXES) {
      const v = row[axis];
      if (typeof v !== "number" || !Number.isInteger(v) || Math.abs(v) > 2) {
        fail("V.DRIFT", `stage-drift ${s}.${axis} 应为 |值| ≤2 整数：${JSON.stringify(v)}`);
      } else {
        driftOk++;
      }
    }
  }
  const extra = Object.keys(stageDrift).filter((k) => k !== "_meta" && !STAGES.includes(k));
  if (extra.length) fail("V.DRIFT", `stage-drift 含未知阶段键：${extra.join(",")}`);
} else if (stageDrift !== null) {
  fail("V.DRIFT", "stage-drift.json 应为对象（_meta + 8 阶段键）");
}
let monoOk = 0;
if (monologues && typeof monologues === "object" && !Array.isArray(monologues)) {
  for (const axis of VALUES_AXES) {
    const cell = monologues[axis];
    if (!cell || typeof cell !== "object" || Array.isArray(cell)) {
      fail("V.MONO", `monologues 缺轴「${axis}」`);
      continue;
    }
    for (const band of ["low", "mid", "high"]) {
      if (typeof cell[band] !== "string" || !cell[band].trim()) fail("V.MONO", `monologues ${axis}.${band} 缺非空文案`);
      else monoOk++;
    }
  }
  const extra = Object.keys(monologues).filter((k) => k !== "_meta" && !VALUES_AXES.includes(k));
  if (extra.length) fail("V.MONO", `monologues 含未知键：${extra.join(",")}`);
} else if (monologues !== null) {
  fail("V.MONO", "monologues.json 应为对象（_meta + 3 轴键）");
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

// ── 五、fish-mood-map（v2/02 §二：表情映射）──
let moodStats = null;
if (moodMap && typeof moodMap === "object" && !Array.isArray(moodMap)) {
  // 帧名清单 = fish/ 目录的两位编号表情（不在此复写清单）；19 张是口径数字，漂移即红
  const fishDir = join(ROOT, "assets", "dafeiyu", "fish");
  const diskFrames = existsSync(fishDir)
    ? readdirSync(fishDir).filter((n) => /^\d{2}\.webp$/i.test(n)).map((n) => n.replace(/\.webp$/i, "")).sort()
    : [];
  if (diskFrames.length !== MOOD_FRAME_COUNT) {
    fail("M.COUNT", `assets/dafeiyu/fish/ 编号表情 ${diskFrames.length} 张 ≠ 口径 ${MOOD_FRAME_COUNT}（v2/02 §二，清单漂移先修台账）`);
  }
  const frames = moodMap.frames;
  const frameNames = frames && typeof frames === "object" && !Array.isArray(frames) ? Object.keys(frames) : [];
  const onDisk = new Set(diskFrames);
  for (const k of frameNames) {
    if (!onDisk.has(k)) fail("M.FRAME", `frames 键「${k}」在 assets/dafeiyu/fish/ 无对应编号表情件`);
    const f = frames[k];
    if (!f || typeof f !== "object" || Array.isArray(f)) {
      fail("M.SCHEMA", `frames.${k} 不是对象`);
      continue;
    }
    if (!MOOD_SEGS.includes(f.seg)) fail("M.SCHEMA", `frames.${k}.seg 非法：${JSON.stringify(f.seg)}（枚举 ${MOOD_SEGS.join("/")}）`);
    if (!MOOD_DIRS.includes(f.dir)) fail("M.SCHEMA", `frames.${k}.dir 非法：${JSON.stringify(f.dir)}（枚举 ${MOOD_DIRS.join("/")}）`);
    if (typeof f.hint !== "string" || !f.hint.trim()) fail("M.SCHEMA", `frames.${k} 缺非空 hint（aria 语义）`);
  }
  // 覆盖 19/19：目录里每张编号表情都被映射引用至少一次
  const referenced = new Set();
  const addRef = (k) => { if (frameNames.includes(k)) referenced.add(k); else fail("M.REF", `映射引用了未登记帧「${k}」`); };
  const stage = moodMap.stage;
  if (!stage || typeof stage !== "object" || Array.isArray(stage)) {
    fail("M.STAGE", "stage 不是对象（8 阶段 × 情绪弧，v2/02 §二）");
  } else {
    const stageKeys = Object.keys(stage).sort();
    if (JSON.stringify(stageKeys) !== JSON.stringify([...STAGES].sort())) {
      fail("M.STAGE", `stage 键 ${stageKeys.join(",")} ≠ 8 阶段全集`);
    }
    for (const [k, list] of Object.entries(stage)) {
      if (!Array.isArray(list) || list.length < 1 || list.length > 2) {
        fail("M.STAGE", `stage.${k} 应为 1–2 张，实为 ${JSON.stringify(list)}`);
        continue;
      }
      list.forEach(addRef);
    }
  }
  const ending = moodMap.ending;
  if (!ending || typeof ending !== "object" || Array.isArray(ending)) {
    fail("M.ENDING", "ending 不是对象（9 结局各锁 1 张，v2/02 §二）");
  } else {
    const endingIds = Array.isArray(endings) ? endings.map((e) => e.id) : [];
    const mapKeys = Object.keys(ending).sort();
    if (JSON.stringify(mapKeys) !== JSON.stringify([...endingIds].sort())) {
      fail("M.ENDING", `ending 键与 endings.json id 全集不一致：${mapKeys.join(",")}`);
    }
    const locked = Object.values(ending);
    for (const k of locked) addRef(k);
    if (new Set(locked).size !== locked.length) {
      const dup = locked.filter((k, i) => locked.indexOf(k) !== i);
      fail("M.ENDING", `终局锁定帧重复：${[...new Set(dup)].join(",")}（9 结局不重复，v2/02 §二）`);
    }
  }
  const lockedLen = ending && typeof ending === "object" && !Array.isArray(ending) ? Object.keys(ending).length : 0;
  const missing = diskFrames.filter((k) => !frameNames.includes(k));
  if (missing.length) fail("M.COVER", `映射表缺帧：${missing.join(",")}（覆盖 ${diskFrames.length - missing.length}/${diskFrames.length}）`);
  moodStats = { covered: diskFrames.length - missing.length, total: diskFrames.length, locked: lockedLen };
}

// ── I、图标对照（v3/02 §九 + v4/02 §六 objectKey：每事件 1 枚主题图标；
//    v4-M3''' 起条目形状为 {objectKey: 图标名|null}，null = 显式豁免（卡片不配图，宁缺毋滥 ≤10%））──
const iconMap = readJson("icon-map.json");
let iconStats = null;
if (iconMap && events && Array.isArray(events)) {
  const eventIds = events.map((e) => e.id);
  const missingIds = eventIds.filter((id) => !(id in iconMap));
  const extraIds = Object.keys(iconMap).filter((id) => !eventIds.includes(id));
  if (missingIds.length) fail("I.COVER", `对照表缺 ${missingIds.length} 条事件：${missingIds.slice(0, 8).join(",")}${missingIds.length > 8 ? "…" : ""}`);
  if (extraIds.length) fail("I.EXTRA", `对照表含 ${extraIds.length} 条不存在的事件 id：${extraIds.slice(0, 8).join(",")}`);
  if (typeof iconMap !== "object" || Array.isArray(iconMap)) fail("I.SCHEMA", "icon-map.json 应为 {事件id: {objectKey}} 对象");
  // objectKey 形状：小写 kebab-case 图标名（字符串）或显式 null（豁免）
  const badShape = Object.entries(iconMap)
    .filter(
      ([, v]) =>
        typeof v !== "object" ||
        v === null ||
        Array.isArray(v) ||
        Object.keys(v).length !== 1 ||
        !("objectKey" in v) ||
        (typeof v.objectKey !== "string" && v.objectKey !== null),
    )
    .slice(0, 5);
  if (badShape.length)
    fail("I.SCHEMA", `条目形状非法（应为 {objectKey:图标名|null}）：${badShape.map(([k, v]) => `${k}→${JSON.stringify(v)}`).join("、")}`);
  const named = Object.entries(iconMap).filter(
    ([, v]) => typeof v === "object" && v !== null && !Array.isArray(v) && typeof v.objectKey === "string",
  );
  const exempt = Object.entries(iconMap).filter(
    ([, v]) => typeof v === "object" && v !== null && !Array.isArray(v) && v.objectKey === null,
  );
  const badNames = named.filter(([, v]) => !/^[a-z0-9-]+$/.test(v.objectKey));
  if (badNames.length) fail("I.NAME", `objectKey 非法（应小写 kebab-case）：${badNames.slice(0, 5).map(([k, v]) => `${k}→${JSON.stringify(v.objectKey)}`).join("、")}`);
  // 图标 SVG 实物存在性（assets/game-icons/icons/<作者>/<名>.svg 按 basename 对账）
  const iconDir = join(ROOT, "assets", "game-icons", "icons");
  const diskIcons = new Set();
  const walkIcons = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walkIcons(full);
      else if (name.endsWith(".svg")) diskIcons.add(name.slice(0, -4));
    }
  };
  walkIcons(iconDir);
  const noFile = [...new Set(named.map(([, v]) => v.objectKey))].filter((n) => !diskIcons.has(n));
  if (noFile.length) fail("I.FILE", `objectKey 引用的图标无 SVG 实物：${noFile.slice(0, 8).join(",")}${noFile.length > 8 ? "…" : ""}`);
  // 豁免单独计数（02 §六：宁缺毋滥，目标 ≤10%）
  const exemptMax = Math.floor(eventIds.length * 0.1);
  const exemptIds = exempt.map(([id]) => id);
  if (exempt.length > exemptMax)
    fail("I.EXEMPT", `objectKey 豁免（null）${exempt.length} 条 > 上限 ${exemptMax}（≤10%，v4/02 §六）：${exemptIds.slice(0, 8).join(",")}${exemptIds.length > 8 ? "…" : ""}`);
  iconStats = { covered: eventIds.length - missingIds.length, total: eventIds.length, disk: diskIcons.size, exempt: exempt.length, exemptMax };
}

// ── C、轻量线索（v5/02 §十 D10 ▸ v5-M3''''）──
// 判据只查「cross-reference 的事实」，不复写判定逻辑（判定单源 = src/engine/clues.ts，单测守）：
//   C.SCHEMA 形状 / C.REF 锚定与解锁事件必须真实存在 / C.STAGE 阶段与锚事件一致 /
//   C.LEN 文案长度（prompt ≤20 字、2–3 条；choice ≤12 字、恰好 2 个）/ C.FLAG flag 命名与唯一 /
//   C.DENSITY 每阶段 ≤1 处 / C.UNLOCK 解锁事件必须真的把该 flag 写进 pre（否则线索不改变任何事）。
let clueStats = null;
if (cluesFile && Array.isArray(cluesFile.clues) && Array.isArray(events)) {
  const eventById = new Map(events.filter((e) => e && typeof e.id === "string").map((e) => [e.id, e]));
  const perStageClues = new Map(STAGES.map((s) => [s, 0]));
  const seenClueIds = new Set();
  const seenClueFlags = new Set();
  let total = 0;
  for (const clue of cluesFile.clues) {
    const at = `clues.json ${clue?.id ?? "?"}`;
    if (!clue || typeof clue !== "object" || Array.isArray(clue)) {
      fail("C.SCHEMA", `${at} 不是对象`);
      continue;
    }
    if (typeof clue.id !== "string" || !/^clue-[a-z]+-\d{2}$/.test(clue.id)) {
      fail("C.SCHEMA", `${at} id 非法（应 clue-{stage}-NN）`);
    } else if (seenClueIds.has(clue.id)) {
      fail("C.SCHEMA", `${at} id 重复`);
    } else seenClueIds.add(clue.id);
    if (!STAGES.includes(clue.stage)) {
      fail("C.SCHEMA", `${at} stage 非法：${JSON.stringify(clue.stage)}`);
      continue;
    }
    perStageClues.set(clue.stage, perStageClues.get(clue.stage) + 1);
    total += 1;

    // 锚事件：必须存在、属同一阶段、且不是 critical（critical 是本阶段末尾锚，线索要早于它才有下落）
    const anchor = eventById.get(clue.anchorEventId);
    if (!anchor) fail("C.REF", `${at} anchorEventId「${clue.anchorEventId}」在事件库不存在`);
    else {
      if (anchor.stage !== clue.stage) fail("C.STAGE", `${at} anchor 阶段 ${anchor.stage} ≠ 线索阶段 ${clue.stage}`);
      if (anchor.type === "critical") fail("C.STAGE", `${at} anchor 不得是 critical（本阶段末尾出牌，线索来不及触发）`);
    }

    // prompts：2–3 条、每条 ≤20 字、非空去重
    const prompts = clue.prompts;
    if (!Array.isArray(prompts) || prompts.length < 2 || prompts.length > 3) {
      fail("C.LEN", `${at} prompts 应为 2–3 条（实为 ${Array.isArray(prompts) ? prompts.length : "非数组"}）`);
    } else {
      const seenPrompt = new Set();
      for (const p of prompts) {
        if (typeof p !== "string" || !p.trim()) fail("C.LEN", `${at} prompt 缺非空文案`);
        else if ([...p].length > 20) fail("C.LEN", `${at} prompt「${p}」${[...p].length} 字 > 20`);
        else if (seenPrompt.has(p)) fail("C.LEN", `${at} prompt 重复：「${p}」`);
        else seenPrompt.add(p);
      }
    }

    // choices：恰好 2 个、每个 ≤12 字、flag 合法且全库唯一
    const choices = clue.choices;
    if (!Array.isArray(choices) || choices.length !== 2) {
      fail("C.SCHEMA", `${at} choices 应恰好 2 个（实为 ${Array.isArray(choices) ? choices.length : "非数组"}）`);
      continue;
    }
    for (const ch of choices) {
      if (!ch || typeof ch !== "object" || Array.isArray(ch)) {
        fail("C.SCHEMA", `${at} choice 不是对象`);
        continue;
      }
      if (typeof ch.text !== "string" || !ch.text.trim()) fail("C.LEN", `${at} choice 缺非空文案`);
      else if ([...ch.text].length > 12) fail("C.LEN", `${at} choice「${ch.text}」${[...ch.text].length} 字 > 12`);
      if (typeof ch.flag !== "string" || !FLAG_RE.test(ch.flag)) fail("C.FLAG", `${at} choice flag 命名非法：${JSON.stringify(ch.flag)}`);
      else if (seenClueFlags.has(ch.flag)) fail("C.FLAG", `${at} choice flag 重复（两条解读必须写不同的 flag）：${ch.flag}`);
      else seenClueFlags.add(ch.flag);
    }

    // unlockEventIds：与 choices 同序、恰好 2 个、事件存在且 `pre` 真的含对应 flag
    const unlockIds = clue.unlockEventIds;
    if (!Array.isArray(unlockIds) || unlockIds.length !== 2) {
      fail("C.SCHEMA", `${at} unlockEventIds 应为 2 个（与 choices 同序）`);
      continue;
    }
    for (let i = 0; i < 2; i++) {
      const uid = unlockIds[i];
      const flag = choices[i]?.flag;
      const target = eventById.get(uid);
      if (!target) {
        fail("C.REF", `${at} unlockEventIds[${i}]「${uid}」在事件库不存在`);
        continue;
      }
      if (target.stage !== clue.stage) fail("C.STAGE", `${at} 解锁事件 ${uid} 阶段 ${target.stage} ≠ 线索阶段 ${clue.stage}`);
      if (!Array.isArray(target.pre) || !target.pre.includes(flag)) {
        fail("C.UNLOCK", `${at} 解锁事件 ${uid} 的 pre 未包含 flag「${flag}」（线索写了 flag 却不改变任何事）`);
      }
    }
  }
  for (const s of STAGES) {
    const n = perStageClues.get(s) ?? 0;
    if (n > 1) fail("C.DENSITY", `阶段 ${s} 线索 ${n} 处 > 口径 1 处（v5/02 §十：每阶段 ≤1）`);
  }
  // 反向：事件库里出现、但 clues.json 从未声明的 `clue-` 前缀 flag（防两处各记一份）
  for (const f of flagsDefined) {
    if (typeof f === "string" && f.startsWith("clue-") && !clueFlags.has(f)) {
      fail("C.FLAG", `flag「${f}」以 clue- 开头但 clues.json 未声明（线索 flag 单源在 clues.json）`);
    }
  }
  clueStats = { total, stages: perStageClues.size, flags: clueFlags.size };
} else {
  fail("C.SCHEMA", "clues.json 缺 clues 数组（v5/02 §十）");
}

// ── S、v5 语义配图（plan/v5/02 §九 D9 ▸ v5-M3''''）──
// 判据：标签封闭且 ≥16 类 / 每个标签 ≥2 张 / 场景图文件实物存在 / keyTag 不含死键 /
//       覆盖率 ≥60% / 豁免清单可复算（不写死数字，随 icon-map 与事件库变化重算）。
let sceneStats = null;
const sceneMap = readJson("scene-map.json");
if (sceneMap && Array.isArray(events)) {
  const SCENE_MIN_TAGS = 16;
  const SCENE_MIN_PER_TAG = 2;
  const SCENE_COVERAGE_MIN = 0.6;
  const sceneDir = join(ROOT, "assets", "web-ready", "scenes");
  const diskScenes = new Set();
  if (existsSync(sceneDir)) {
    for (const name of readdirSync(sceneDir)) {
      // v5.1.0：分发物改为 AVIF（具象配图）。源 WebP 在 scenes-src/，不参与分发、不在此扫。
      if (name.endsWith(".avif")) diskScenes.add(name);
    }
  }
  const tags = sceneMap.tags;
  const keyTag = sceneMap.keyTag;
  if (!tags || typeof tags !== "object" || Array.isArray(tags)) {
    fail("S.SCHEMA", "scene-map.json 缺 tags 表（{标签: [场景图文件名…]}，v5/02 §九）");
  } else if (!keyTag || typeof keyTag !== "object" || Array.isArray(keyTag)) {
    fail("S.SCHEMA", "scene-map.json 缺 keyTag 表（{objectKey: 标签}，v5/02 §九）");
  } else {
    const tagNames = Object.keys(tags);
    if (tagNames.length < SCENE_MIN_TAGS) {
      fail("S.TAG", `语义标签 ${tagNames.length} 类 < 口径 ${SCENE_MIN_TAGS} 类（v5/02 §九「首批 ≥16」）`);
    }
    const referenced = new Set();
    for (const [tag, list] of Object.entries(tags)) {
      if (!/^[a-z][a-z-]*$/.test(tag)) fail("S.TAG", `标签名非法（应小写 kebab）：${tag}`);
      if (!Array.isArray(list) || list.length < SCENE_MIN_PER_TAG) {
        fail("S.TAG", `标签「${tag}」场景图 ${Array.isArray(list) ? list.length : "非数组"} 张 < 口径 ${SCENE_MIN_PER_TAG} 张（一图多事件的前提是同类里至少有选择）`);
        continue;
      }
      for (const file of list) {
        if (typeof file !== "string" || !/^[a-z][a-z0-9-]*\.avif$/.test(file)) {
          fail("S.FILE", `标签「${tag}」场景文件名非法：${JSON.stringify(file)}`);
          continue;
        }
        if (!file.startsWith(`${tag}-`)) fail("S.NAME", `场景图「${file}」前缀与标签「${tag}」不一致`);
        if (!diskScenes.has(file)) fail("S.FILE", `场景图「${file}」在 assets/web-ready/scenes/ 无实物`);
        referenced.add(file);
      }
    }
    // 反向：磁盘上存在但映射表没登记的图（防「画了没用上」，也防漏登记导致覆盖虚低）
    const orphan = [...diskScenes].filter((f) => !referenced.has(f));
    if (orphan.length) fail("S.EXTRA", `assets/web-ready/scenes/ 有 ${orphan.length} 张图未登记进 scene-map.json：${orphan.slice(0, 6).join(",")}${orphan.length > 6 ? "…" : ""}`);

    // keyTag：每个值必须是已声明标签；每个键必须是 icon-map 真用到的 objectKey（死键 = 静默无效）
    const liveKeys = new Set(Object.values(iconMap ?? {}).map((v) => v?.objectKey).filter(Boolean));
    for (const [key, tag] of Object.entries(keyTag)) {
      if (!(tag in tags)) fail("S.TAG", `keyTag「${key}」指向未声明标签「${tag}」`);
      if (!liveKeys.has(key)) fail("S.KEY", `keyTag 含 icon-map 里不存在的 objectKey「${key}」（死键：对覆盖率零贡献）`);
    }

    // 覆盖率（口径 ≥60%）：按事件逐个复算，不写死数字
    let covered = 0;
    const exempt = [];
    for (const ev of events) {
      const key = iconMap?.[ev.id]?.objectKey ?? null;
      if (key && keyTag[key]) covered += 1;
      else exempt.push(ev.id);
    }
    const ratio = covered / events.length;
    if (ratio < SCENE_COVERAGE_MIN) {
      fail("S.COVER", `配图覆盖 ${covered}/${events.length} = ${(ratio * 100).toFixed(1)}% < 口径 ${SCENE_COVERAGE_MIN * 100}%（v5/02 §九）`);
    }
    sceneStats = { tags: tagNames.length, files: referenced.size, covered, total: events.length, ratio, exempt: exempt.length };
  }
} else {
  fail("S.SCHEMA", "scene-map.json 读取失败或事件库缺失（v5/02 §九）");
}

// ── R、v4 历法/年代库/画像/家庭（plan/v4/02 §一/二/三 ▸ M1''' 增补；区字母 E 已被 v1 事件库占用）──
const eraEvents = readJson("era-events.json");
const namesPool = readJson("names.json");
const V4_ENUMS = {
  region: ["南方", "北方"],
  structure: ["独生", "双孩", "多孩", "单亲", "隔代"],
  parentsJob: ["工人", "农民", "个体", "教师医生", "公职", "待岗"],
  wealth: ["拮据", "一般", "宽裕"],
};
/** v4 八因素组合空间：6era×4place×4mood×3style × 2region×5structure×6job×3wealth（域检查用超集，含不可达组合） */
const V4_BIRTH_COMBOS = 6 * 4 * 4 * 3 * 2 * 5 * 6 * 3;
const ERA_YEAR_MIN = 1955;
const ERA_YEAR_MAX = 2030;
const ERA_ANCHOR_COUNT = 76;
/** 国际锚上限 = floor(76 × 15%) = 11（02 §二） */
const ERA_INTL_MAX = Math.floor(ERA_ANCHOR_COUNT * 0.15);
const ERA_ID_RE = /^era-(\d{4})-[a-z0-9-]+$/;
const ERA_CHECK_STATUS = ["✅已核对", "典型值", "待核"];
let eraStats = null;
if (Array.isArray(eraEvents)) {
  const seenIds = new Set();
  const yearCount = new Map();
  let intl = 0;
  let verified = 0;
  let typical = 0;
  for (let i = 0; i < eraEvents.length; i++) {
    const ev = eraEvents[i];
    const at = `era-events.json#${i}`;
    if (!ev || typeof ev !== "object" || Array.isArray(ev)) {
      fail("R.SCHEMA", `${at} 不是对象`);
      continue;
    }
    const idm = typeof ev.id === "string" ? ERA_ID_RE.exec(ev.id) : null;
    if (!idm) fail("R.SCHEMA", `${at} id 非法：${JSON.stringify(ev.id)}（应 era-YYYY-kebab）`);
    else if (seenIds.has(ev.id)) fail("R.SCHEMA", `id 重复：${ev.id}`);
    else seenIds.add(ev.id);
    if (!Number.isInteger(ev.year) || ev.year < ERA_YEAR_MIN || ev.year > ERA_YEAR_MAX) {
      fail("R.SCHEMA", `${at} year 非法：${JSON.stringify(ev.year)}（应 ${ERA_YEAR_MIN}–${ERA_YEAR_MAX} 整数）`);
    } else {
      if (idm && Number(idm[1]) !== ev.year) fail("R.SCHEMA", `${ev.id} id 年段 ${idm[1]} ≠ year ${ev.year}`);
      yearCount.set(ev.year, (yearCount.get(ev.year) ?? 0) + 1);
    }
    if (ev.scope !== "national" && ev.scope !== "international") {
      fail("R.SCHEMA", `${at} scope 非法：${JSON.stringify(ev.scope)}`);
    } else if (ev.scope === "international") intl += 1;
    if (typeof ev.titleHint !== "string" || !ev.titleHint.trim()) fail("R.SCHEMA", `${at} 缺非空 titleHint`);
    if (typeof ev.text !== "string" || !ev.text.trim()) fail("R.SCHEMA", `${at} 缺非空 text`);
    // 增量口径：|Δ3| ≤2 / |res| ≤8；两项至少一项非空（时代卡必有固定增量）
    const d3 = ev.deltas3;
    const rd = ev.resourceDeltas;
    const d3Ok = d3 && typeof d3 === "object" && !Array.isArray(d3);
    const rdOk = rd && typeof rd === "object" && !Array.isArray(rd);
    if (!d3Ok) fail("R.DELTA", `${at} deltas3 不是对象`);
    if (!rdOk) fail("R.DELTA", `${at} resourceDeltas 不是对象`);
    if (d3Ok && rdOk && Object.keys(d3).length === 0 && Object.keys(rd).length === 0) {
      fail("R.DELTA", `${at} 时代卡无任何增量（deltas3/resourceDeltas 至少一项非空，02 §二）`);
    }
    if (d3Ok) {
      for (const [k, v] of Object.entries(d3)) {
        if (!VALUES_AXES.includes(k)) fail("R.DELTA", `${at} deltas3 轴非法：${k}`);
        else if (!Number.isInteger(v) || v === 0) fail("R.DELTA", `${at} deltas3 ${k} 应为非零整数：${JSON.stringify(v)}`);
        else if (Math.abs(v) > 2) fail("R.DELTA", `${at} deltas3 ${k}=${v} 超口径（|Δ| ≤2，02 §二）`);
      }
    }
    if (rdOk) {
      for (const [k, v] of Object.entries(rd)) {
        if (!RES_KEYS.includes(k)) fail("R.DELTA", `${at} 资源键非法：${k}`);
        else if (!Number.isInteger(v) || v === 0) fail("R.DELTA", `${at} 资源 ${k} 应为非零整数：${JSON.stringify(v)}`);
        else if (Math.abs(v) > 8) fail("R.DELTA", `${at} 资源 ${k}=${v} 超口径（|Δ| ≤8，02 §二）`);
      }
    }
    if (!Array.isArray(ev.stageFit) || ev.stageFit.length === 0) {
      fail("R.SCHEMA", `${at} stageFit 应为非空数组`);
    } else if (ev.stageFit.some((s) => !STAGES.includes(s))) {
      fail("R.SCHEMA", `${at} stageFit 含未知阶段：${JSON.stringify(ev.stageFit)}`);
    }
    if (!ERA_CHECK_STATUS.includes(ev.checkStatus)) {
      fail("R.FACT", `${at} checkStatus 非法：${JSON.stringify(ev.checkStatus)}（枚举 ${ERA_CHECK_STATUS.join("/")}）`);
    } else if (ev.checkStatus === "待核") {
      fail("R.FACT", `${at} checkStatus=待核（M1''' 出口门禁：76 锚不得留待核）`);
    } else if (ev.checkStatus === "✅已核对") verified += 1;
    else typical += 1;
  }
  // 主锚数量与年份连续（每年恰 1 条，1955–2030 无缺无重）
  if (yearCount.size !== ERA_YEAR_MAX - ERA_YEAR_MIN + 1 || eraEvents.length !== ERA_ANCHOR_COUNT) {
    const missing = [];
    for (let y = ERA_YEAR_MIN; y <= ERA_YEAR_MAX; y++) {
      if ((yearCount.get(y) ?? 0) !== 1) missing.push(y);
    }
    fail("R.MAIN", `主锚 ${eraEvents.length} 条 / 覆盖年份 ${yearCount.size} 个 ≠ 口径 76 锚逐年 1 条；异常年份：${missing.slice(0, 10).join(",")}${missing.length > 10 ? "…" : ""}`);
  }
  if (intl > ERA_INTL_MAX) fail("R.MAIN", `国际锚 ${intl} 条 > 上限 ${ERA_INTL_MAX}（占比 ≤15%，02 §二）`);
  // 查证三态表对账（docs/v4-era-facts.md）：行数 = 主锚数且逐锚在表
  const factsPath = join(ROOT, "docs", "v4-era-facts.md");
  if (!existsSync(factsPath)) {
    fail("R.FACT", "缺 docs/v4-era-facts.md（查证三态表，02 §二）");
  } else {
    const facts = readFileSync(factsPath, "utf8");
    const rows = (facts.match(/^\| era-\d{4}-[a-z0-9-]+ \|.+\|$/gm) ?? []);
    if (rows.length !== ERA_ANCHOR_COUNT) fail("R.FACT", `查证表数据行 ${rows.length} ≠ 主锚 ${ERA_ANCHOR_COUNT}`);
    for (const id of seenIds) {
      if (!facts.includes(`| ${id} |`)) fail("R.FACT", `查证表缺锚行：${id}`);
    }
    for (const row of rows) {
      if (!/\|\s*(✅已核对|典型值)\s*\|?\s*$/.test(row) && !row.includes("✅已核对") && !row.includes("典型值")) {
        fail("R.FACT", `查证表行状态列非法：${row.slice(0, 50)}`);
      }
    }
  }
  eraStats = { count: eraEvents.length, intl, verified, typical };
} else {
  fail("R.SCHEMA", "era-events.json 应为 76 条主锚数组（02 §二）");
}

// names.json 姓名池（02 §三 ▸ M1'''：姓池 + 南北男女分池，同局无重复由 family.ts 保证）
let namesStats = null;
if (namesPool && typeof namesPool === "object" && !Array.isArray(namesPool)) {
  const surnames = namesPool["姓"];
  if (!Array.isArray(surnames) || surnames.length < 10 || surnames.some((s) => typeof s !== "string" || !s.trim())) {
    fail("R.NAMES", "names.json 姓池应为 ≥10 个非空串数组");
  } else if (new Set(surnames).size !== surnames.length) {
    fail("R.NAMES", "names.json 姓池有重复");
  }
  let given = 0;
  for (const region of ["南方", "北方"]) {
    const pool = namesPool[region];
    if (!pool || typeof pool !== "object" || Array.isArray(pool)) {
      fail("R.NAMES", `names.json 缺 ${region} 池`);
      continue;
    }
    for (const gender of ["男", "女"]) {
      const list = pool[gender];
      if (!Array.isArray(list) || list.length < 16 || list.some((n) => typeof n !== "string" || !n.trim())) {
        fail("R.NAMES", `names.json ${region}.${gender} 应为 ≥16 个非空串数组`);
      } else if (new Set(list).size !== list.length) {
        fail("R.NAMES", `names.json ${region}.${gender} 有重复名`);
      } else {
        given += list.length;
      }
    }
  }
  namesStats = { surnames: Array.isArray(surnames) ? surnames.length : 0, given };
} else {
  fail("R.NAMES", "names.json 应为对象（姓 + 南北分池，02 §三）");
}

// npcs.json 家庭注册槽（02 §三 ▸ M1'''：grandma/grandpa/sibling-1..3，line 全 fate）
for (const slot of ["grandma", "grandpa", "sibling-1", "sibling-2", "sibling-3"]) {
  const row = npcRegistry?.[slot];
  if (!row || row.line !== "fate") fail("R.SLOT", `npcs.json 缺家庭注册槽「${slot}」（line=fate，v4/02 §三）`);
}

// ── F、家庭槽位（plan/v5/02 §一 ▸ v5-M1''''：slot 唯一 / 结构↔槽组合合法 / role↔slot 一致）──
const familySlots = readJson("family-slots.json");
let familyStats = null;
if (familySlots && typeof familySlots === "object" && !Array.isArray(familySlots)) {
  const slotTable = familySlots.slots;
  const structures = familySlots.structures;
  const groups = familySlots.groups;
  if (!slotTable || typeof slotTable !== "object" || Array.isArray(slotTable)) {
    fail("F.SCHEMA", "family-slots.json 缺 slots 表");
  } else {
    // 槽位形状：role 非空 + group 枚举 + 槽键 kebab
    const GROUPS = ["parent", "grandparent", "sibling"];
    for (const [slot, def] of Object.entries(slotTable)) {
      if (!/^(parent|gp|sib)-[a-z-]+$/.test(slot)) fail("F.SLOT", `槽位键非法（应 parent-/gp-/sib- 前缀 kebab）：${slot}`);
      if (!def || typeof def !== "object" || Array.isArray(def)) {
        fail("F.SCHEMA", `slots.${slot} 不是对象`);
        continue;
      }
      if (typeof def.role !== "string" || !def.role.trim()) fail("F.SLOT", `slots.${slot} 缺非空 role`);
      if (!GROUPS.includes(def.group)) fail("F.SLOT", `slots.${slot}.group 非法：${JSON.stringify(def.group)}`);
      // role 泛称禁令（本次缺陷本体）：role 不得为「父母/祖辈/同辈」
      if (["父母", "祖辈", "同辈", "家长"].includes(def.role)) fail("F.ROLE", `slots.${slot}.role 用了泛称「${def.role}」（v5/02 §一：逐位命名）`);
    }
    // 父母槽必在（内环锚）
    for (const need of ["parent-father", "parent-mother"]) {
      if (!(need in slotTable)) fail("F.SLOT", `slots 缺父母槽「${need}」`);
    }
    // 祖辈双侧齐（南北派生两套，缺一侧会让 role 落空）
    for (const side of ["paternal", "maternal"]) {
      for (const who of ["grandpa", "grandma"]) {
        if (!(`gp-${side}-${who}` in slotTable)) fail("F.SLOT", `slots 缺「gp-${side}-${who}」`);
      }
    }
  }
  // structures：封闭结构与 model 对齐 + 区间形状合法 + 槽组合可满足
  const STRUCTURES = ["独生", "双孩", "多孩", "单亲", "隔代"];
  if (!structures || typeof structures !== "object" || Array.isArray(structures)) {
    fail("F.SCHEMA", "family-slots.json 缺 structures 表");
  } else {
    for (const s of STRUCTURES) {
      const rule = structures[s];
      if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        fail("F.STRUCT", `structures 缺结构「${s}」`);
        continue;
      }
      const rangeOk = (v, lo, hi, label) => {
        const arr = typeof v === "number" ? [v, v] : Array.isArray(v) ? v : null;
        if (!arr || arr.length !== 2 || !arr.every(Number.isInteger)) return fail("F.STRUCT", `structures.${s}.${label} 应为整数或 [lo,hi]：${JSON.stringify(v)}`);
        if (arr[0] < lo || arr[1] > hi || arr[0] > arr[1]) fail("F.STRUCT", `structures.${s}.${label} 出域 [${lo},${hi}]：${JSON.stringify(v)}`);
        return arr;
      };
      rangeOk(rule.parents, 0, 2, "parents");
      rangeOk(rule.grandparents, 0, 2, "grandparents");
      const sib = rangeOk(rule.siblings, 0, 3, "siblings");
      if (!Number.isInteger(rule.olderSiblings) || rule.olderSiblings < 0) fail("F.STRUCT", `structures.${s}.olderSiblings 应为 ≥0 整数`);
      else if (sib && rule.olderSiblings > sib[1]) fail("F.STRUCT", `structures.${s}.olderSiblings ${rule.olderSiblings} > siblings 上限 ${sib[1]}`);
      // 隔代必 2 位祖辈（02 §一：隔代 → 祖辈 2）
      if (s === "隔代") {
        const g = typeof rule.grandparents === "number" ? [rule.grandparents, rule.grandparents] : rule.grandparents;
        if (g[0] !== 2 || g[1] !== 2) fail("F.STRUCT", `structures.隔代.grandparents 必为 2（v5/02 §一）：${JSON.stringify(rule.grandparents)}`);
      }
      // 独生必 0 同辈
      if (s === "独生" && sib && (sib[0] !== 0 || sib[1] !== 0)) fail("F.STRUCT", `structures.独生.siblings 必为 0`);
      // 单亲父母恰 1
      if (s === "单亲") {
        const p = typeof rule.parents === "number" ? [rule.parents, rule.parents] : rule.parents;
        if (p[0] !== 1 || p[1] !== 1) fail("F.STRUCT", `structures.单亲.parents 必为 1`);
      }
    }
    // 结构↔槽组合可满足性：按区间能取到的槽位并集必须都在封闭枚举内（无幽灵槽）
    const slotNames = new Set(Object.keys(slotTable ?? {}));
    const usedPrefix = { parent: "parent-", grandparent: "gp-", sibling: "sib-" };
    for (const [g, prefix] of Object.entries(usedPrefix)) {
      const list = [...slotNames].filter((n) => n.startsWith(prefix));
      if (list.length === 0) fail("F.STRUCT", `槽组「${g}」在 slots 里无任何槽位（前缀 ${prefix}）`);
    }
  }
  // groups：npcs.json 注册 id → 槽组，键必须在注册表且分组与槽组前缀一致
  if (!groups || typeof groups !== "object" || Array.isArray(groups)) {
    fail("F.SCHEMA", "family-slots.json 缺 groups 表（npcs.json 注册 id 分组）");
  } else {
    const expect = { mother: "parent", father: "parent", grandma: "grandparent", grandpa: "grandparent" };
    for (const [id, group] of Object.entries(groups)) {
      if (!npcIds.has(id)) fail("F.GROUP", `groups 键「${id}」未在 npcs.json 注册`);
      if (!["parent", "grandparent", "sibling"].includes(group)) fail("F.GROUP", `groups.${id} 分组非法：${JSON.stringify(group)}`);
      if (expect[id] && expect[id] !== group) fail("F.GROUP", `groups.${id} 应为 ${expect[id]}，实为 ${group}`);
    }
    for (const id of ["mother", "father", "grandma", "grandpa", "sibling-1", "sibling-2", "sibling-3"]) {
      if (!(id in groups)) fail("F.GROUP", `groups 缺家庭注册 id「${id}」`);
    }
  }
  // grandparentSide：南北两侧闭合
  const side = familySlots.grandparentSide;
  if (!side || typeof side !== "object" || Array.isArray(side)) {
    fail("F.SCHEMA", "family-slots.json 缺 grandparentSide（南北→祖辈侧系派生）");
  } else {
    for (const region of ["南方", "北方"]) {
      if (!["paternal", "maternal"].includes(side[region])) fail("F.SIDE", `grandparentSide.${region} 应为 paternal|maternal：${JSON.stringify(side[region])}`);
    }
    for (const sideName of ["paternal", "maternal"]) {
      if (!Object.values(side).includes(sideName)) fail("F.SIDE", `grandparentSide 未使用侧系「${sideName}」（该侧槽位永不可达）`);
    }
  }
  familyStats = {
    slots: Object.keys(slotTable ?? {}).length,
    structures: Object.keys(structures ?? {}).length,
    groups: Object.keys(groups ?? {}).length,
  };
} else {
  fail("F.SCHEMA", "family-slots.json 应为对象（slots/structures/groups/grandparentSide，v5/02 §一）");
}

// birth-map v4 四组：枚举齐 + 八因素全组合初始四维落域 [0,100]（超集检查，含手选派生不可达组合）
let v4Combos = 0;
if (birthMap && typeof birthMap === "object" && !Array.isArray(birthMap)) {
  let v4SchemaOk = true;
  for (const [el, values] of Object.entries(V4_ENUMS)) {
    const group = birthMap[el];
    if (!group || typeof group !== "object" || Array.isArray(group)) {
      fail("R.BIRTH", `birth-map 缺 v4 组「${el}」`);
      v4SchemaOk = false;
      continue;
    }
    for (const key of Object.keys(group)) {
      if (!values.includes(key)) fail("R.BIRTH", `birth-map ${el} 含未枚举值「${key}」`);
    }
    for (const key of values) {
      const row = group[key];
      if (!row || typeof row !== "object" || Array.isArray(row)) {
        fail("R.BIRTH", `birth-map ${el}.${key} 缺修正量行`);
        v4SchemaOk = false;
        continue;
      }
      for (const k of Object.keys(row)) {
        if (!DIMS.includes(k)) fail("R.BIRTH", `birth-map ${el}.${key} 维度非法：${k}`);
      }
      for (const d of DIMS) {
        if (!Number.isInteger(row[d])) fail("R.BIRTH", `birth-map ${el}.${key}.${d} 非整数：${JSON.stringify(row[d])}`);
      }
    }
  }
  if (v4SchemaOk) {
    let bad = 0;
    for (const era of BIRTH_ENUMS.era) {
      for (const place of BIRTH_ENUMS.place) {
        for (const mood of BIRTH_ENUMS.mood) {
          for (const style of BIRTH_ENUMS.style) {
            for (const region of V4_ENUMS.region) {
              for (const structure of V4_ENUMS.structure) {
                for (const job of V4_ENUMS.parentsJob) {
                  for (const wealth of V4_ENUMS.wealth) {
                    v4Combos++;
                    const rows = [
                      birthMap.era[era],
                      birthMap.place[place],
                      birthMap.mood[mood],
                      birthMap.style[style],
                      birthMap.region[region],
                      birthMap.structure[structure],
                      birthMap.parentsJob[job],
                      birthMap.wealth[wealth],
                    ];
                    for (const d of DIMS) {
                      const init = BIRTH_BASE + rows.reduce((acc, r) => acc + (typeof r[d] === "number" ? r[d] : 0), 0);
                      if (init < 0 || init > 100) {
                        bad++;
                        if (bad <= 5) fail("R.BIRTH", `八因素组合 ${era}/${place}/${mood}/${style}/${region}/${structure}/${job}/${wealth} 的 ${d} 初始值 ${init} 出域`);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    if (bad > 5) fail("R.BIRTH", `……另有 ${bad - 5} 处出域未逐条列出`);
    if (v4Combos !== V4_BIRTH_COMBOS) fail("R.BIRTH", `八因素组合数 ${v4Combos} ≠ ${V4_BIRTH_COMBOS}`);
  }
}

// ── 输出 ──
const out = (s) => process.stdout.write(s + "\n");
out("数据校验门 · 依据 plan/02（单一定义源）+ plan/v3/02 ▸ M1'' 增补");
out("=".repeat(56));

const areaOk = (p) => !fails.some((f) => f.startsWith(`[${p}`));
const lines = [
  ["FILE", "数据文件 10 份可读且 JSON 合法"],
  ["E", `事件库 ${eventCount} 条：id 唯一 / 枚举合法 / 选项 ${OPT_COUNT[0]}–${OPT_COUNT[1]} / 三观增量口径 / 资源口径 / pre 防死锁 / 月龄单调 / 骨架密度 ≥${SKELETON_MIN_PER_STAGE} / 文案去重 / 偶遇层 ${encounterTotal} 条（每阶段 ≥${ENC_PER_STAGE_MIN}，v5/02 §二）`],
  ["N", `NPC 关系层（v3/02 §五 ▸ M3'' 增补）：npcs.json 注册 schema + 父母在册 + bondDeltas 键/口径（|Δ| ≤15）`],
  ["L", `多线：line 枚举 / main=fate / rescue 每资源 2 条 / 支线密度 ${LINE_DENSITY_ON.join("+")} 每阶段 ≥${LINE_DENSITY_MIN}（分批口径，love/friend/health 随 M2''/M3'' 开启）`],
  ["B", `birth-map ${birthStats ? `${birthStats.combos}/${BIRTH_COMBOS}` : "—"} 组合覆盖 + 初始值全部落域 [0,100]`],
  ["X", `endings ${endingSummary ? `${endingSummary.conditioned} 条件 + ${endingSummary.fallbackCount} 兜底` : "—"}：schema / 末位兜底 / flag 引用闭合`],
  ["P", `portraits ${portraitFilled}/${PORTRAIT_TYPES.length} 型封闭枚举${WANT_FULL ? " + 80–150 字" : ""}`],
  ["M", `fish-mood-map ${moodStats ? `覆盖 ${moodStats.covered}/${moodStats.total} 帧 + 终局锁 ${moodStats.locked} 张` : "—"}：19/19 全覆盖 / 类别枚举 / 终局不重复（v2/02 §二）`],
  ["V", `三观层：stage-drift ${driftOk}/24 格（8 阶段×3 轴，|值|≤2）+ monologues ${monoOk}/9 条（3 轴×3 区间）`],
  ["I", `图标对照（v3/02 §九 + v4/02 §六 objectKey）：${iconStats ? `覆盖 ${iconStats.covered}/${iconStats.total} 条事件 + SVG 实物 ${iconStats.disk} 枚（Game-Icons CC-BY）+ 豁免 ${iconStats.exempt} 条（≤${iconStats.exemptMax}）` : "未完成校验"}`],
  ["R", `v4 历法/画像/家庭（v4/02 ▸ M1'''）：era ${eraStats ? `${eraStats.count}/76 主锚逐年无缺（国际 ${eraStats.intl}/≤${ERA_INTL_MAX}；✅${eraStats.verified}/典型 ${eraStats.typical}）+ 查证表对账` : "—"}；names 池 ${namesStats ? `姓 ${namesStats.surnames} + 名 ${namesStats.given}` : "—"}；家庭注册槽 5；birth-map 八因素 ${v4Combos}/${V4_BIRTH_COMBOS} 组合落域`],
  ["F", `家庭槽位（v5/02 §一）：${familyStats ? `槽位 ${familyStats.slots} 枚（role 逐位、无泛称）+ 结构 ${familyStats.structures} 种（↔槽区间合法）+ 注册组 ${familyStats.groups} 项 + 南北侧系闭合` : "未完成校验"}`],
  ["C", `轻量线索（v5/02 §十 D10）：${clueStats ? `${clueStats.total} 条（${clueStats.stages} 阶段各 ≤1）+ 解读 flag ${clueStats.flags} 个 + 锚/解锁事件闭合 + 文案长度` : "未完成校验"}`],
  ["S", `语义配图（v5/02 §九 D9）：${sceneStats ? `标签 ${sceneStats.tags} 类 / 场景图 ${sceneStats.files} 张（实物在位、无孤儿）+ 覆盖 ${sceneStats.covered}/${sceneStats.total} = ${(sceneStats.ratio * 100).toFixed(1)}%（≥60%）+ 豁免 ${sceneStats.exempt} 条` : "未完成校验"}`],
];
for (const [p, label] of lines) out(`${areaOk(p) ? "PASS" : "FAIL"}  ${label}`);
for (const f of fails) out(`FAIL  ${f}`);

if (WANT_COUNT) {
  out("=".repeat(56));
  out("== 分母汇总（供 README / plan/00 台账数字对账，plan/02 §二第 6 项）==");
  out(`事件总数: ${eventCount}`);
  for (const s of STAGES) {
    const c = perStage.get(s);
    const l = perStageLine.get(s);
    out(`  ${s.padEnd(10)} ${STAGE_LABEL[s]}: fate ${c.main}m/${c.context}c/${c.critical}x + 支线 study ${l.study} / career ${l.career} / rescue ${c.rescue}（计 ${c.main + c.context + c.critical + c.rescue + l.study + l.career + l.love + l.friend + l.health}）`);
  }
  out(`结局: 条件结局 ${endingSummary?.conditioned ?? "—"} + 兜底 ${endingSummary?.fallbackCount ?? "—"}（口径 ≥${ENDING_MIN_CONDITIONED} + 1）`);
  out(`画像: ${portraitFilled}/${PORTRAIT_TYPES.length} 型在位`);
  if (eraStats) {
    out(`era 主锚: ${eraStats.count}（✅已核对 ${eraStats.verified} / 典型值 ${eraStats.typical} / 国际 ${eraStats.intl}）`);
  }
  if (namesStats) {
    out(`names 池: 姓 ${namesStats.surnames} + 南北名 ${namesStats.given}（02 §三 ▸ M1'''）`);
  }
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
