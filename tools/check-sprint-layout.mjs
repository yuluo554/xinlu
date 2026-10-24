#!/usr/bin/env node
// ═══ 布局门（方法论装订第②件，改自 ai-tool-project-sprint references/templates/check-sprint-layout.mjs） ═══
// 把"项目还长在方法论上"变成可跑红的断言。判据一律落**仓库内文件**（不读 git 元数据——
// 浅克隆下 git tag / 历史深度会翻转）。退出码：0 全绿 / 1 有 FAIL / 2 用法错误。
// 纪律：一条门里有几个 add() 判据，变异清单就要覆盖几个（每棒验红记录落当轮 HANDOFF）。

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const checks = [];
const add = (id, ok, detail) => checks.push({ id, ok, detail });
const read = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), "utf8") : null);

const scanned = { docs: 0, handoffs: 0, copies: 0, docTools: 0 };

const REQUIRED_FILES = [
  "AGENTS.md",
  "README.md",
  "LICENSE",
  "data/README.md",
  "plan/00-README总览.md",
  "plan/01-题目文档.md",
  "plan/02-数据与口径.md",
  "plan/03-模块清单与验收.md",
  "plan/04-里程碑任务分解.md",
  "plan/05-发布留档.md",
  "plan/06-运维节奏.md",
  "plan/backlog.md",
  // v2.0 执行计划套件（装订见 plan/00 文档索引 v2 行；与 v1 套件并存、状态各自维护）
  "plan/v2/00-README总览.md",
  "plan/v2/01-题目文档.md",
  "plan/v2/02-数据与口径.md",
  "plan/v2/03-模块清单与验收.md",
  "plan/v2/04-里程碑任务分解.md",
  "plan/v2/05-发布留档.md",
  "plan/v2/06-运维节奏.md",
  "plan/v2/backlog.md",
];

/**
 * 装订行判据：三个锚点**同现于一行**（前瞻、顺序无关——写死顺序会把合法写法判成缺）。
 * 只扫 plan/00 顶部 12 行（skill 硬约束③要求"顶部一行"，不是"文件里任意一行"）。
 */
const BINDING_LINE = /^>(?=.*ai-tool-project-sprint)(?=.*check-sprint-layout)(?=.*20\d{2}-\d{2}-\d{2}).*$/m;

const REQUIRED_SECTIONS = {
  "plan/00-README总览.md": ["文档索引", "决策记录", "承诺-证据台账", "里程碑总表"],
  "plan/01-题目文档.md": ["任务要求", "验收标准", "边界与非目标"],
  "plan/02-数据与口径.md": ["四维倾向值口径", "事件库 schema", "事件密度口径", "存档 schema"],
  "plan/03-模块清单与验收.md": ["演化引擎", "存档", "可视化"],
  "plan/04-里程碑任务分解.md": ["里程碑任务分解", "风险与恢复"],
  "plan/05-发布留档.md": ["发布概要", "tag 时点事实", "tag 后追加事实"],
  "plan/06-运维节奏.md": ["八类缺口", "归档判据"],
  "plan/backlog.md": ["队列"],
  "data/README.md": ["口径来源", "依据查证"],
  // v2 套件：小节关键词取自各档实有标题（02/03 用 v2 自己的口径名，不复用 v1 关键词）
  "plan/v2/00-README总览.md": ["文档索引", "决策记录", "承诺-证据台账", "里程碑总表"],
  "plan/v2/01-题目文档.md": ["任务要求", "验收标准", "边界与非目标"],
  "plan/v2/02-数据与口径.md": ["表情映射口径", "图鉴存储口径", "分享卡规格口径", "素材许可白名单", "体积预算口径"],
  "plan/v2/03-模块清单与验收.md": ["回归基线", "模块依赖图"],
  "plan/v2/04-里程碑任务分解.md": ["里程碑任务分解", "风险与恢复"],
  "plan/v2/05-发布留档.md": ["发布概要", "tag 时点事实", "tag 后追加事实"],
  "plan/v2/06-运维节奏.md": ["运维节奏"],
  "plan/v2/backlog.md": ["队列"],
};

// HANDOFF 七节（与 skill 硬约束①一致）。断言"必需节都存在"，不断言"节数恰好等于 7"
//（项目自定更细的格式是合法超集）。
const HANDOFF_SECTIONS = ["当前进度", "当前事实", "待办", "既定口径", "环境坑", "DoD", "命令速查"];

/** 项目**已声明**的豁免与冻结规则——装订门必须复用它，别另立更严的一套。
 *  M0 豁免交接单：M0 之前没有上一棒可写 HANDOFF-M0，M0 的收尾动作是写 HANDOFF-M1
 *  （声明见 AGENTS.md；改豁免与改声明要同提交）。 */
const EXEMPT_MILESTONES = ["M0"];
/** 末棒要不要交接单：false = 要（写"收官交接单"）。 */
const HANDOFF_EXEMPT_LAST = false;

/** 里程碑 ID 统一为字符串键：v1 = "M0"–"M6"；v2 = "v2-M1'"–"v2-M4'"（撇号是文档口径的一部分，
 *  交接单文件名不带撇号）。排序/判空全走 milestoneRank，别再对键做数字减法。 */
const milestoneRank = (k) => (k.startsWith("v2-") ? 1000 : 0) + Number(k.replace(/^v2-/, "").replace(/\D/g, ""));

/** 状态副本：同一里程碑在这几处的状态必须**互相一致**（逐副本独立采集，真值不取自单一副本）。 */
const STATUS_COPIES = [
  { file: "plan/00-README总览.md", kind: "里程碑总表" },
  { file: "README.md", kind: "状态表" },
];

/** 只认"状态行"：表格行且首格是里程碑号（v1 = M<k>，可加粗；v2 = v2-M<k>'，不加粗）。
 *  不扫自由文本——散文里的 M0–M6 / v2-M1' 不参与判定。 */
const STATUS_LINE = /^\|\s*(?:\*{0,2}M(\d+)\b|v2-M(\d+)')/;
/** 状态格必须以状态符开头才计入（防"DoD 长文被当成状态格"的假读）；🔒 视为已完成冻结态。 */
const STATUS_DONE = /^[|*\s]*(✅|🔒)/;
const STATUS_PENDING = /^[|*\s]*(⬜|🟡)/;

function checkRequiredFiles() {
  const missing = REQUIRED_FILES.filter((rel) => !existsSync(join(ROOT, rel)));
  scanned.docs = REQUIRED_FILES.length - missing.length;
  add("LAYOUT.FILES", missing.length === 0, missing.length ? `缺: ${missing.join(",")}` : `${scanned.docs} 份齐备`);
}

function checkBindingHead() {
  const head = (read("plan/00-README总览.md") ?? "").split("\n").slice(0, 12).join("\n");
  add("LAYOUT.BINDING_HEAD", BINDING_LINE.test(head), BINDING_LINE.test(head) ? "plan/00 顶部有装订行（三锚点齐）" : "plan/00 顶部 12 行内缺装订行（需同现：方法论名 + 布局门命令 + 装订日期）");
}

function checkSections() {
  const bad = [];
  for (const [rel, needles] of Object.entries(REQUIRED_SECTIONS)) {
    const text = read(rel);
    if (text === null) continue;
    const missing = needles.filter((n) => !text.includes(n));
    if (missing.length) bad.push(`${rel}: ${missing.join("/")}`);
  }
  add("LAYOUT.SECTIONS", bad.length === 0, bad.length ? bad.join("；") : `${Object.keys(REQUIRED_SECTIONS).length} 份小节齐备`);
}

/**
 * 逐副本采集状态：Map<k, Set<"done"|"pending">>。真值不取自任何一个副本——
 * 任一里程碑出现两种状态即 FAIL。每份副本单独记命中行数并打进结论（0 行必须可见，
 * 合计 0 行 = 判据空跑 = FAIL）。
 */
function collectStates() {
  const states = new Map();
  const rowsByCopy = new Map();
  const note = (k, state) => {
    if (!states.has(k)) states.set(k, new Set());
    states.get(k).add(state);
  };
  for (const copy of STATUS_COPIES) {
    const text = read(copy.file);
    if (text === null) continue;
    scanned.copies += 1;
    let rows = 0;
    for (const line of text.split("\n")) {
      const m = STATUS_LINE.exec(line);
      if (!m) continue;
      const cells = line.split("|");
      const statusCell = (cells[cells.length - 2] ?? "").trim();
      const done = STATUS_DONE.test(statusCell);
      const pending = STATUS_PENDING.test(statusCell);
      if (!done && !pending) continue; // 状态格不是状态符开头 → 不是机读状态行
      rows += 1;
      const key = m[2] !== undefined ? `v2-M${m[2]}'` : `M${m[1]}`;
      note(key, pending ? "pending" : "done");
    }
    rowsByCopy.set(copy.file, rows);
  }
  return { states, rowsByCopy };
}

function checkStatusAgreement({ states, rowsByCopy }) {
  const conflicts = [];
  for (const [k, set] of [...states.entries()].sort((a, b) => milestoneRank(a[0]) - milestoneRank(b[0]))) {
    if (set.size > 1) conflicts.push(`${k} 在副本间状态不一致（${[...set].join(" vs ")}）`);
  }
  const total = [...rowsByCopy.values()].reduce((a, b) => a + b, 0);
  const perCopy = [...rowsByCopy.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([file, rows]) => `${file.split("/").pop()}:${rows}`)
    .join(" ");
  if (conflicts.length === 0 && total === 0) {
    add("LAYOUT.STATUS", false, `所有副本合计 0 行状态行（判据空跑）：${perCopy}`);
    return;
  }
  add(
    "LAYOUT.STATUS",
    conflicts.length === 0,
    conflicts.length ? conflicts.join("；") : `${scanned.copies} 处副本 × ${states.size} 个里程碑 状态全一致（行数 ${perCopy}）`,
  );
}

/** 交接单判据：每个 ✅ 里程碑一份 HANDOFF（M0 豁免；末棒开关见 AGENTS.md）。
 *  v1 落 plan/HANDOFF-M<k>.md；v2 腿落 plan/v2/HANDOFF-v2-M<k>.md（文件名不带撇号）。 */
function checkHandoffs(done, allMilestones) {
  const lastV1 = allMilestones
    .filter((k) => !k.startsWith("v2-"))
    .sort((a, b) => milestoneRank(a) - milestoneRank(b))
    .pop();
  const missing = [];
  for (const k of done) {
    if (EXEMPT_MILESTONES.includes(k)) continue;
    const isV2 = k.startsWith("v2-");
    if (HANDOFF_EXEMPT_LAST && !isV2 && k === lastV1) continue;
    const rel = isV2 ? `plan/v2/HANDOFF-v2-M${k.match(/v2-M(\d+)'$/)[1]}.md` : `plan/HANDOFF-${k}.md`;
    const text = read(rel);
    if (text === null) {
      missing.push(`${rel}(缺${!isV2 && k === lastV1 && !HANDOFF_EXEMPT_LAST ? "：末棒要写收官交接单" : ""})`);
      continue;
    }
    scanned.handoffs += 1;
    const lack = HANDOFF_SECTIONS.filter((n) => !text.includes(n));
    if (lack.length) missing.push(`${rel}(缺节: ${lack.join("/")})`);
  }
  add("LAYOUT.HANDOFFS", missing.length === 0, missing.length ? missing.join("；") : `${scanned.handoffs} 份交接单齐（M0 已声明豁免）`);
}

/**
 * backlog 队列表是状态的隐蔽副本（本项目的"缺口列"）。v1 与 v2 两份 backlog 都扫。
 * 判据收窄：某行状态格挂 ⬜/🟡 **且**行内以"待 M<k>"/"待 v2-M<k>'"指名一个已 ✅ 的里程碑 → 该行已过期。
 * 匹配前剥掉行内代码与文件名（`plan/RELEASE-M6.md` 是文件引用不是状态引用）。
 * 扫描面 = 队列表头 → 首条非表格行即止；行数必须打印（0 行要可区分于"没扫到"）。
 */
function checkStaleQueue(done) {
  const stale = [];
  let scannedRows = 0;
  for (const backlogFile of ["plan/backlog.md", "plan/v2/backlog.md"]) {
    const lines = (read(backlogFile) ?? "").split("\n");
    const headerIdx = lines.findIndex((l) => l.startsWith("|") && l.includes("ID") && l.includes("状态"));
    if (headerIdx < 0) {
      add("LAYOUT.QUEUE", false, `${backlogFile} 找不到队列表头（含 ID 与状态列；表搬走了？）`);
      return;
    }
    let rowsInFile = 0;
    for (let i = headerIdx + 2; i < lines.length; i++) {
      if (!lines[i].startsWith("|")) break; // 表结束（不是"本行跳过"）
      if (/^\|[\s|:-]+\|$/.test(lines[i])) continue; // 分隔行
      scannedRows++;
      rowsInFile++;
      const cells = lines[i].split("|").map((c) => c.trim());
      const status = cells[cells.length - 2] ?? "";
      if (!STATUS_PENDING.test(`| ${status}`)) continue;
      // 先剥"证据在哪份文件"，剩下的才是状态引用
      const row = lines[i].replace(/`[^`]*`/g, " ").replace(/[\w./-]+\.(?:md|mjs|js|json|ts)/g, " ");
      for (const k of done) {
        if (new RegExp(`待\\s*${k}([^0-9]|$)`).test(row)) {
          stale.push(`${backlogFile} 第 ${rowsInFile} 行仍"待 ${k}"而该里程碑已 ✅`);
        }
      }
    }
  }
  add(
    "LAYOUT.QUEUE",
    stale.length === 0,
    stale.length ? stale.join("；") : `backlog 队列（v1+v2）扫了 ${scannedRows} 行，无过期"待 M<k>"`,
  );
}

/**
 * 承诺-证据台账是状态副本（它不含"里程碑"表头，STATUS_COPIES 扫不到，单独一条判据）。
 * v1（plan/00）与 v2（plan/v2/00）两份台账都扫。
 * 判据收窄：状态格同时含未完成标记与已 ✅ 里程碑号 → FAIL。
 * 键匹配双护：键前不许是字母数字/连字符/撇号（防 "v2-M1'" 误命中已 ✅ 的 "M1"）、键后不许紧跟撇号。
 */
function checkLedger(done) {
  const bad = [];
  let rows = 0;
  for (const ledgerFile of ["plan/00-README总览.md", "plan/v2/00-README总览.md"]) {
    const text = read(ledgerFile) ?? "";
    const lines = text.split("\n");
    const headerIdx = lines.findIndex((l) => l.startsWith("|") && l.includes("承诺") && l.includes("状态"));
    if (headerIdx < 0) {
      add("LAYOUT.LEDGER", false, `${ledgerFile} 找不到『承诺-证据台账』表头（承诺项与状态列）`);
      return;
    }
    scanned.copies += 1; // 它是状态副本，要进"这轮扫到了几个"的计数
    for (let i = headerIdx + 2; i < lines.length; i++) {
      if (!lines[i].startsWith("|")) break;
      if (/^\|[\s|:-]+\|$/.test(lines[i])) continue;
      rows++;
      const cells = lines[i].split("|").map((c) => c.trim());
      const status = cells[cells.length - 2] ?? "";
      if (!/[⬜🟡]/.test(status)) continue;
      for (const k of done) {
        if (new RegExp(`(?<![0-9A-Za-z'-])${k}(?!')`).test(status)) {
          bad.push(`${ledgerFile} 台账行仍挂未完成: ${status.slice(0, 60)}`);
        }
      }
    }
  }
  add(
    "LAYOUT.LEDGER",
    bad.length === 0 && rows > 0,
    rows === 0 ? "台账表 0 行——判据空跑" : bad.length ? bad.join("；") : `台账（v1+v2）${rows} 行，已成 ✅ 的里程碑无未完成标记`,
  );
}

/**
 * 发布留档判据：只在发布里程碑（M6）翻 ✅ 后要求存在。本项目的发布留档 = plan/05-发布留档.md
 * （不是 RELEASE-M6.md）。要求：两栏齐（§三 tag 时点事实 / §四 tag 后追加事实）+ 覆盖对账小节
 * （阶段 7 出口门逐条：实现 / 不适用+理由 / 待首推）。未 ✅ 时报 PASS 并写明不适用。
 */
const RELEASE_MILESTONE = "M6";
const RELEASE_MILESTONE_V2 = "v2-M4'";

function checkReleaseDoc(done) {
  if (!done.includes(RELEASE_MILESTONE)) {
    add("LAYOUT.RELEASE", true, `发布里程碑 ${RELEASE_MILESTONE} 未完成，收尾记录判据尚不适用（已扫 ${done.length} 个 ✅ 里程碑）`);
    return;
  }
  const release = read("plan/05-发布留档.md");
  if (!release) {
    add("LAYOUT.RELEASE", false, "缺 plan/05-发布留档.md");
    return;
  }
  const cols = /^##\s*三、tag 时点事实/m.test(release) && /^##\s*四、tag 后追加事实/m.test(release);
  const heading = /^#{2,3}.*覆盖对账/m.test(release);
  const rows = (release.match(/^\|.*(实现|不适用|待首推).*\|$/gm) ?? []).length;
  const okV1 = cols && heading && rows >= 3;
  if (!done.includes(RELEASE_MILESTONE_V2)) {
    add("LAYOUT.RELEASE", okV1, `两栏:${cols} 覆盖对账小节:${heading} 三态行数:${rows}（${RELEASE_MILESTONE_V2} 未完成，v2 留档判据尚不适用）`);
    return;
  }
  // v2 发布留档按 plan/v2/05 约定并入 plan/05 新增 v2.0.0 节（单源不双写），故判据落 plan/05
  const v2Section = /^#{2,4}.*v2\.0\.0/m.test(release);
  add("LAYOUT.RELEASE", okV1 && v2Section, `两栏:${cols} 覆盖对账:${heading} 三态行:${rows}；v2.0.0 留档节:${v2Section}`);
}

/**
 * 文档点名的工具必须有实物（判据只认"路径形态"，扫 AGENTS.md 与 plan/*.md）。
 * 三个状态：在位 PASS / PENDING_TOOLS 登记"还没到该里程碑"（可见，不算 FAIL）/ 其余缺失 FAIL。
 * 登记项在所属里程碑翻 ✅ 后必须删除（与实现该脚本同提交），否则 stale 分支变红。
 */
function checkDocumentedToolsExist(doneMilestones) {
  const EXEMPT = new Set(); // 形如 "tools/xxx.mjs"：确实不打算实现时逐条登记理由
  // 文档已点名、但该里程碑尚未完成（K：里程碑翻 ✅ 落位脚本的同提交必须删除本行）
  // M1 已清空（scripts/validate-data.mjs 于 M1 落位并同提交删登记）。
  // 登记值 = 里程碑 ID（v1 "M<k>" / v2 "v2-M<k>'"）。v2 套件点名：可达性扫描（v2-M1'）、双门禁（v2-M3'）。
  const PENDING_TOOLS = {
    "scripts/check-ending-reachability.mjs": "v2-M1'",
    "tools/check-assets-license.mjs": "v2-M3'",
    "tools/check-dist-budget.mjs": "v2-M3'",
  };
  const docs = ["AGENTS.md", ...(existsSync(join(ROOT, "plan")) ? readdirSyncSafe() : [])];
  const referenced = new Set();
  for (const rel of docs) {
    const text = read(rel);
    if (text === null) continue;
    for (const m of text.matchAll(/(?:tools|scripts)\/[\w.-]+\.(?:mjs|js|cjs|py|sh|ps1)/g)) referenced.add(m[0]);
  }
  if (referenced.size === 0) {
    add("LAYOUT.DOC_TOOLS", false, `扫了 ${docs.length} 份文档，0 处 tools|scripts 引用——判据是空的（阳性对照失败）`);
    return;
  }
  scanned.docTools = referenced.size;
  const missing = [];
  const deferred = [];
  const stale = [];
  for (const rel of [...referenced].sort()) {
    if (existsSync(join(ROOT, rel)) || EXEMPT.has(rel)) continue;
    const milestone = PENDING_TOOLS[rel];
    if (milestone === undefined) missing.push(rel);
    else if (doneMilestones.includes(milestone)) stale.push(`${rel}（${milestone} 已 ✅，登记项必须清理）`);
    else deferred.push(`${rel}(${milestone})`);
  }
  const problems = [...missing, ...stale];
  let detail = `${referenced.size} 个文档点名的 tools|scripts 脚本`;
  if (problems.length) detail += `；问题: ${problems.join(",")}`;
  else if (deferred.length) detail += `；${deferred.length} 个待里程碑落位: ${deferred.join(",")}`;
  else detail += ` 全部在位`;
  add("LAYOUT.DOC_TOOLS", problems.length === 0, detail);
}

function readdirSyncSafe() {
  try {
    const rels = [];
    for (const dir of ["plan", "plan/v2"]) {
      const full = join(ROOT, dir);
      if (!existsSync(full)) continue;
      for (const f of readdirSync(full)) if (f.endsWith(".md")) rels.push(`${dir}/${f}`);
    }
    return rels;
  } catch {
    return [];
  }
}

function main() {
  for (const run of [checkRequiredFiles, checkBindingHead, checkSections]) {
    try {
      run();
    } catch (error) {
      add(run.name, false, error.message);
    }
  }
  const { states, rowsByCopy } = collectStates();
  const done = [...states.entries()].filter(([, set]) => set.has("done")).map(([k]) => k);
  const allMilestones = [...states.keys()];
  for (const run of [
    () => checkDocumentedToolsExist(done),
    () => checkStatusAgreement({ states, rowsByCopy }),
    () => checkHandoffs(done, allMilestones),
    () => checkStaleQueue(done),
    () => checkLedger(done),
    () => checkReleaseDoc(done),
  ]) {
    try {
      run();
    } catch (error) {
      add(run.name, false, error.message);
    }
  }

  const failed = checks.filter((c) => !c.ok);
  process.stdout.write("布局门（方法论装订） · 判据只落仓库内文件\n");
  process.stdout.write("=".repeat(56) + "\n");
  for (const c of checks) process.stdout.write(`${c.ok ? "PASS" : "FAIL"}  ${c.id}  ${c.detail}\n`);
  process.stdout.write("=".repeat(56) + "\n");
  process.stdout.write(`这轮扫到：文档 ${scanned.docs} / 交接单 ${scanned.handoffs} / 状态副本 ${scanned.copies} / 文档点名脚本 ${scanned.docTools}\n`);
  process.stdout.write(`结论: ${failed.length === 0 ? "全绿" : `${failed.length} 项 FAIL`}\n`);
  process.exitCode = failed.length === 0 ? 0 : 1;
}

/**
 * 为什么状态判据只扫"状态行"而不扫自由文本：plan/00 的散文里同时出现 M0–M6 与"⬜ 待 Mx"——
 * 扫自由文本会把它读成状态引用，是判据张冠李戴的典型假红。
 */
main();
