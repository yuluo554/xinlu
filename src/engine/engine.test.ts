import { describe, expect, it } from "vitest";
import endingsRaw from "../data/endings.json";
import eventsRaw from "../data/events.json";
import {
  advanceStage,
  applyChoice,
  applyCustomChoice,
  createRun,
  deriveBirth,
  mbtiLetters,
  optionAvailable,
  pickEvent,
  resolveEnding,
  seededDraw,
} from "./engine";
import { generateFamily } from "./family";
import {
  DIM_KEYS,
  STAGES,
  type Dims,
  type Ending,
  type GameEvent,
  type HistoryEntry,
  type RunState,
} from "./model";

const ENDINGS = endingsRaw as unknown as Ending[];
const EVENTS = eventsRaw as unknown as GameEvent[];

// 手算 K8 合成：90s{ei:1,sn:0,tf:-1,jp:0} + 小城{0,1,0,1} + 和睦{1,0,2,0} + 权威{-1,1,-1,3}
// = {ei:1, sn:2, tf:0, jp:4} → 初始值 {ei:51, sn:52, tf:50, jp:54}
const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };
// 农村 版：ei 1-2+1-1 = -1 → 49（初始值低于 50 的符号样本）
const ENV_LOW_EI = { era: "90s", place: "农村", mood: "和睦", style: "权威" };

const dimsOf = (ei: number, sn: number, tf: number, jp: number): Dims => ({ ei, sn, tf, jp });

/** 构造"谓词命中的事件全部已决"的 history：把待答事件精确顶到目标事件上（密度无关）。 */
const historyOf = (pred: (e: GameEvent) => boolean): HistoryEntry[] =>
  EVENTS.filter(pred).map((e) => ({
    eventId: e.id,
    option: 0,
    dimsAfter: dimsOf(50, 50, 50, 50),
  }));

describe("createRun", () => {
  it("K8 合成初始四维（v4 八因素版）：50 + 全部八组修正量之和，不做钳制", () => {
    const run = createRun(ENV, 2026);
    // seed2026 派生画像 {北方,多孩,公职,宽裕}：手算 50 + era/place/mood/style + 四因素修正量
    expect(run.dims).toEqual(dimsOf(50, 51, 47, 57));
    expect(run.stageIndex).toBe(0);
    expect(run.history).toEqual([]);
    expect(run.flags).toEqual([]);
    expect(run.seed).toBe(2026);
    expect(run.env).toEqual(ENV);
    expect(run.birthYear).toBe(deriveBirth(ENV, 2026).birthYear);
    expect(run.profile).toEqual(deriveBirth(ENV, 2026).profile);
  });

  it("v3 状态层初始值：三观 50 中位 / 资源 60 / 线进度 0；v4 家庭生成器在册（02 §三 ▸ M1'''）", () => {
    const run = createRun(ENV, 2026);
    expect(run.values3).toEqual({ worldview: 50, outlook: 50, values: 50 });
    expect(run.resources).toEqual({ mood: 60, money: 60, health: 60 });
    expect(run.lines).toEqual({ study: 0, career: 0, love: 0, friend: 0, health: 0 });
    expect(run.npcs).toEqual(generateFamily(run.env, run.birthYear, run.profile, 2026));
    const ids = run.npcs.map((n) => n.id);
    expect(ids).toContain("mother");
    expect(ids).toContain("father");
    for (const n of run.npcs) expect(n.name, `${n.id} 应有本局姓名`).toBeTruthy();
  });

  it("两次 createRun 状态独立，无共享引用", () => {
    const a = createRun(ENV, 1);
    const b = createRun(ENV, 1);
    a.dims.ei = 99;
    a.values3.values = 99;
    a.history.push({ eventId: "x", option: 0, dimsAfter: a.dims });
    expect(b.dims.ei).toBe(50);
    expect(b.values3.values).toBe(50);
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

describe("applyChoice（v3 传导链：选项 → 三观 → 派生四维 + 资源/线进度）", () => {
  it("infant-011 o0（outlook −3）：派生 ei+1/jp+1，三观与资源同步入账", () => {
    const after = applyChoice(createRun(ENV, 7), 0);
    // 待答 = 开卷窗口最早档 infant-011（3个月）；seed7 初始 {ei:55,sn:50,tf:50,jp:51}；o0 deltas3 {outlook:-3}
    expect(after.dims).toEqual(dimsOf(56, 50, 50, 52));
    expect(after.values3).toEqual({ worldview: 50, outlook: 47, values: 50 });
    expect(after.resources).toEqual({ mood: 59, money: 60, health: 60 });
    expect(after.history).toHaveLength(1);
    expect(after.history[0]).toMatchObject({ eventId: "infant-011", option: 0 });
    expect(after.history[0]!.dimsAfter).toEqual(after.dims);
  });

  it("infant-011 o1（worldview+3/outlook+3）：sn+1 与 ei−1/jp−1 同算（方向表 02 §二）", () => {
    const after = applyChoice(createRun(ENV, 7), 1);
    expect(after.dims).toEqual(dimsOf(54, 51, 50, 50));
    expect(after.values3).toEqual({ worldview: 53, outlook: 53, values: 50 });
  });

  it("小增量只动三观不动性格：round(0.4×1)=0（性格是慢变量）", () => {
    const after = applyChoice(createRun(ENV, 7), 2);
    // o2 {worldview:2} → sn+1，且偏移键零值不落盘（dimsOffsetOf 不产生 0 值键）
    expect(after.dims).toEqual(dimsOf(55, 51, 50, 51));
    expect(after.values3).toEqual({ worldview: 52, outlook: 50, values: 50 });
  });

  it("钳制上界：跨 100 的派生偏移停在 100", () => {
    const state: RunState = {
      ...createRun(ENV, 7),
      stageIndex: 7,
      dims: dimsOf(99, 50, 100, 50),
      history: historyOf((e) => e.stage === "elder" && e.type !== "critical"),
    };
    // 待答 = elder-002（库序首个 critical）；o0 派生 ei+3/tf+1/jp+3
    const after = applyChoice(state, 0);
    expect(after.dims).toEqual(dimsOf(100, 50, 100, 53));
  });

  it("钳制下界：跌破 0 的派生偏移停在 0", () => {
    const state: RunState = {
      ...createRun(ENV, 7),
      stageIndex: 7,
      dims: dimsOf(0, 50, 0, 50),
      history: historyOf((e) => e.stage === "elder" && e.type !== "critical"),
    };
    // o2 {outlook:2, worldview:1} → 派生 ei−1/jp−1（sn 偏移 round(0.4)=0 不动）
    const after = applyChoice(state, 2);
    expect(after.dims).toEqual(dimsOf(0, 50, 0, 49));
  });

  it("flag 去重：已持有的 flag 不重复入列", () => {
    const state: RunState = {
      ...createRun(ENV, 7),
      stageIndex: 3,
      // 只消费 teen-002（174）及之前的月龄段：floor 单调语义下目标事件仍待答
      history: historyOf((e) => e.stage === "teen" && e.ageMonths <= 174 && e.id !== "teen-002"),
      flags: ["rebel"],
    };
    // 待答事件 = teen-002（pre: rebel 已满足）；选项 1 带 flag rebel
    const after = applyChoice(state, 1);
    expect(after.flags).toEqual(["rebel"]);
  });

  it("history.dimsAfter 是快照，后续演化不回写", () => {
    const after = applyChoice(createRun(ENV, 7), 0);
    const snap = after.history[0]!.dimsAfter.ei;
    after.dims.ei = 0;
    expect(after.history[0]!.dimsAfter.ei).toBe(snap);
  });

  it("支线选项推进线进度：infant-201 o0 → career +8；fate 不入账", () => {
    const run = createRun(ENV, 7);
    const afterLine = applyChoice(run, 0);
    expect(afterLine.lines.career).toBe(0); // 开卷窗口是 fate context，线不动
    // 顶到 infant-201（career 18 月龄档，轮转使其先于同档 fate 事件出牌）
    let state = run;
    for (let i = 0; i < 12 && pickEvent(state)!.id !== "infant-201"; i++) {
      state = applyChoice(state, 0);
    }
    expect(pickEvent(state)!.id).toBe("infant-201");
    const after = applyChoice(state, 0);
    expect(after.lines.career).toBe(8);
  });

  it("requires 资源门槛：不达标被拒、达标放行（youth-203 o0 需 money ≥ 30）", () => {
    const state: RunState = {
      ...createRun(ENV, 7),
      stageIndex: 4,
      history: historyOf(
        (e) => e.stage === "youth" && (e.ageMonths < 348 || ["youth-301", "youth-017"].includes(e.id)) && e.id !== "youth-203",
      ),
      // money 25：< 30 锁定 o0，同时 ≥ 25 不触发 money rescue（隔离用例）
      resources: { mood: 60, money: 25, health: 60 },
      lines: { study: 0, career: 60, love: 0, friend: 0, health: 0 },
    };
    const event = pickEvent(state)!;
    expect(event.id).toBe("youth-203");
    expect(optionAvailable(state, event, 0)).toBe(false);
    expect(() => applyChoice(state, 0)).toThrow(/锁定/);
    expect(optionAvailable(state, event, 1)).toBe(true);
    const rich = { ...state, resources: { mood: 60, money: 30, health: 60 } };
    expect(optionAvailable(rich, event, 0)).toBe(true);
    expect(() => applyChoice(rich, 0)).not.toThrow();
  });

  it("选项越界抛错", () => {
    const fresh = createRun(ENV, 7);
    expect(() => applyChoice(fresh, 3)).toThrow(/选项越界/);
    expect(() => applyChoice(fresh, -1)).toThrow(/选项越界/);
  });
});

describe("pickEvent（v3 单调调度：开卷窗口 + 锚点 + 轮转 + critical 收束）", () => {
  it("阶段首抽 = 开卷窗口最早月龄档（infant 3个月）", () => {
    expect(pickEvent(createRun(ENV, 7))!.id).toBe("infant-011");
  });

  it("全程逐条走通 infant：任意抽取序列 ageMonths 不减、critical 最后、耗尽返回 null", () => {
    let state = createRun(ENV, 7);
    const sequence: string[] = [];
    let lastAge = -1;
    for (;;) {
      const ev = pickEvent(state);
      if (!ev) break;
      expect(ev.ageMonths, `${ev.id} 月龄回退`).toBeGreaterThanOrEqual(lastAge);
      lastAge = ev.ageMonths;
      sequence.push(`${ev.id}(${ev.ageMonths})`);
      state = applyChoice(state, 0);
    }
    // v5：偶遇层（encounter）不入 pickEvent 候选池（plan/v5/02 §二，由 encounterFor 单独注入）
    const infantIds = EVENTS.filter((e) => e.stage === "infant" && e.type !== "encounter").map((e) => e.id).sort();
    const consumed = sequence.map((s) => s.split("(")[0]).sort();
    expect(consumed).toEqual(infantIds);
    const criticals = sequence.filter((s) => s.startsWith("infant-02"));
    expect(criticals).toHaveLength(2);
    expect(sequence.indexOf(criticals[0]!)).toBeGreaterThan(sequence.length - 3);
    state = advanceStage(state);
    expect(pickEvent(state)!.stage).toBe("toddler");
  });

  it("pre 不满足的事件被过滤（teen-002 需要 rebel）", () => {
    // 消费 teen 中 <204 月龄段与同档他者（teen-016/017）：floor 单调语义下 teen-002 唯一待答
    const noRebel: RunState = {
      ...createRun(ENV, 7),
      stageIndex: 3,
      history: historyOf(
        (e) => e.stage === "teen" && (e.ageMonths < 204 || ["teen-006", "teen-016", "teen-017"].includes(e.id)) && e.id !== "teen-002",
      ),
      flags: [],
      lines: { study: 0, career: 0, love: 0, friend: 0, health: 0 },
    };
    // teen-002（pre rebel）被过滤 → 待答 = 月龄最小的 fate critical（teen-003/022 同 216，库序先行）
    expect(pickEvent(noRebel)!.id).toBe("teen-003");
    const withRebel = { ...noRebel, flags: ["rebel"] };
    expect(pickEvent(withRebel)!.id).toBe("teen-002");
  });

  it("支线 critical 按线进度解锁（阈值 60，v3/02 §四）", () => {
    const withStudyCritical = historyOf(
      (e) => e.stage === "teen" && (e.ageMonths < 205 || e.id === "teen-203") && e.id !== "teen-103",
    );
    const locked: RunState = {
      ...createRun(ENV, 7),
      history: withStudyCritical,
      stageIndex: 3,
      flags: [],
      lines: { study: 40, career: 60, love: 0, friend: 0, health: 0 },
    };
    // study 40 < 60：teen-103 不入候选，待答 = 库序首个 fate critical（teen-003，216 档库序先行）
    expect(pickEvent(locked)!.id).toBe("teen-003");
    const unlocked: RunState = { ...locked, lines: { study: 60, career: 60, love: 0, friend: 0, health: 0 } };
    // 解锁后 teen-103（205 月龄档）早于 fate critical（216）出牌
    expect(pickEvent(unlocked)!.id).toBe("teen-103");
  });

  it("rescue 事件只在资源低值时入候选（<25 触发，v3/02 §三）", () => {
    const base = historyOf(
      (e) => e.stage === "youth" && e.ageMonths <= 314 && e.id !== "youth-301" && e.type !== "critical",
    );
    const healthy: RunState = {
      ...createRun(ENV, 7),
      stageIndex: 4,
      history: base,
      resources: { mood: 60, money: 60, health: 60 },
    };
    // money 60：youth-301 不入候选，待答 = 314 档之后的普通事件
    const picked = pickEvent(healthy)!;
    expect(picked.type).not.toBe("rescue");
    const broke: RunState = { ...healthy, resources: { mood: 60, money: 24, health: 60 } };
    // money 24 < 25：rescue 进池，314 档先于剩余普通事件出牌，全程仍单调
    const seq: string[] = [];
    let state = broke;
    let lastAge = -1;
    for (;;) {
      const ev = pickEvent(state);
      if (!ev) break;
      expect(ev.ageMonths).toBeGreaterThanOrEqual(lastAge);
      lastAge = ev.ageMonths;
      seq.push(ev.id);
      state = applyChoice(state, 0);
    }
    expect(seq).toContain("youth-301");
    void picked;
  });

  it("同状态重复调用幂等；终局后返回 null", () => {
    const state = applyChoice(createRun(ENV, 7), 0);
    expect(pickEvent(state)!.id).toBe(pickEvent(state)!.id);
    const finished: RunState = { ...state, stageIndex: STAGES.length };
    expect(pickEvent(finished)).toBeNull();
  });
});

describe("advanceStage（离开阶段时结算：三观漂移 + 资源自然结算）", () => {
  it("逐阶段推进，elder 推进后进入终局（stageIndex = 8）", () => {
    let state = createRun(ENV, 7);
    expect(state.stageIndex).toBe(0);
    state = advanceStage(state);
    expect(state.stageIndex).toBe(1);
    const last: RunState = { ...state, stageIndex: 7 };
    expect(advanceStage(last).stageIndex).toBe(STAGES.length);
  });

  it("infant 结算：漂移 values+1（stage-drift）；心境 −5、积蓄按 career 0 → −4、健康 0", () => {
    const state = createRun(ENV, 7);
    const next = advanceStage(state);
    expect(next.values3).toEqual({ worldview: 50, outlook: 50, values: 51 });
    expect(next.resources).toEqual({ mood: 55, money: 56, health: 60 });
    expect(next.stageIndex).toBe(1);
  });

  it("elder 结算：健康衰减 −6；career 线高时积蓄转正（+1）", () => {
    const state: RunState = {
      ...createRun(ENV, 7),
      stageIndex: 7,
      lines: { study: 0, career: 100, love: 0, friend: 0, health: 0 },
    };
    const next = advanceStage(state);
    expect(next.resources.health).toBe(54);
    expect(next.resources.money).toBe(61);
    expect(next.stageIndex).toBe(STAGES.length);
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
    expect(resolveEnding({ ...base, dims: dimsOf(60, 60, 40, 60) }).id).toBe("end-02");
    expect(resolveEnding({ ...base, dims: dimsOf(60, 60, 60, 60) }).id).toBe("end-06");
  });

  it("end-03 必含 wanderlust：缺 flag 落兜底，有 flag 命中", () => {
    const base: RunState = { ...createRun(ENV, 7), dims: dimsOf(40, 40, 60, 40) };
    expect(resolveEnding({ ...base, flags: [] }).id).toBe("end-fallback");
    expect(resolveEnding({ ...base, flags: ["wanderlust"] }).id).toBe("end-03");
  });

  it("end-04 必含 rebel 且禁含 conform", () => {
    const base: RunState = { ...createRun(ENV, 7), dims: dimsOf(40, 40, 40, 40) };
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
  // v4：画像第三参 = createRun 同 seed 派生（确定性，初始四维含八因素合成）
  const PROFILE = createRun(ENV, 7).profile;
  const PROFILE_LOW = createRun(ENV_LOW_EI, 7).profile;

  it("高于 50 取高侧字母，低于 50 取低侧字母", () => {
    expect(mbtiLetters(dimsOf(60, 40, 70, 30), ENV, PROFILE)).toBe("ENFP");
    expect(mbtiLetters(dimsOf(40, 60, 30, 70), ENV, PROFILE)).toBe("ISTJ");
  });

  it("当前值恰为 50 时按出生初始值符号裁定", () => {
    // ENV + seed7 画像实测初始 {ei:55, sn:50, tf:50, jp:51}：ei/jp 的 50 依初始符号取高侧；sn/tf 初始恰 50 取低侧（sn→N、tf→T）
    expect(mbtiLetters(dimsOf(50, 50, 50, 50), ENV, PROFILE)).toBe("ENTJ");
    // ENV_LOW_EI + seed7 画像实测初始 {ei:50, sn:53, tf:49, jp:54}：ei 初始 50 无符号取低侧 I
    expect(mbtiLetters(dimsOf(50, 50, 50, 50), ENV_LOW_EI, PROFILE_LOW)).toBe("ISTJ");
  });

  it("混合情形：实测初始值的当值为 {60,40,50,30}", () => {
    expect(mbtiLetters(dimsOf(60, 40, 50, 30), ENV, PROFILE)).toBe("ENTP");
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
      expect(mbtiLetters(state.dims, state.env, state.profile), `${ending.id} 字母不符`).toBe(ending.typeText);
    }
  });
});

describe("applyCustomChoice（自定义第 4 槽，v3/02 §七 ▸ M3'' 增补）", () => {
  it("归一选项直入状态机：bondDeltas 入册 / history 记第 4 槽位 / 数值走同一结算链", () => {
    const state0 = createRun(ENV, 42);
    const option = {
      text: "自定义行动",
      deltas3: { values: 2 },
      resourceDeltas: { mood: 3 },
      bondDeltas: { bestie: 12 },
    };
    const next = applyCustomChoice(state0, option);
    const last = next.history[next.history.length - 1]!;
    const event = EVENTS.find((e) => e.id === last.eventId)!;
    expect(last.option).toBe(event.options.length); // 第 4 槽位约定
    expect(next.npcs.find((n) => n.id === "bestie")).toEqual({ id: "bestie", bond: 62, tag: "亲密" });
    expect(next.values3.values).toBe(52);
    expect(next.resources.mood).toBe(63);
    expect(next.npcs.length).toBe(state0.npcs.length + 1);
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
      if (!event) {
        state = advanceStage(state);
        states.push(state);
        continue;
      }
      // 首选被资源门槛锁定时回退到首个可用项（确定性不变：同 seed 同回退路径）
      const pref = choose(state);
      const idx = optionAvailable(state, event, pref)
        ? pref
        : event.options.findIndex((_, i) => optionAvailable(state, event, i));
      state = applyChoice(state, idx);
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
    for (const axis of ["worldview", "outlook", "values"] as const) {
      expect(final.values3[axis]).toBeGreaterThanOrEqual(0);
      expect(final.values3[axis]).toBeLessThanOrEqual(100);
    }
    for (const res of ["mood", "money", "health"] as const) {
      expect(final.resources[res]).toBeGreaterThanOrEqual(0);
      expect(final.resources[res]).toBeLessThanOrEqual(100);
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

  it("全选项驱动跑通后 NPC 已入册（bondDeltas 链路防回退：settleChoice 必须携带 npcs）", () => {
    // 回归锚：settleChoice 返回对象曾漏 npcs 字段 → 支线消费 117 条仍只有父母（E2E 未拦住，单测必红）
    for (const seed of [2026, 42]) {
      const trace = fullTrace(seed, chooseFirst);
      const final = trace[trace.length - 1]!;
      expect(final.npcs.length, `seed=${seed}`).toBeGreaterThan(2);
      for (const npc of final.npcs) {
        expect(npc.bond).toBeGreaterThanOrEqual(0);
        expect(npc.bond).toBeLessThanOrEqual(100);
      }
    }
  });
});
