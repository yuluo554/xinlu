// 可达性年代轴抽样复跑（v4/02 §十 ▸ M1''' 增补）：时代卡增量纳入扫描——
// 6 个出生年 × 12 环境 × 13 轴权重，游玩循环在 pickEvent 之外按注入细则吃时代卡
// （与 UI 层同节奏：eraEventFor → applyEraCard）。全量 2496 组基线（不含时代卡）
// 保持 tests/reachability-full.test.ts 原样，本档是 v4 年代轴抽样口径的增量复跑。
import { describe, expect, it } from "vitest";
import {
  advanceStage,
  applyChoice,
  applyEraCard,
  createRun,
  eraEventFor,
  pickEvent,
  resolveEnding,
} from "../src/engine/engine";
import { STAGES, type RunState } from "../src/engine/model";

const SAMPLE_YEARS = [1955, 1968, 1977, 1990, 2003, 2015];
const SAMPLE_ENVS: Array<{ place: string; mood: string; style: string }> = [
  { place: "大城", mood: "和睦", style: "宽容" },
  { place: "大城", mood: "紧张", style: "权威" },
  { place: "小城", mood: "和睦", style: "权威" },
  { place: "小城", mood: "单亲", style: "忽视" },
  { place: "县镇", mood: "紧张", style: "宽容" },
  { place: "县镇", mood: "疏离", style: "忽视" },
  { place: "农村", mood: "和睦", style: "宽容" },
  { place: "农村", mood: "单亲", style: "权威" },
  { place: "小城", mood: "和睦", style: "忽视" },
  { place: "大城", mood: "疏离", style: "宽容" },
  { place: "县镇", mood: "和睦", style: "权威" },
  { place: "农村", mood: "紧张", style: "忽视" },
];
const AXES = ["worldview", "outlook", "values"] as const;
const SAMPLE_WEIGHTS: Array<Record<(typeof AXES)[number], number>> = [
  { worldview: 1, outlook: 1, values: 1 },
  { worldview: -1, outlook: -1, values: -1 },
  { worldview: 1, outlook: -1, values: 1 },
  { worldview: -1, outlook: 1, values: -1 },
  { worldview: 2, outlook: 0, values: -1 },
  { worldview: -2, outlook: 0, values: 1 },
  { worldview: 0, outlook: 2, values: -2 },
  { worldview: 1, outlook: 2, values: 0 },
  { worldview: 0, outlook: -2, values: 2 },
  { worldview: 3, outlook: 1, values: -2 },
  { worldview: -3, outlook: -1, values: 2 },
  { worldview: 2, outlook: 2, values: 2 },
  { worldview: -1, outlook: 3, values: -3 },
];

function eraOfDecade(birthYear: number): string {
  if (birthYear < 1970) return "60s";
  if (birthYear < 1980) return "70s";
  if (birthYear < 1990) return "80s";
  if (birthYear < 2000) return "90s";
  if (birthYear < 2010) return "00s";
  return "10s";
}

/** 单局模拟（含时代卡注入）：与 scripts/check-ending-reachability.mjs playOne 同策略 + era 卡。 */
function playOne(birthYear: number, env: { place: string; mood: string; style: string }, weights: Record<(typeof AXES)[number], number>) {
  let state: RunState = createRun(
    { era: eraOfDecade(birthYear), place: env.place, mood: env.mood, style: env.style },
    20260101,
    { birthYear, profile: { region: "南方", structure: "双孩", parentsJob: "工人", wealth: "一般" } },
  );
  let eraCards = 0;
  for (let steps = 0; steps < 2000; steps++) {
    if (eraEventFor(state)) {
      state = applyEraCard(state);
      eraCards += 1;
      continue;
    }
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
      if (req && !Object.entries(req).every(([k, v]) => state.resources[k as keyof RunState["resources"]] >= v)) continue;
      const d3 = event.options[i]?.deltas3 ?? {};
      const score = AXES.reduce((acc, k) => acc + weights[k] * (d3[k] ?? 0), 0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    state = applyChoice(state, best === -1 ? 0 : best);
  }
  return { endingId: resolveEnding(state).id, eraCards };
}

describe("可达性年代轴抽样复跑（v4/02 §十：时代卡增量纳入扫描）", () => {
  it(
    "6 出生年 × 12 环境 × 13 权重：局局有终局、时代卡确有注入、≥6 结局可达",
    { timeout: 240_000 },
    () => {
      const hits = new Map<string, number>();
      let runs = 0;
      let eraTotal = 0;
      for (const year of SAMPLE_YEARS) {
        for (const env of SAMPLE_ENVS) {
          for (const weights of SAMPLE_WEIGHTS) {
            const { endingId, eraCards } = playOne(year, env, weights);
            runs += 1;
            eraTotal += eraCards;
            hits.set(endingId, (hits.get(endingId) ?? 0) + 1);
          }
        }
      }
      expect(runs).toBe(SAMPLE_YEARS.length * SAMPLE_ENVS.length * SAMPLE_WEIGHTS.length);
      // 时代卡确实注入（注入链路活体证明；量级供留痕）
      expect(eraTotal).toBeGreaterThan(0);
      // 结局面：抽样内 ≥6/9 可达（全量 9/9 基线由不含时代卡的原扫描守住）
      expect(hits.size, `实际命中结局：${[...hits.entries()].map(([k, v]) => `${k}×${v}`).join(", ")}`).toBeGreaterThanOrEqual(6);
    },
  );
});
