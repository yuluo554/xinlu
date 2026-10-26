// v5-M1'''' 机制层单测：偶遇层注入（02 §二）+ 节奏变体（02 §三）。
// 判据一律取实现导出的常量与函数（不在测试里复写门槛），口径单源 =
// plan/v5/02 §二（偶遇 0–3 条/种子决定/不推 line）+ §三（变体分配/概率可复现）。
import { describe, expect, it } from "vitest";
import eventsRaw from "../data/events.json";
import {
  applyChoice,
  applyEncounterChoice,
  applyEraCard,
  advanceStage,
  createRun,
  encounterFor,
  encounterQuota,
  eraEventFor,
  optionAvailable,
  pickEvent,
} from "./engine";
import { STAGES, type GameEvent, type RunState } from "./model";
import {
  DRAW_CARDS,
  ODDS_MAX,
  ODDS_MIN,
  SAME_VARIANT_STREAK_MAX,
  VARIANTS_PER_STAGE_MIN,
  baseVariantOf,
  drawCard,
  eraVariant,
  oddsOf,
  quickEligible,
  rhythmStats,
  rollOdds,
  variantOf,
} from "./rhythm";

const EVENTS = eventsRaw as unknown as GameEvent[];
const ENCOUNTERS = EVENTS.filter((e) => e.type === "encounter");
const ENV = { era: "80s", place: "小城", mood: "和睦", style: "宽容" };
const SEEDS = [1, 7, 42, 777, 2026, 31337];

/** 全程模拟（模型策略固定：每卡取第一条可用选项）。 */
function play(seed: number): RunState {
  let state = createRun(ENV, seed);
  for (let step = 0; step < 2000; step++) {
    if (state.stageIndex >= STAGES.length) break;
    if (eraEventFor(state)) {
      state = applyEraCard(state);
      continue;
    }
    if (encounterFor(state)) {
      state = applyEncounterChoice(state, 0);
      continue;
    }
    const event = pickEvent(state);
    if (!event) {
      state = advanceStage(state);
      continue;
    }
    const idx = event.options.findIndex((_, i) => optionAvailable(state, event, i));
    state = applyChoice(state, idx < 0 ? 0 : idx);
  }
  return state;
}

describe("偶遇层数据（v5/02 §二）", () => {
  it("40 条起、每阶段 ≥5；文案 40–80 字、2–3 选项（含单选项「就这样走过去」）", () => {
    expect(ENCOUNTERS.length).toBeGreaterThanOrEqual(40);
    for (const stage of STAGES) {
      const n = ENCOUNTERS.filter((e) => e.stage === stage).length;
      expect(n, `${stage} 偶遇条数`).toBeGreaterThanOrEqual(5);
    }
    for (const ev of ENCOUNTERS) {
      const len = [...ev.text].length;
      expect(len, `${ev.id} 文案长度`).toBeGreaterThanOrEqual(40);
      expect(len, `${ev.id} 文案长度`).toBeLessThanOrEqual(80);
      expect(ev.line, `${ev.id} line`).toBe("fate");
      expect(ev.options.length, `${ev.id} 选项数`).toBeGreaterThanOrEqual(1);
      expect(ev.options.length, `${ev.id} 选项数`).toBeLessThanOrEqual(3);
      expect(ev.detail, `${ev.id} 应有 detail（细看层）`).toBeTruthy();
      expect(ev.lineGain, `${ev.id} 不应带 lineGain`).toBeUndefined();
    }
  });

  it("|Δ3| ≤1、|资源 Δ| ≤3（偶遇只给氛围，不动判定核）", () => {
    for (const ev of ENCOUNTERS) {
      for (const o of ev.options) {
        for (const v of Object.values(o.deltas3 ?? {})) expect(Math.abs(v), `${ev.id} Δ3`).toBeLessThanOrEqual(1);
        for (const v of Object.values(o.resourceDeltas ?? {})) expect(Math.abs(v), `${ev.id} 资源`).toBeLessThanOrEqual(3);
      }
    }
  });
});

describe("偶遇注入（02 §二：0–3 条、种子决定、不推 line）", () => {
  it("配额恒在 0–3 且同种子同阶段恒同值（可复现）", () => {
    for (const seed of SEEDS) {
      for (let i = 0; i < STAGES.length; i++) {
        const state = { ...createRun(ENV, seed), stageIndex: i };
        const q = encounterQuota(state);
        expect(q).toBeGreaterThanOrEqual(0);
        expect(q).toBeLessThanOrEqual(3);
        expect(encounterQuota({ ...state })).toBe(q); // 纯函数：同状态同值
      }
    }
  });

  it("每阶段实出条数 ≤ 配额，且全库确有 0 条阶段（留白存在）", () => {
    let zeroQuotaStages = 0;
    let sawEncounter = 0;
    for (const seed of SEEDS) {
      let state = createRun(ENV, seed);
      const used: Record<string, number> = {};
      const quota: Record<string, number> = {};
      for (const stage of STAGES) quota[stage] = encounterQuota({ ...state, stageIndex: STAGES.indexOf(stage) });
      for (let step = 0; step < 2000; step++) {
        if (state.stageIndex >= STAGES.length) break;
        const stage = STAGES[state.stageIndex]!;
        if (eraEventFor(state)) {
          state = applyEraCard(state);
          continue;
        }
        if (encounterFor(state)) {
          used[stage] = (used[stage] ?? 0) + 1;
          sawEncounter += 1;
          state = applyEncounterChoice(state, 0);
          continue;
        }
        const event = pickEvent(state);
        if (!event) {
          state = advanceStage(state);
          continue;
        }
        const idx = event.options.findIndex((_, i) => optionAvailable(state, event, i));
        state = applyChoice(state, idx < 0 ? 0 : idx);
      }
      for (const stage of STAGES) {
        expect(used[stage] ?? 0, `seed=${seed} ${stage} 超出配额`).toBeLessThanOrEqual(quota[stage]!);
        if (quota[stage] === 0) zeroQuotaStages += 1;
      }
    }
    expect(sawEncounter, "全程应至少出一张偶遇").toBeGreaterThan(0);
    expect(zeroQuotaStages, "应有 0 条偶遇的阶段（留白是口径的一部分）").toBeGreaterThan(0);
  });

  it("偶遇不推任何线进度（lineGainOf 对 encounter 恒 0）", () => {
    const state = { ...createRun(ENV, 42), stageIndex: 3 };
    const event = encounterFor(state);
    if (!event) return; // 该种子该阶段无偶遇：配额 0 属合法留白
    const before = { ...state.lines };
    const next = applyEncounterChoice(state, 0);
    expect(next.lines).toEqual(before);
    // 也不推进阶段
    expect(next.stageIndex).toBe(state.stageIndex);
    // 但确实入账了 history（可见于后续状态）
    expect(next.history.length).toBe(state.history.length + 1);
  });

  it("偶遇不连发：上一张是偶遇时 encounterFor 返回 null", () => {
    for (const seed of SEEDS) {
      let state = createRun(ENV, seed);
      for (let step = 0; step < 2000; step++) {
        if (state.stageIndex >= STAGES.length) break;
        if (eraEventFor(state)) {
          state = applyEraCard(state);
          continue;
        }
        const enc = encounterFor(state);
        if (enc) {
          state = applyEncounterChoice(state, 0);
          if (state.stageIndex < STAGES.length) {
            const again = encounterFor(state);
            // 刚出过偶遇：同阶段内不得紧接再出一张（除非阶段已换）
            if (again) expect(again.stage).not.toBe(enc.stage);
          }
          continue;
        }
        const event = pickEvent(state);
        if (!event) {
          state = advanceStage(state);
          continue;
        }
        const idx = event.options.findIndex((_, i) => optionAvailable(state, event, i));
        state = applyChoice(state, idx < 0 ? 0 : idx);
      }
    }
  });

  it("同种子全程同结果（可复现硬约束）", () => {
    const a = play(2026);
    const b = play(2026);
    expect(a.history.map((h) => h.eventId)).toEqual(b.history.map((h) => h.eventId));
    expect(a.values3).toEqual(b.values3);
    expect(a.lines).toEqual(b.lines);
  });
});

describe("节奏变体分配（02 §三 单源规则）", () => {
  it("critical → draw 或 odds（按 risk）；encounter → draw 或 quick；无选项 → read", () => {
    for (const ev of EVENTS) {
      if (ev.type === "encounter") {
        expect(["draw", "quick"], `${ev.id}`).toContain(baseVariantOf(ev));
        continue;
      }
      if (ev.type === "critical") {
        expect(["draw", "odds"], `${ev.id}`).toContain(baseVariantOf(ev));
        expect(baseVariantOf(ev)).toBe(ev.risk ? "odds" : "draw");
        continue;
      }
      if (ev.options.length === 0) {
        expect(baseVariantOf(ev)).toBe("read");
        continue;
      }
      expect(["choice", "quick"], `${ev.id}`).toContain(baseVariantOf(ev));
    }
    expect(eraVariant()).toBe("read");
  });

  it("全部 critical 都标了 risk（否则 teen 阶段四张全落 draw，节奏单一）", () => {
    const criticals = EVENTS.filter((e) => e.type === "critical");
    expect(criticals.length).toBeGreaterThan(0);
    const missing = criticals.filter((e) => !e.risk).map((e) => e.id);
    expect(missing, `未标 risk 的 critical：${missing.join(",")}`).toEqual([]);
  });

  it("quick 可用性由实现判定（2–3 个选项全部 ≤QUICK_OPTION_MAX）", () => {
    const short = EVENTS.find((e) => e.options.length <= 3 && e.options.every((o) => [...o.text].length <= 6));
    if (short) expect(quickEligible(short)).toBe(true);
    const longEv = EVENTS.find((e) => e.options.some((o) => [...o.text].length > 20));
    if (longEv) expect(quickEligible(longEv)).toBe(false);
  });

  it("防单调 relay：本阶段已连 3 张 choice 时，下一张 choice 卡改判 quick", () => {
    const ev = EVENTS.find((e) => baseVariantOf(e) === "choice")!;
    const saturated = Array.from({ length: SAME_VARIANT_STREAK_MAX }, () => "choice" as const);
    expect(variantOf(ev, saturated)).toBe("quick");
    expect(variantOf(ev, ["choice", "choice"])).toBe("choice"); // 未饱和不换
    expect(variantOf(ev, ["quick", "choice", "choice"])).toBe("choice");
  });
});

describe("概率变体可复现（02 §三：同种子同结果）", () => {
  it("oddsOf 落在 [ODDS_MIN, ODDS_MAX] 且同状态恒同值", () => {
    const state = createRun(ENV, 42);
    for (const ev of EVENTS.filter((e) => e.type === "critical" && e.risk)) {
      const p = oddsOf(ev, state);
      expect(p).toBeGreaterThanOrEqual(ODDS_MIN);
      expect(p).toBeLessThanOrEqual(ODDS_MAX);
      expect(oddsOf(ev, state)).toBe(p);
    }
  });

  it("rollOdds 同种子同状态同结果；不同种子应有差异（非恒定）", () => {
    const ev = EVENTS.find((e) => e.type === "critical" && e.risk)!;
    const results = new Set<boolean>();
    // 6 个种子在该事件的成功率附近可能全落同一侧（0.55 基准下是二项抽样的正常抖动），
    // 故取 30 个种子判「非退化」——恒 true/恒 false 才是真缺陷。
    for (let i = 1; i <= 30; i++) {
      const state = createRun(ENV, i);
      const a = rollOdds(ev, state);
      const b = rollOdds(ev, state);
      expect(a, `seed=${i} 应可复现`).toBe(b);
      results.add(a);
    }
    expect(results.size, "不应恒定成败（抽签必须真的有随机）").toBe(2);
  });

  it("drawCard 恒在 0..DRAW_CARDS-1 且同状态同牌面；多状态覆盖全部牌位", () => {
    const ev = EVENTS.find((e) => e.type === "critical")!;
    const seen = new Set<number>();
    for (const seed of [...SEEDS, 5, 6, 8, 9, 10, 11, 12]) {
      const state = createRun(ENV, seed);
      const c = drawCard(ev, state);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(DRAW_CARDS);
      expect(drawCard(ev, state)).toBe(c);
      seen.add(c);
    }
    expect(seen.size, "三张牌位应都被抽到过（等概率 1/3 的抽样非退化）").toBe(DRAW_CARDS);
  });
});

describe("节奏门统计（每阶段 ≥3 变体 / 同变体连续 ≤3）", () => {
  it("rhythmStats 逐阶段给出变体种类与最长连片", () => {
    const { perStage } = rhythmStats([
      { stage: "teen", variant: "choice" },
      { stage: "teen", variant: "choice" },
      { stage: "teen", variant: "draw" },
      { stage: "teen", variant: "draw" },
      { stage: "teen", variant: "draw" },
      { stage: "teen", variant: "draw" },
      { stage: "teen", variant: "read" },
    ]);
    expect(perStage.teen!.variants.sort()).toEqual(["choice", "draw", "read"]);
    expect(perStage.teen!.maxStreak).toBe(4);
    expect(perStage.teen!.count).toBe(7);
  });

  it("真实对局：每阶段变体 ≥3 种；非 critical 段连片 ≤3", () => {
    for (const seed of SEEDS) {
      let state = createRun(ENV, seed);
      const seq: Array<{ stage: string; variant: string; critical: boolean }> = [];
      for (let step = 0; step < 2000; step++) {
        if (state.stageIndex >= STAGES.length) break;
        const stage = STAGES[state.stageIndex]!;
        if (eraEventFor(state)) {
          seq.push({ stage, variant: eraVariant(), critical: true });
          state = applyEraCard(state);
          continue;
        }
        const enc = encounterFor(state);
        if (enc) {
          const streak = seq.filter((s) => s.stage === stage).map((s) => s.variant as never);
          seq.push({ stage, variant: variantOf(enc, streak), critical: false });
          state = applyEncounterChoice(state, 0);
          continue;
        }
        const event = pickEvent(state);
        if (!event) {
          state = advanceStage(state);
          continue;
        }
        const streak = seq.filter((s) => s.stage === stage).map((s) => s.variant as never);
        seq.push({ stage, variant: variantOf(event, streak), critical: event.type === "critical" });
        const idx = event.options.findIndex((_, i) => optionAvailable(state, event, i));
        state = applyChoice(state, idx < 0 ? 0 : idx);
      }
      // 每阶段变体种类
      for (const stage of STAGES) {
        const kinds = new Set(seq.filter((s) => s.stage === stage).map((s) => s.variant));
        expect(kinds.size, `seed=${seed} ${stage} 变体种类`).toBeGreaterThanOrEqual(VARIANTS_PER_STAGE_MIN);
      }
      // 非 critical 段连片
      let run = 1;
      for (let i = 1; i < seq.length; i++) {
        const cur = seq[i]!;
        const prev = seq[i - 1]!;
        if (cur.critical || prev.critical) {
          run = 1;
          continue;
        }
        run = cur.stage === prev.stage && cur.variant === prev.variant ? run + 1 : 1;
        expect(run, `seed=${seed} ${cur.stage} ${cur.variant} 连片`).toBeLessThanOrEqual(SAME_VARIANT_STREAK_MAX);
      }
    }
  });
});
