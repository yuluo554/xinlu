import { describe, expect, it } from "vitest";
import endingsRaw from "../data/endings.json";
import {
  advanceStage,
  applyChoice,
  createRun,
  mbtiLetters,
  pickEvent,
  resolveEnding,
  seededDraw,
} from "./engine";
import { DIM_KEYS, STAGES, type Dims, type Ending, type RunState } from "./model";

const ENDINGS = endingsRaw as unknown as Ending[];

// 手算 K8 合成：90s{ei:1,sn:0,tf:-1,jp:0} + 小城{0,1,0,1} + 和睦{1,0,2,0} + 权威{-1,1,-1,3}
// = {ei:1, sn:2, tf:0, jp:4} → 初始值 {ei:51, sn:52, tf:50, jp:54}
const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };
// 农村 版：ei 1-2+1-1 = -1 → 49（初始值低于 50 的符号样本）
const ENV_LOW_EI = { era: "90s", place: "农村", mood: "和睦", style: "权威" };

const dimsOf = (ei: number, sn: number, tf: number, jp: number): Dims => ({ ei, sn, tf, jp });

describe("createRun", () => {
  it("K8 合成初始四维：50 + 四要素修正量之和，不做钳制", () => {
    const run = createRun(ENV, 2026);
    expect(run.dims).toEqual(dimsOf(51, 52, 50, 54));
    expect(run.stageIndex).toBe(0);
    expect(run.history).toEqual([]);
    expect(run.flags).toEqual([]);
    expect(run.seed).toBe(2026);
    expect(run.env).toEqual(ENV);
  });

  it("两次 createRun 状态独立，无共享引用", () => {
    const a = createRun(ENV, 1);
    const b = createRun(ENV, 1);
    a.dims.ei = 99;
    a.history.push({ eventId: "x", option: 0, dimsAfter: a.dims });
    expect(b.dims.ei).toBe(51);
    expect(b.history).toEqual([]);
  });

  it("环境枚举越界抛错", () => {
    expect(() => createRun({ ...ENV, era: "40s" }, 1)).toThrow(/era/);
    expect(() => createRun({ ...ENV, place: "外星" }, 1)).toThrow(/place/);
  });

  it("非有限 seed 抛错", () => {
    expect(() => createRun(ENV, Number.NaN)).toThrow(/seed/);
    expect(() => createRun(ENV, Number.POSITIVE_INFINITY)).toThrow(/seed/);
  });
});

describe("seededDraw", () => {
  it("同参数结果确定", () => {
    expect(seededDraw(2026, 7)).toBe(seededDraw(2026, 7));
    expect(seededDraw(-3, 0)).toBe(seededDraw(-3, 0));
  });

  it("取值落 [0,1)", () => {
    for (let n = 0; n < 500; n++) {
      const r = seededDraw(2026, n);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });

  it("随已决事件数变化（抽取流不是常量）", () => {
    const draws = new Set(Array.from({ length: 64 }, (_, n) => seededDraw(2026, n)));
    expect(draws.size).toBeGreaterThan(50);
  });
});

describe("applyChoice", () => {
  it("常规偏移写入 dims 并追加 history（infant-001 选项 0）", () => {
    const after = applyChoice(createRun(ENV, 7), 0);
    expect(after.dims).toEqual(dimsOf(53, 52, 51, 54));
    expect(after.history).toHaveLength(1);
    expect(after.history[0]).toMatchObject({ eventId: "infant-001", option: 0 });
    expect(after.history[0]!.dimsAfter).toEqual(after.dims);
  });

  it("钳制上界：跨 100 的偏移停在 100", () => {
    const state: RunState = {
      seed: 7,
      env: ENV,
      stageIndex: 7,
      dims: dimsOf(99, 50, 100, 50),
      history: [{ eventId: "elder-001", option: 0, dimsAfter: dimsOf(99, 50, 100, 50) }],
      flags: [],
    };
    // 待答事件 = elder-002；选项 1 deltas {ei:+2, tf:+2}
    const after = applyChoice(state, 1);
    expect(after.dims).toEqual(dimsOf(100, 50, 100, 50));
  });

  it("钳制下界：跌破 0 的偏移停在 0", () => {
    const state: RunState = {
      seed: 7,
      env: ENV,
      stageIndex: 7,
      dims: dimsOf(0, 50, 0, 50),
      history: [{ eventId: "elder-001", option: 0, dimsAfter: dimsOf(0, 50, 0, 50) }],
      flags: [],
    };
    // 选项 0 deltas {ei:-1, jp:+3, tf:+1}
    const after = applyChoice(state, 0);
    expect(after.dims).toEqual(dimsOf(0, 50, 1, 53));
  });

  it("中立值 50 无偏移的维度保持不动", () => {
    const fresh = createRun(ENV, 7);
    const state: RunState = { ...fresh, dims: dimsOf(50, 50, 50, 50) };
    // infant-001 选项 1 deltas {sn:+1, jp:+1}
    const after = applyChoice(state, 1);
    expect(after.dims).toEqual(dimsOf(50, 51, 50, 51));
  });

  it("flag 去重：已持有的 flag 不重复入列", () => {
    const state: RunState = {
      seed: 7,
      env: ENV,
      stageIndex: 3,
      dims: dimsOf(50, 50, 50, 50),
      history: [{ eventId: "teen-001", option: 0, dimsAfter: dimsOf(50, 50, 50, 50) }],
      flags: ["rebel"],
    };
    // 待答事件 = teen-002（pre: rebel）；选项 1 带 flag rebel
    const after = applyChoice(state, 1);
    expect(after.flags).toEqual(["rebel"]);
  });

  it("history.dimsAfter 是快照，后续演化不回写", () => {
    const after = applyChoice(createRun(ENV, 7), 0);
    const snap = after.history[0]!.dimsAfter.ei;
    after.dims.ei = 0;
    expect(after.history[0]!.dimsAfter.ei).toBe(snap);
  });

  it("选项越界抛错", () => {
    const fresh = createRun(ENV, 7);
    expect(() => applyChoice(fresh, 2)).toThrow(/选项越界/);
    expect(() => applyChoice(fresh, -1)).toThrow(/选项越界/);
  });
});

describe("pickEvent", () => {
  it("main 优先于 context/critical，按库序", () => {
    expect(pickEvent(createRun(ENV, 7))!.id).toBe("infant-001");
  });

  it("main 消费后转入 context；全耗尽后 critical；耗尽返回 null", () => {
    let state = createRun(ENV, 7);
    state = applyChoice(state, 0);
    expect(pickEvent(state)!.id).toBe("infant-002");
    state = applyChoice(state, 1);
    expect(pickEvent(state)).toBeNull();
    state = advanceStage(state);
    expect(pickEvent(state)!.id).toBe("toddler-001");
  });

  it("pre 不满足的事件被过滤（teen-002 需要 rebel）", () => {
    const noRebel: RunState = {
      seed: 7,
      env: ENV,
      stageIndex: 3,
      dims: dimsOf(50, 50, 50, 50),
      history: [{ eventId: "teen-001", option: 0, dimsAfter: dimsOf(50, 50, 50, 50) }],
      flags: [],
    };
    expect(pickEvent(noRebel)!.id).toBe("teen-003");
    const withRebel = { ...noRebel, flags: ["rebel"] };
    expect(pickEvent(withRebel)!.id).toBe("teen-002");
  });

  it("同状态重复调用幂等；终局后返回 null", () => {
    const state = applyChoice(createRun(ENV, 7), 0);
    expect(pickEvent(state)!.id).toBe(pickEvent(state)!.id);
    const finished: RunState = { ...state, stageIndex: STAGES.length };
    expect(pickEvent(finished)).toBeNull();
  });
});

describe("advanceStage", () => {
  it("逐阶段推进，elder 推进后进入终局（stageIndex = 8）", () => {
    let state = createRun(ENV, 7);
    expect(state.stageIndex).toBe(0);
    state = advanceStage(state);
    expect(state.stageIndex).toBe(1);
    const last: RunState = { ...state, stageIndex: 7 };
    expect(advanceStage(last).stageIndex).toBe(STAGES.length);
  });

  it("终局后再推进抛错；推进不改 dims/flags/history", () => {
    const state = createRun(ENV, 7);
    const next = advanceStage(state);
    expect(next.dims).toEqual(state.dims);
    expect(next.flags).toEqual(state.flags);
    expect(next.history).toEqual(state.history);
    const done: RunState = { ...state, stageIndex: STAGES.length };
    expect(() => advanceStage(done)).toThrow(/终局/);
  });
});

describe("resolveEnding", () => {
  it("按区间命中条件结局（end-01 / end-02 / end-06）", () => {
    const base: RunState = { ...createRun(ENV, 7), history: [] };
    expect(resolveEnding({ ...base, dims: dimsOf(60, 40, 60, 60) }).id).toBe("end-01");
    expect(resolveEnding({ ...base, dims: dimsOf(40, 60, 40, 60) }).id).toBe("end-02");
    expect(resolveEnding({ ...base, dims: dimsOf(60, 60, 60, 60) }).id).toBe("end-06");
  });

  it("end-03 必含 wanderlust：缺 flag 落兜底，有 flag 命中", () => {
    const base: RunState = { ...createRun(ENV, 7), dims: dimsOf(40, 40, 60, 40) };
    expect(resolveEnding({ ...base, flags: [] }).id).toBe("end-fallback");
    expect(resolveEnding({ ...base, flags: ["wanderlust"] }).id).toBe("end-03");
  });

  it("end-04 必含 rebel 且禁含 conform", () => {
    const base: RunState = { ...createRun(ENV, 7), dims: dimsOf(60, 40, 40, 40) };
    expect(resolveEnding({ ...base, flags: ["rebel"] }).id).toBe("end-04");
    expect(resolveEnding({ ...base, flags: ["rebel", "conform"] }).id).toBe("end-fallback");
    expect(resolveEnding({ ...base, flags: ["conform"] }).id).toBe("end-fallback");
  });

  it("四维全 50 不落任何条件区间，命中兜底", () => {
    const base: RunState = { ...createRun(ENV, 7), dims: dimsOf(50, 50, 50, 50) };
    expect(resolveEnding(base).id).toBe("end-fallback");
  });
});

describe("mbtiLetters", () => {
  it("高于 50 取高侧字母，低于 50 取低侧字母", () => {
    expect(mbtiLetters(dimsOf(60, 40, 70, 30), ENV)).toBe("ENFP");
    expect(mbtiLetters(dimsOf(40, 60, 30, 70), ENV)).toBe("ISTJ");
  });

  it("当前值恰为 50 时按出生初始值符号裁定", () => {
    // ENV 初始值 {ei:51, sn:52, tf:50, jp:54}：ei/sn/jp 的 50 依初始符号取高侧，tf 初始亦 50 取低侧
    expect(mbtiLetters(dimsOf(50, 50, 50, 50), ENV)).toBe("ESTJ");
    // ENV_LOW_EI 初始 ei=49：ei 的 50 取低侧 I
    expect(mbtiLetters(dimsOf(50, 50, 50, 50), ENV_LOW_EI)).toBe("ISTJ");
  });

  it("混合情形：实测初始值 {51,52,50,54} 的当值为 {60,40,50,30}", () => {
    expect(mbtiLetters(dimsOf(60, 40, 50, 30), ENV)).toBe("ENTP");
  });
});

describe("数据口径 ↔ 引擎 ↔ 测试 三方一致", () => {
  it("8 个条件结局按区间中值构造终态可命中，且 typeText 与四维实算字母全等", () => {
    for (const ending of ENDINGS) {
      if (!ending.cond || !ending.typeText) continue;
      const dims = {} as Dims;
      for (const dim of DIM_KEYS) {
        const range = ending.cond.dims?.[dim];
        if (!range) throw new Error(`测试假设落空：${ending.id} 缺 ${dim} 区间`);
        dims[dim] = Math.floor((range[0] + range[1]) / 2);
      }
      const state: RunState = { ...createRun(ENV, 7), dims, flags: ending.cond.flags ?? [] };
      expect(resolveEnding(state).id).toBe(ending.id);
      expect(mbtiLetters(state.dims, state.env), `${ending.id} 字母不符`).toBe(ending.typeText);
    }
  });
});

describe("可复现契约：同 seed + 同选项序列 ⇒ 全程逐字段全等", () => {
  type Chooser = (state: RunState) => number;

  const chooseFirst: Chooser = () => 0;
  const chooseSecond: Chooser = () => 1;
  const chooseHash =
    (seed: number): Chooser =>
    (state) =>
      seededDraw(seed, state.history.length) < 0.5 ? 0 : 1;

  function fullTrace(seed: number, choose: Chooser): RunState[] {
    const states: RunState[] = [];
    let state = createRun(ENV, seed);
    states.push(state);
    while (state.stageIndex < STAGES.length) {
      const event = pickEvent(state);
      state = event ? applyChoice(state, choose(state)) : advanceStage(state);
      states.push(state);
    }
    return states;
  }

  function assertReproducible(seed: number, choose: Chooser): void {
    const a = fullTrace(seed, choose);
    const b = fullTrace(seed, choose);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(JSON.stringify(a[i]), `第 ${i} 个状态快照不一致`).toBe(JSON.stringify(b[i]));
    }
    const final = a[a.length - 1]!;
    expect(final.stageIndex).toBe(STAGES.length);
    for (const dim of DIM_KEYS) {
      expect(final.dims[dim]).toBeGreaterThanOrEqual(0);
      expect(final.dims[dim]).toBeLessThanOrEqual(100);
    }
    expect(resolveEnding(final).id).toMatch(/^end-/);
  }

  it("全选第一项 / 全选第二项 / 哈希混合选择，三种路径双跑全等", () => {
    assertReproducible(2026, chooseFirst);
    assertReproducible(2026, chooseSecond);
    assertReproducible(2026, chooseHash(2026));
    assertReproducible(1730012345, chooseHash(1730012345));
  });

  it("不同种子各自跑通到终局且结局合法", () => {
    for (const seed of [1, 7, 42, 97, 2024]) {
      const trace = fullTrace(seed, chooseHash(seed));
      const final = trace[trace.length - 1]!;
      expect(final.stageIndex).toBe(STAGES.length);
      expect(resolveEnding(final).id).toMatch(/^end-/);
    }
  });
});
