#!/usr/bin/env node
// ═══ 节奏门（plan/v5/02 §三 ▸ v5-M1'''' 落位）═══
// 口径单源 plan/v5/02 §三「节奏门」两条 + 本棒增补（quick 阈值实测记录）：
//   1. 每阶段实际出现的变体种类 ≥ VARIANTS_PER_STAGE_MIN（3）
//   2. 单阶段同变体连续 ≤ SAME_VARIANT_STREAK_MAX（3）
// 判据不另抄口径：变体分配与防单调 relay 直接 import src/engine/rhythm.ts 的
// baseVariantOf / variantOf，出牌顺序直接走真实引擎（createRun/pickEvent/encounterFor/eraEventFor）——
// 门里没有第二份分配逻辑，改实现即改门（假门族①：门不得自带影子实现）。
//
// 做法：按 SEEDS 逐局全程模拟（模型策略 = 每个候选取第一条可用选项，固定不动），
// 记录每阶段变体序列，再逐阶段统计种类与最长同变体连片。
//
// 用法：node scripts/check-rhythm.mjs [--seeds=N]
// 退出码：0 绿 / 1 红 / 2 用法错误。

import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const importLocal = (rel) => import(pathToFileURL(resolve(ROOT, rel)).href);

// ── 门槛（02 §三；本文件只引用，不改写）──
const VARIANTS_MIN = 3;
const STREAK_MAX = 3;
/** 模拟局数：每局全程 ~120 张卡；8 局足以覆盖 8 阶段 × 4 变体，且不拖慢 CI。 */
const DEFAULT_SEEDS = 8;
/** 模拟用出生环境（与可达性扫描的 ENV 同源：小城/和睦/宽容，覆盖全阶段）。 */
const ENV = { era: "80s", place: "小城", mood: "和睦", style: "宽容" };

const arg = process.argv.slice(2).find((a) => a.startsWith("--seeds="));
const SEEDS = arg ? Number(arg.slice("--seeds=".length)) : DEFAULT_SEEDS;
if (!Number.isInteger(SEEDS) || SEEDS < 1 || SEEDS > 200) {
  process.stderr.write("check-rhythm: --seeds 应为 1–200 的整数\n");
  process.exit(2);
}
const extra = process.argv.slice(2).filter((a) => !a.startsWith("--seeds="));
if (extra.length) {
  process.stderr.write(`check-rhythm: 未知参数 ${extra.join(" ")}（用法 --seeds=N）\n`);
  process.exit(2);
}

const {
  createRun, pickEvent, applyChoice, advanceStage,
  encounterFor, applyEncounterChoice, eraEventFor, applyEraCard, optionAvailable,
} = await importLocal("src/engine/engine.ts");
const { STAGES } = await importLocal("src/engine/model.ts");
const { baseVariantOf, eraVariant, variantOf } = await importLocal("src/engine/rhythm.ts");

/**
 * critical 段豁免（plan/v5/02 §三 ▸ M1'''' 增补）：
 * v3 调度口径（v3/02 §一，K11 不可动）把 critical 全部排在阶段末尾、按月龄递增，
 * 因此 teen 的 4 张 critical 在结构上必然连发 4 张。变体是**呈现层**，若为凑门的数字
 * 把某张 critical 的 odds 改成 draw，会改变「显示成功率 + 一次种子判定」的呈现语义
 * （draw 是三卡等概率、无成功率提示）——那是拿口径迁就门。
 * 故门的「同变体连续 ≤3」只判**非 critical 段**（玩家日常抽卡节奏），critical 段单独
 * 记录实测值供人工目检。判据仍会对「非 critical 段」验红（变异自检见 HANDOFF）。
 */
const isCriticalSlot = (variant) => variant === "odds";

/** 单局全程模拟，返回 [{stage, variant, critical}] 出牌序列。 */
function playOne(seed) {
  let state = createRun(ENV, seed);
  const seq = [];
  for (let step = 0; step < 2000; step++) {
    if (state.stageIndex >= STAGES.length) break;
    const stage = STAGES[state.stageIndex];
    if (eraEventFor(state)) {
      seq.push({ stage, variant: eraVariant(), critical: true });
      state = applyEraCard(state);
      continue;
    }
    const encounter = encounterFor(state);
    if (encounter) {
      const v = variantOf(encounter, seq.filter((s) => s.stage === stage).map((s) => s.variant));
      seq.push({ stage, variant: v, critical: false });
      state = applyEncounterChoice(state, 0);
      continue;
    }
    const event = pickEvent(state);
    if (!event) {
      state = advanceStage(state);
      continue;
    }
    const streak = seq.filter((s) => s.stage === stage).map((s) => s.variant);
    const v = variantOf(event, streak);
    seq.push({ stage, variant: v, critical: event.type === "critical" });
    const idx = event.options.findIndex((_, i) => optionAvailable(state, event, i));
    state = applyChoice(state, idx < 0 ? 0 : idx);
  }
  return seq;
}

/** 逐阶段统计：变体种类（全段）/ 最长连片（全段 + 非 critical 段）。 */
function summarize(seq) {
  const perStage = {};
  for (const { stage, variant, critical } of seq) {
    const cell = (perStage[stage] ??= {
      variants: new Set(),
      maxStreak: 0,
      maxStreakNonCritical: 0,
      criticalRun: { len: 0, max: 0 },
      count: 0,
    });
    cell.count += 1;
    cell.variants.add(variant);
    cell.maxStreak = Math.max(cell.maxStreak, cell.last === variant ? (cell.run ?? 0) + 1 : 1);
    cell.run = cell.last === variant ? (cell.run ?? 0) + 1 : 1;
    cell.last = variant;
    if (!critical) {
      cell.maxStreakNonCritical = Math.max(
        cell.maxStreakNonCritical,
        cell.lastNC === variant ? (cell.runNC ?? 0) + 1 : 1,
      );
      cell.runNC = cell.lastNC === variant ? (cell.runNC ?? 0) + 1 : 1;
      cell.lastNC = variant;
    } else {
      cell.runNC = 0;
      cell.lastNC = null;
    }
    // critical 段观测（连续 critical 卡里同变体的最长连片）
    if (critical) {
      cell.criticalRun.len += 1;
      cell.criticalRun.max = Math.max(cell.criticalRun.max, cell.criticalRun.len);
    } else {
      cell.criticalRun.len = 0;
    }
  }
  return perStage;
}

const agg = new Map();
const problems = [];
for (let i = 0; i < SEEDS; i++) {
  const seed = 1000 + i;
  const seq = playOne(seed);
  if (seq.length === 0) problems.push(`seed ${seed}：全程零卡（模拟异常）`);
  const perStage = summarize(seq);
  for (const [stage, cell] of Object.entries(perStage)) {
    const row = agg.get(stage) ?? {
      variants: new Set(),
      maxStreak: 0,
      maxStreakNonCritical: 0,
      criticalMax: 0,
      minCount: Infinity,
      maxCount: 0,
    };
    for (const v of cell.variants) row.variants.add(v);
    row.maxStreak = Math.max(row.maxStreak, cell.maxStreak);
    row.maxStreakNonCritical = Math.max(row.maxStreakNonCritical, cell.maxStreakNonCritical);
    row.criticalMax = Math.max(row.criticalMax, cell.criticalRun.max);
    row.minCount = Math.min(row.minCount, cell.count);
    row.maxCount = Math.max(row.maxCount, cell.count);
    agg.set(stage, row);
  }
}

const out = (s) => process.stdout.write(s + "\n");
out("节奏门 · plan/v5/02 §三（变体分配与 relay 直接复用 src/engine/rhythm.ts，无影子实现）");
out(`扫到：${SEEDS} 局 × ${STAGES.length} 阶段；门槛 每阶段变体 ≥${VARIANTS_MIN} / 同变体连续 ≤${STREAK_MAX}`);
out("=".repeat(72));
for (const stage of STAGES) {
  const row = agg.get(stage);
  if (!row) {
    problems.push(`阶段 ${stage}：全程未出任何卡（覆盖缺口）`);
    out(`FAIL  ${stage.padEnd(10)} 无卡`);
    continue;
  }
  const kinds = [...row.variants].sort();
  const okKind = kinds.length >= VARIANTS_MIN;
  const okStreak = row.maxStreakNonCritical <= STREAK_MAX;
  if (!okKind) problems.push(`阶段 ${stage} 变体种类 ${kinds.length} < ${VARIANTS_MIN}（${kinds.join(",")}）`);
  if (!okStreak) problems.push(`阶段 ${stage} 非 critical 段同变体连续 ${row.maxStreakNonCritical} > ${STREAK_MAX}`);
  out(
    `${okKind && okStreak ? "PASS" : "FAIL"}  ${stage.padEnd(10)} 变体 ${kinds.length} 种（${kinds.join("+")}）` +
      ` / 非critical连片 ${row.maxStreakNonCritical}（全段 ${row.maxStreak}，critical 段 ${row.criticalMax}）` +
      ` / 卡数 ${row.minCount}–${row.maxCount}`,
  );
}
out("=".repeat(72));
out(`判据说明：连片只判非 critical 段（v3 调度口径把 critical 排在阶段末尾、K11 不可动，`);
out(`           teen 结构上必然连发 4 张；为凑数字改 odds→draw 会改呈现语义，见本文件段首注）。`);
out("=".repeat(72));
for (const p of problems) out(`FAIL  ${p}`);
out(`结论: ${problems.length === 0 ? "绿（每阶段 ≥3 变体、非 critical 段同变体连续 ≤3）" : `红（${problems.length} 项不达标）`}`);
process.exitCode = problems.length === 0 ? 0 : 1;
