#!/usr/bin/env node
// ═══ 结局可达性扫描门（v2-M1' 1.3 · B1 修复）═══
// 依据 plan/v2/02-数据与口径.md §五实现其点名的扫描：引擎级策略空间枚举——
// 96 组 = 6 出生环境（docs/M4-dogfooding.md §一局表）× 16 四维线性权重组合（±1⁴），
// 每组用真实引擎（src/engine/engine.ts，node 原生执行）全程模拟一局：
// 逐事件按权重对选项打分（score = Σ w·Δ，并列取序号小者）→ applyChoice → 终局 resolveEnding。
// 目标 = 8 条件结局 + 兜底全可达（v1 口径：docs/M4-dogfooding.md §三 同一脚本口径的延续）。
// 本脚本只"查"可达性、不复写口径；改口径必须先改 plan/v2/02 再同步这里。
//
// 用法：node scripts/check-ending-reachability.mjs [--without-v2-b1-events]
//   --without-v2-b1-events  把 B1 补齐事件（V2_B1_EVENT_IDS）从事件库剔除后再扫——
//                           防回退自检路径：删掉补齐事件扫描必须报 1（v2/02 §五口径）。
// 退出码：0 全可达 / 1 存在不可达 / 2 用法错误。
// 也可被测试进程内调用：runScan() 返回结构化结果（vitest 模块隔离下
// registerB1ExcludeHooks() 须在引擎首载前调用，见 tests/reachability-*.test.ts）。

import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const importLocal = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href);

// B1 修复（v2-M1' 1.3）补齐的 T/P 侧语义事件清单：剔除模式的剔除对象。
// 防回退测试守护：清单 id 必须真实存在（漂移会让剔除空转、防回退变绿）。
export const V2_B1_EVENT_IDS = [
  "infant-019",
  "toddler-019",
  "childhood-019",
  "teen-019",
  "youth-019",
  "adult-019",
  "midlife-019",
  "elder-019",
  "elder-023",
];

let b1HooksRegistered = false;

/** 注册剔除 B1 补齐事件的模块加载钩子。必须在引擎/事件库首载之前调用（进程内只生效一次）。 */
export function registerB1ExcludeHooks() {
  if (b1HooksRegistered) return;
  registerHooks({
    load(url, context, nextLoad) {
      if (url === pathToFileURL(resolve(ROOT, "src/data/events.json")).href) {
        const all = JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
        const kept = all.filter((e) => !V2_B1_EVENT_IDS.includes(e.id));
        return { format: "json", source: JSON.stringify(kept), shortCircuit: true };
      }
      return nextLoad(url, context);
    },
  });
  b1HooksRegistered = true;
}

// ── 扫描口径常量（来源见文件头注释，只抄不改写）──
const SCAN_SEED = 1; // 固定种子：context 抽取流确定，同输入恒同输出
const SCAN_ENVS = [
  { era: "90s", place: "农村", mood: "和睦", style: "权威" },
  { era: "00s", place: "大城", mood: "单亲", style: "宽容" },
  { era: "80s", place: "小城", mood: "紧张", style: "忽视" },
  { era: "10s", place: "大城", mood: "疏离", style: "忽视" },
  { era: "10s", place: "农村", mood: "疏离", style: "忽视" },
  { era: "90s", place: "小城", mood: "和睦", style: "权威" },
];
const DIM_KEYS = ["ei", "sn", "tf", "jp"];
const WEIGHT_SETS = []; // ±1⁴ 全枚举 = 16 组
for (const ei of [-1, 1]) for (const sn of [-1, 1]) for (const tf of [-1, 1]) for (const jp of [-1, 1]) {
  WEIGHT_SETS.push({ ei, sn, tf, jp });
}

/**
 * 引擎级扫描：96 组全程模拟。返回各结局命中组与不可达清单。
 * 进程内多次调用共享引擎模块缓存——同一进程内不要混用两种模式（测试按文件隔离）。
 */
export async function runScan() {
  const { createRun, pickEvent, applyChoice, advanceStage, resolveEnding } = await importLocal(
    "src/engine/engine.ts"
  );
  const { STAGES } = await importLocal("src/engine/model.ts");

  /** 单局线性策略模拟：返回终局结局 id。 */
  function playOne(env, weights) {
    let state = createRun(env, SCAN_SEED);
    for (let steps = 0; steps < 1000; steps++) {
      const event = pickEvent(state);
      if (!event) {
        if (state.stageIndex >= STAGES.length) break;
        state = advanceStage(state);
        continue;
      }
      let best = 0;
      let bestScore = -Infinity;
      for (let i = 0; i < event.options.length; i++) {
        const d = event.options[i]?.deltas ?? {};
        const score = DIM_KEYS.reduce((acc, k) => acc + weights[k] * (d[k] ?? 0), 0);
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      }
      state = applyChoice(state, best);
    }
    return resolveEnding(state).id;
  }

  const endingIds = JSON.parse(readFileSync(resolve(ROOT, "src/data/endings.json"), "utf8")).map(
    (e) => e.id
  );
  const hits = new Map(endingIds.map((id) => [id, []]));
  for (let e = 0; e < SCAN_ENVS.length; e++) {
    for (let w = 0; w < WEIGHT_SETS.length; w++) {
      const id = playOne(SCAN_ENVS[e], WEIGHT_SETS[w]);
      if (!hits.has(id)) hits.set(id, []);
      hits.get(id).push(`环境${e + 1}/权重${w + 1}`);
    }
  }
  const unreachable = [...hits.entries()]
    .filter(([, where]) => where.length === 0)
    .map(([id]) => id);
  return { hits, unreachable };
}

function printReport(hits, unreachable, mode) {
  const out = (s) => process.stdout.write(s + "\n");
  out("结局可达性扫描门 · 依据 plan/v2/02 §五（引擎级，96 组 = 6 环境 × 16 权重）");
  out("=".repeat(64));
  for (const [id, where] of hits.entries()) {
    out(`${where.length > 0 ? "PASS" : "FAIL"}  ${id.padEnd(13)} ${where.length}/96 组命中（首见 ${where[0] ?? "—"}）`);
  }
  out("=".repeat(64));
  out(
    `结论: ${
      unreachable.length === 0
        ? "9 结局全可达（8 条件 + 兜底）"
        : `${unreachable.length} 个结局不可达：${unreachable.join(", ")}`
    }${mode === "without-b1" ? "（剔除 B1 补齐事件模式，预期报不可达）" : ""}`
  );
}

// ── CLI 入口（测试进程内请直接调 runScan / registerB1ExcludeHooks）──
const isCli =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  const ARGS = process.argv.slice(2);
  const WITHOUT_B1 = ARGS.includes("--without-v2-b1-events");
  if (ARGS.some((a) => a !== "--without-v2-b1-events")) {
    process.stderr.write(
      "check-ending-reachability: 用法 node scripts/check-ending-reachability.mjs [--without-v2-b1-events]\n"
    );
    process.exit(2);
  }
  if (WITHOUT_B1) registerB1ExcludeHooks();
  const { hits, unreachable } = await runScan();
  printReport(hits, unreachable, WITHOUT_B1 ? "without-b1" : "full");
  process.exitCode = unreachable.length === 0 ? 0 : 1;
}
