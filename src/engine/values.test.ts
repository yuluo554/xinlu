// 三观传导核心单测（v3-M1'' 1.2 · 评审门三方一致锚点：plan/v3/02 §二 ▸ M1'' 增补方向表）。
// 防回退：回滚/改坏 dimsOffsetOf 方向表、stageDrift、结算系数 → 本文件必红。
import { describe, expect, it } from "vitest";
import stageDriftRaw from "../data/stage-drift.json";
import {
  applyLineGain,
  applyResources,
  applyValues,
  deriveDims,
  dimsOffsetOf,
  lineCriticalUnlocked,
  lineGainOf,
  lineStateOf,
  monologueBand,
  monologueOf,
  rescueOpen,
  settleDeltas,
  stageDrift,
} from "./values";
import { createRun } from "./engine";
import type { Deltas3, Dims, LineProgress, LineKey, Resources, RunState, Values3 } from "./model";

const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };

describe("dimsOffsetOf（方向表唯一实现，02 §二 ▸ M1'' 增补）", () => {
  it("worldview +3 → sn +1（向感应/S）；worldview −3 → sn −1（向理性/N）", () => {
    expect(dimsOffsetOf({ worldview: 3 })).toEqual({ sn: 1 });
    expect(dimsOffsetOf({ worldview: -3 })).toEqual({ sn: -1 });
  });

  it("outlook +3（安然）→ ei −1/jp −1（向 I/P）；outlook −3（进取）→ ei +1/jp +1", () => {
    expect(dimsOffsetOf({ outlook: 3 })).toEqual({ ei: -1, jp: -1 });
    expect(dimsOffsetOf({ outlook: -3 })).toEqual({ ei: 1, jp: 1 });
  });

  it("values +3（共情）→ tf +1（向 F）；values −3（原则）→ tf −1（向 T）", () => {
    expect(dimsOffsetOf({ values: 3 })).toEqual({ tf: 1 });
    expect(dimsOffsetOf({ values: -3 })).toEqual({ tf: -1 });
  });

  it("critical 量级：+8 → round(3.2)=3", () => {
    expect(dimsOffsetOf({ outlook: -8 })).toEqual({ ei: 3, jp: 3 });
    expect(dimsOffsetOf({ worldview: 8 })).toEqual({ sn: 3 });
  });

  it("小增量不动性格：round(0.4×1)=0（纯三观微动）", () => {
    expect(dimsOffsetOf({ worldview: 1 })).toEqual({});
    expect(dimsOffsetOf({ outlook: 1 })).toEqual({});
    expect(dimsOffsetOf({ values: -1 })).toEqual({});
  });

  it("零增量/空对象 → 无偏移；结果无 -0（存档序列化与 toEqual 安全）", () => {
    expect(dimsOffsetOf({})).toEqual({});
    const off = dimsOffsetOf({ worldview: 1, outlook: 1, values: 1 });
    for (const v of Object.values(off)) expect(Object.is(v, -0)).toBe(false);
  });

  it("多轴合成：增量逐轴叠加（infant-011 o1 形状）", () => {
    expect(dimsOffsetOf({ worldview: 3, outlook: 3 })).toEqual({ sn: 1, ei: -1, jp: -1 });
  });
});

describe("deriveDims（状态级投影：values3−50 过同一方向表 + 极点钳制）", () => {
  it("中性三观（全 50）→ 无隐含倾向", () => {
    const values3: Values3 = { worldview: 50, outlook: 50, values: 50 };
    expect(deriveDims(values3, { ei: 50, sn: 50, tf: 50, jp: 50 }, "fate")).toEqual({});
  });

  it("感应世界观（80）→ sn 隐含 +12（0.4×30）", () => {
    const values3: Values3 = { worldview: 80, outlook: 50, values: 50 };
    expect(deriveDims(values3, { ei: 50, sn: 50, tf: 50, jp: 50 }, "fate")).toEqual({ sn: 12 });
  });

  it("极点钳制：sn 已 95 时不越 100（隐含 +12 → 剩余空间 5）", () => {
    const values3: Values3 = { worldview: 80, outlook: 50, values: 50 };
    const dims: Dims = { ei: 50, sn: 95, tf: 50, jp: 50 };
    expect(deriveDims(values3, dims, "fate")).toEqual({ sn: 5 });
  });

  it("line 形参 v3-M1'' 为预留位：任意线别结果一致", () => {
    const values3: Values3 = { worldview: 80, outlook: 20, values: 80 };
    const dims: Dims = { ei: 50, sn: 50, tf: 50, jp: 50 };
    for (const line of ["fate", "study", "career", "love", "friend", "health"] as LineKey[]) {
      expect(deriveDims(values3, dims, line)).toEqual({ sn: 12, ei: 12, jp: 12, tf: 12 });
    }
  });
});

describe("applyValues（三观主效应入账 + 钳制 [0,100]）", () => {
  it("增量入账且不改入参状态", () => {
    const state = createRun(ENV, 7);
    const after = applyValues(state, { worldview: 5, values: -10 });
    expect(after.values3).toEqual({ worldview: 55, outlook: 50, values: 40 });
    expect(state.values3).toEqual({ worldview: 50, outlook: 50, values: 50 });
  });

  it("钳制上界 100 / 下界 0；零增量轴不动", () => {
    const state = { ...createRun(ENV, 7), values3: { worldview: 98, outlook: 2, values: 50 } };
    const after = applyValues(state, { worldview: 5, outlook: -5 });
    expect(after.values3).toEqual({ worldview: 100, outlook: 0, values: 50 });
  });
});

describe("applyResources / settleDeltas（02 §三 ▸ M1'' 增补系数表）", () => {
  it("资源增损入账 + 钳制 [0,100]", () => {
    const state = { ...createRun(ENV, 7), resources: { mood: 95, money: 5, health: 50 } as Resources };
    const after = applyResources(state, { mood: 10, money: -10 });
    expect(after.resources).toEqual({ mood: 100, money: 0, health: 50 });
  });

  it("阶段结算系数：心境 −5 恒定；健康按年龄段 0/1/2/4/6；积蓄 = floor(career/20) − 4", () => {
    const lines: LineProgress = { study: 0, career: 0, love: 0, friend: 0, health: 0 };
    expect(settleDeltas("infant", lines)).toEqual({ mood: -5, health: 0, money: -4 });
    expect(settleDeltas("youth", lines).health).toBe(-1);
    expect(settleDeltas("midlife", lines).health).toBe(-4);
    expect(settleDeltas("elder", lines).health).toBe(-6);
    expect(settleDeltas("adult", { study: 0, career: 45, love: 0, friend: 0, health: 0 }).money).toBe(-2);
    expect(settleDeltas("adult", { study: 0, career: 80, love: 0, friend: 0, health: 0 }).money).toBe(0);
  });
});

describe("stageDrift（非选项漂移，02 §二：每阶段 ≤2/轴）", () => {
  const DRIFT = stageDriftRaw as unknown as Record<string, Record<string, number>>;

  it("infant 漂移 values+1；youth 漂移 outlook−2", () => {
    const infant: RunState = { ...createRun(ENV, 7), stageIndex: 0 };
    expect(stageDrift(infant)).toEqual({ values: 1 });
    const youth: RunState = { ...createRun(ENV, 7), stageIndex: 4 };
    expect(stageDrift(youth)).toEqual({ outlook: -2, worldview: -1, values: -1 });
  });

  it("漂移表全部 |值| ≤2（数据契约）", () => {
    for (const stage of Object.keys(DRIFT)) {
      if (stage === "_meta") continue;
      for (const axis of ["worldview", "outlook", "values"]) {
        expect(Math.abs(DRIFT[stage]![axis] ?? 0), `${stage}.${axis}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it("终局态（stageIndex 越界）安全返回空漂移", () => {
    const done: RunState = { ...createRun(ENV, 7), stageIndex: 8 };
    expect(stageDrift(done)).toEqual({});
  });
});

describe("rescueOpen（低值分支 <25，02 §三）", () => {
  it("24 触发 / 25 不触发", () => {
    const state = { ...createRun(ENV, 7), resources: { mood: 60, money: 24, health: 60 } as Resources };
    expect(rescueOpen(state, "money")).toBe(true);
    expect(rescueOpen(state, "mood")).toBe(false);
    expect(rescueOpen({ ...state, resources: { ...state.resources, money: 25 } }, "money")).toBe(false);
  });
});

describe("线进度（lineGainOf / applyLineGain / lineCriticalUnlocked / lineStateOf）", () => {
  it("增益缺省：context 8 / critical 15 / rescue 0 / fate 0；lineGain 字段覆盖", () => {
    expect(lineGainOf("study", "context")).toBe(8);
    expect(lineGainOf("career", "critical")).toBe(15);
    expect(lineGainOf("career", "rescue")).toBe(0);
    expect(lineGainOf("fate", "critical")).toBe(0);
    expect(lineGainOf("study", "context", 20)).toBe(20);
  });

  it("applyLineGain 钳制 [0,100]；fate/零增益原样返回", () => {
    const lines: LineProgress = { study: 95, career: 3, love: 0, friend: 0, health: 0 };
    expect(applyLineGain(lines, "study", 8)).toEqual({ study: 100, career: 3, love: 0, friend: 0, health: 0 });
    expect(applyLineGain(lines, "career", 0)).toBe(lines);
    expect(applyLineGain(lines, "fate", 8)).toBe(lines);
  });

  it("支线 critical 解锁阈值 60", () => {
    const lines: LineProgress = { study: 59, career: 60, love: 0, friend: 0, health: 0 };
    expect(lineCriticalUnlocked(lines, "study")).toBe(false);
    expect(lineCriticalUnlocked(lines, "career")).toBe(true);
    expect(lineCriticalUnlocked(lines, "fate")).toBe(true);
  });

  it("线终态映射：0 未启 / 1–29 中断 / 30–79 平顺 / ≥80 圆满", () => {
    expect(lineStateOf(0)).toBe("未启");
    expect(lineStateOf(1)).toBe("中断");
    expect(lineStateOf(29)).toBe("中断");
    expect(lineStateOf(30)).toBe("平顺");
    expect(lineStateOf(79)).toBe("平顺");
    expect(lineStateOf(80)).toBe("圆满");
  });
});

describe("monologueOf / monologueBand（02 §二：区间 <35 / 35–65 / >65）", () => {
  it("区间判定", () => {
    expect(monologueBand(34)).toBe("low");
    expect(monologueBand(35)).toBe("mid");
    expect(monologueBand(65)).toBe("mid");
    expect(monologueBand(66)).toBe("high");
  });

  it("三轴独白齐全且非空（9 条）", () => {
    const low = monologueOf({ worldview: 20, outlook: 20, values: 20 });
    const mid = monologueOf({ worldview: 50, outlook: 50, values: 50 });
    const high = monologueOf({ worldview: 80, outlook: 80, values: 80 });
    for (const m of [low, mid, high]) {
      for (const axis of ["worldview", "outlook", "values"] as const) {
        expect(m[axis].length).toBeGreaterThan(0);
      }
    }
    expect(low.worldview).not.toBe(mid.worldview);
    expect(mid.worldview).not.toBe(high.worldview);
  });
});

// ── v3-M3'' 3.1 NPC 关系层（02 §五 ▸ M3'' 增补：衰减 0.5 / tag 阈值 / 钳制）──
import { NPC_SPAWN_BOND, applyBonds, bondGainOf, tagOfBond } from "./values";

describe("bondGainOf（values 轴增益衰减，系数 0.5）", () => {
  it("values=50 中性基全额入账", () => {
    expect(bondGainOf(10, 50)).toBe(10);
    expect(bondGainOf(-15, 50)).toBe(-15);
  });

  it("values 极值衰减至一半：round(Δ×0.5)", () => {
    expect(bondGainOf(15, 100)).toBe(8);
    expect(bondGainOf(15, 0)).toBe(8);
    expect(bondGainOf(-15, 100)).toBe(-8);
  });

  it("中段线性：values=60 → ×0.9", () => {
    expect(bondGainOf(10, 60)).toBe(9);
  });
});

describe("tagOfBond（tag 翻转阈值）", () => {
  it("阈值边界四态", () => {
    expect(tagOfBond(0)).toBe("决裂");
    expect(tagOfBond(29)).toBe("决裂");
    expect(tagOfBond(30)).toBe("疏离");
    expect(tagOfBond(59)).toBe("疏离");
    expect(tagOfBond(60)).toBe("亲密");
    expect(tagOfBond(89)).toBe("亲密");
    expect(tagOfBond(90)).toBe("羁绊");
    expect(tagOfBond(100)).toBe("羁绊");
  });
});

describe("applyBonds（入册 / 衰减 / 钳制 / 重 tag）", () => {
  it("未在册 NPC 以中位 50 入册后应用增量（中性基无衰减）", () => {
    const state = createRun(ENV, 42);
    const next = applyBonds(state, { partner: 12 });
    const npc = next.npcs.find((n) => n.id === "partner");
    expect(next.npcs.length).toBe(state.npcs.length + 1);
    expect(npc?.bond).toBe(NPC_SPAWN_BOND + 12);
    expect(npc?.tag).toBe("亲密");
  });

  it("已入册 NPC 增量按当前 values 轴衰减（values=100 → 减半）", () => {
    const state = { ...createRun(ENV, 42), values3: { worldview: 50, outlook: 50, values: 100 } };
    const next = applyBonds(state, { mother: 15 });
    // v4：和睦×权威 派生表初始 bond 72（v4/02 §三 ▸ M1''' 增补），衰减后 15×0.5 → 72+8
    expect(next.npcs.find((n) => n.id === "mother")?.bond).toBe(72 + 8);
  });

  it("bond 钳制 [0,100]；tag 随钳制翻转", () => {
    const base = createRun(ENV, 42);
    const high = applyBonds(base, { mother: 100 });
    expect(high.npcs.find((n) => n.id === "mother")?.bond).toBe(100);
    expect(high.npcs.find((n) => n.id === "mother")?.tag).toBe("羁绊");
    const low = applyBonds(base, { mother: -200 });
    expect(low.npcs.find((n) => n.id === "mother")?.bond).toBe(0);
    expect(low.npcs.find((n) => n.id === "mother")?.tag).toBe("决裂");
  });

  it("空表 → 原状态返回；应用增量不改入参", () => {
    const state = createRun(ENV, 42);
    expect(applyBonds(state, {})).toBe(state);
    const before = JSON.stringify(state.npcs);
    applyBonds(state, { mother: 15 });
    expect(JSON.stringify(state.npcs)).toBe(before);
  });
});
