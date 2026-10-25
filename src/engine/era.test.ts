// 年代卡注入单测（plan/v4/02 §二 ▸ M1''' 增补：命中/去重/每阶段 ≤2/错峰/stageFit 过滤）。
import { describe, expect, it } from "vitest";
import { applyChoice, applyEraCard, createRun, eraEventById, eraEventFor, pickEvent } from "./engine";
import { runYearOf } from "./year";
import type { BirthEnv, BirthProfile, RunState } from "./model";

const CUSTOM_1956 = {
  env: { era: "60s", place: "大城", mood: "和睦", style: "权威" } as BirthEnv,
  birth: {
    birthYear: 1956,
    profile: { region: "南方", structure: "双孩", parentsJob: "教师医生", wealth: "一般" } as BirthProfile,
  },
};

/** 推进 n 步（无脑选末项），时代卡到点即吃——模拟 UI 层注入节奏。 */
function drive(state: RunState, steps: number): RunState {
  let s = state;
  for (let i = 0; i < steps; i++) {
    const era = eraEventFor(s);
    if (era) {
      s = applyEraCard(s);
      continue;
    }
    const ev = pickEvent(s);
    if (!ev) break;
    s = applyChoice(s, ev.options.length - 1);
  }
  return s;
}

describe("eraEventFor（注入细则单源 02 §二 ▸ M1'''）", () => {
  it("runYear 命中锚年且阶段 ∈ stageFit → 插卡（1956 出生 infant 命中 1956 锚）", () => {
    const state = createRun(CUSTOM_1956.env, 999, CUSTOM_1956.birth);
    const next = pickEvent(state)!;
    const era = eraEventFor(state);
    expect(era).not.toBeNull();
    expect(era!.year).toBe(runYearOf(state.birthYear, next.ageMonths));
    expect(era!.stageFit).toContain("infant");
  });

  it("已入 history 的锚不重复；吃完同一锚后同位置不再插（下一事件同年）", () => {
    let state = createRun(CUSTOM_1956.env, 999, CUSTOM_1956.birth);
    const first = eraEventFor(state)!;
    state = applyEraCard(state);
    // 下一张事件月龄未跨年 → 同锚已消费，本位置不再插
    const again = eraEventFor(state);
    if (again) expect(again.id).not.toBe(first.id);
  });

  it("本阶段已插满 2 张不再插（cap = ERA_PER_STAGE_MAX）", () => {
    let state = createRun(CUSTOM_1956.env, 999, CUSTOM_1956.birth);
    for (let i = 0; i < 40; i++) {
      const era = eraEventFor(state);
      if (!era) {
        const ev = pickEvent(state);
        if (!ev) break;
        state = applyChoice(state, ev.options.length - 1);
        continue;
      }
      state = applyEraCard(state);
    }
    const infantEra = state.history.filter((h) => h.kind === "era").length;
    expect(infantEra).toBeLessThanOrEqual(2);
  });

  it("stageFit 不含当前阶段 → 跳过不追插（1977 锚无 infant 档，1975 出生路过即错过）", () => {
    const env = { era: "70s", place: "大城", mood: "和睦", style: "宽容" } as BirthEnv;
    const birth = { birthYear: 1975, profile: { region: "北方", structure: "独生", parentsJob: "工人", wealth: "一般" } as BirthProfile };
    let state = createRun(env, 5, birth);
    state = drive(state, 80);
    const eraIds = state.history.filter((h) => h.kind === "era").map((h) => h.eventId);
    expect(eraIds).not.toContain("era-1977-gaokao");
  });

  it("下一张是 critical → 让位不插（错峰 ≥1 张卡）", () => {
    const state = createRun(CUSTOM_1956.env, 999, CUSTOM_1956.birth);
    // 人工构造：history 末条挂一个本库真实 critical（teen-003），eraEventFor 应直接让位
    const patched: RunState = {
      ...state,
      history: state.history.concat({ eventId: "teen-003", option: 0, dimsAfter: state.dims }),
    };
    expect(eraEventFor(patched)).toBeNull();
  });

  it("终局态（stageIndex 越界）不插", () => {
    const state = { ...createRun(CUSTOM_1956.env, 999, CUSTOM_1956.birth), stageIndex: 8 };
    expect(eraEventFor(state)).toBeNull();
  });
});

describe("applyEraCard（固定增量走既有通道）", () => {
  it("三观/资源/派生四维同步入账；history 记 kind:era + option:-1", () => {
    const state = createRun(CUSTOM_1956.env, 999, CUSTOM_1956.birth);
    const era = eraEventFor(state)!;
    const after = applyEraCard(state);
    expect(after.values3.worldview).toBe(state.values3.worldview + (era.deltas3.worldview ?? 0));
    expect(after.resources.mood).toBe(Math.max(0, Math.min(100, state.resources.mood + (era.resourceDeltas.mood ?? 0))));
    expect(after.history).toHaveLength(1);
    expect(after.history[0]).toMatchObject({ eventId: era.id, option: -1, kind: "era" });
    expect(after.history[0]!.dimsAfter).toEqual(after.dims);
    // 同锚已消费、下一事件未跨年 → 无卡可插，applyEraCard 抛错（调用方契约）
    expect(() => applyEraCard(after)).toThrow();
  });
});
