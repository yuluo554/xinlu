#!/usr/bin/env node
// ═══ 结局可达性扫描门（v2-M1' 1.3 · B1 起建；v3-M1'' 升级扫描空间）═══
// 口径沿 plan/v2/02 §五：引擎级策略空间枚举，目标 = 8 条件结局 + 兜底全可达。
// v3-M1'' 升级（02 ▸ M1'' 增补）：传导链改为「选项→三观→四维派生」后，四维被三观耦合
// （outlook 同驱 ei/jp），v2 的四维角点权重无法表达真实策略空间——扫描改在**三观轴空间**
// 打分：26 组非零轴权重 (±1/0)³ × 96 出生环境 = 2496 组，每组用真实引擎全程模拟一局。
// 目标不变：9 结局全可达（任意出生环境都能活成任何一种结局——v3 判定层的可达性承诺）。
// 本脚本只"查"可达性、不复写口径；改口径必须先改 plan 文档再同步这里。
//
// 用法：node scripts/check-ending-reachability.mjs [--without-guard-events]
//   --without-guard-events  把防回退事件（V3_GUARD_EVENT_IDS）从事件库剔除后再扫——
//                           防回退自检路径：删掉承重事件扫描必须报 1（v2/02 §五口径的 v3 延续）。
// 退出码：0 全可达 / 1 存在不可达 / 2 用法错误。
// 也可被测试进程内调用：runScan() 返回结构化结果（vitest 模块隔离下
// registerB1ExcludeHooks() 须在引擎首载前调用，见 tests/reachability-*.test.ts）。

import { registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const importLocal = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href);

// v3-M1'' 防回退清单：wanderlust flag 的唯一来源事件。v2 的 B1 清单（9 条 T/P 侧事件）
// 在 v3 事件池扩容（175 条 × ≥3 选项）后不再是承重墙（剔除后仍全可达，2026-10-24 实测），
// 防回退锚点换成 v3 的真实单点：剔除 teen-003 → end-03 必须回归不可达。
// 防回退测试守护：清单 id 必须真实存在（漂移会让剔除空转、防回退变绿）。
export const V3_GUARD_EVENT_IDS = ["teen-003"];

let guardHooksRegistered = false;

/** 注册剔除防回退事件的模块加载钩子。必须在引擎/事件库首载之前调用（进程内只生效一次）。 */
export function registerGuardExcludeHooks() {
  if (guardHooksRegistered) return;
  registerHooks({
    load(url, context, nextLoad) {
      if (url === pathToFileURL(resolve(ROOT, "src/data/events.json")).href) {
        const all = JSON.parse(readFileSync(fileURLToPath(url), "utf8"));
        const kept = all.filter((e) => !V3_GUARD_EVENT_IDS.includes(e.id));
        return { format: "json", source: JSON.stringify(kept), shortCircuit: true };
      }
      return nextLoad(url, context);
    },
  });
  guardHooksRegistered = true;
}

// ── 扫描口径常量（v3-M1''：轴空间 26 组非零权重 × 96 环境 = 2496 组）──
const SCAN_SEED = 1; // 固定种子：context 抽取流确定，同输入恒同输出
const SCAN_ENVS = [];
for (const era of ["60s", "90s", "10s"]) {
  for (const place of ["大城", "小城", "县镇", "农村"]) {
    for (const mood of ["和睦", "紧张", "疏离", "单亲"]) {
      for (const style of ["权威", "忽视"]) {
        SCAN_ENVS.push({ era, place, mood, style });
      }
    }
  }
}
const VALUES_AXES = ["worldview", "outlook", "values"];
const WEIGHT_SETS = []; // (±1/0)³ 去零向量 = 26 组
for (const w of [-1, 0, 1]) for (const o of [-1, 0, 1]) for (const v of [-1, 0, 1]) {
  if (w === 0 && o === 0 && v === 0) continue;
  WEIGHT_SETS.push({ worldview: w, outlook: o, values: v });
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

  /** 单局线性策略模拟：返回终局结局 id。v3：按选项的三观增量在轴空间打分；锁定选项不入候选。 */
  function playOne(env, weights) {
    let state = createRun(env, SCAN_SEED);
    for (let steps = 0; steps < 2000; steps++) {
      const event = pickEvent(state);
      if (!event) {
        if (state.stageIndex >= STAGES.length) break;
        state = advanceStage(state);
        continue;
      }
      let best = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < event.options.length; i++) {
        const req = event.options[i]?.requires;
        if (req && !Object.entries(req).every(([k, v]) => state.resources[k] >= v)) continue;
        const d3 = event.options[i]?.deltas3 ?? {};
        const score = VALUES_AXES.reduce((acc, k) => acc + weights[k] * (d3[k] ?? 0), 0);
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      }
      // 全部选项被锁（理论不可达：requires 只挂支线后置选项）则兜底取首项，让引擎报错暴露
      state = applyChoice(state, best === -1 ? 0 : best);
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
  out("结局可达性扫描门 · v2/02 §五口径 + v3 轴空间升级（2496 组 = 96 环境 × 26 轴权重）");
  out("=".repeat(64));
  for (const [id, where] of hits.entries()) {
    out(`${where.length > 0 ? "PASS" : "FAIL"}  ${id.padEnd(13)} ${where.length}/2496 组命中（首见 ${where[0] ?? "—"}）`);
  }
  out("=".repeat(64));
  out(
    `结论: ${
      unreachable.length === 0
        ? "9 结局全可达（8 条件 + 兜底）"
        : `${unreachable.length} 个结局不可达：${unreachable.join(", ")}`
    }${mode === "without-guard" ? "（剔除防回退承重事件模式，预期报不可达）" : ""}`
  );
}

// ── CLI 入口（测试进程内请直接调 runScan / registerGuardExcludeHooks）──
const isCli =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
  const ARGS = process.argv.slice(2);
  const WITHOUT_GUARD = ARGS.includes("--without-guard-events");
  if (ARGS.some((a) => a !== "--without-guard-events")) {
    process.stderr.write(
      "check-ending-reachability: 用法 node scripts/check-ending-reachability.mjs [--without-guard-events]\n"
    );
    process.exit(2);
  }
  if (WITHOUT_GUARD) registerGuardExcludeHooks();
  const { hits, unreachable } = await runScan();
  printReport(hits, unreachable, WITHOUT_GUARD ? "without-guard" : "full");
  process.exitCode = unreachable.length === 0 ? 0 : 1;
}
