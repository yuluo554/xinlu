// 轻量线索单测（plan/v5/02 §十 D10）：判定零随机 + flag 单源 + 每阶段 ≤1 + 解锁事件真的受 flag 控制。
// 判据面 = 数据（clues.json）与引擎（clues.ts）的一致性；文案长度与事件引用归 validate C 区。
import { describe, expect, it } from "vitest";
import eventsRaw from "../data/events.json" with { type: "json" };
import { createRun, pickEvent, applyChoice, advanceStage, optionAvailable } from "../engine/engine";
import type { GameEvent, RunState } from "../engine/model";
import {
  CLUES,
  CLUE_FLAGS,
  clueById,
  cluesUsedInStage,
  isResolved,
  pendingClue,
  resolveClue,
  unlockEventIdOf,
} from "../engine/clues";

const EVENTS = eventsRaw as unknown as GameEvent[];
const ENV = { era: "80s", place: "小城", mood: "和睦", style: "宽容" };
const dimsAfter = { ei: 50, sn: 50, tf: 50, jp: 50 };

function baseRun(): RunState {
  // birthYear 必须与 era 同段（createRun 硬校验）：80s ↔ 1980
  return createRun(ENV, 4242, { birthYear: 1980, profile: { region: "南方", structure: "独生", parentsJob: "工人", wealth: "一般" } });
}

/** 直接构造「锚事件已作答」的 state（不必真跑一遍人生——判定只看 history/flags/stageIndex）。 */
function withAnchor(clueId: string, extra: Partial<RunState> = {}): RunState {
  const clue = clueById(clueId)!;
  const stageOrder = ["infant", "toddler", "childhood", "teen", "youth", "adult", "midlife", "elder"];
  return {
    ...baseRun(),
    stageIndex: stageOrder.indexOf(clue.stage),
    history: [{ eventId: clue.anchorEventId, option: 0, dimsAfter }],
    ...extra,
  };
}

describe("线索数据面（clues.json）", () => {
  it("六阶段各一条（每阶段 ≤1 处），共 6 条", () => {
    expect(CLUES).toHaveLength(6);
    const stages = CLUES.map((c) => c.stage);
    expect(new Set(stages).size).toBe(stages.length);
    expect(stages).toEqual(["childhood", "teen", "youth", "adult", "midlife", "elder"]);
  });

  it("每条两条解读、两个不同 flag；flag 全库唯一且都在 CLUE_FLAGS 里", () => {
    expect(CLUE_FLAGS).toHaveLength(12);
    expect(new Set(CLUE_FLAGS).size).toBe(12);
    for (const clue of CLUES) {
      expect(clue.choices).toHaveLength(2);
      const [a, b] = clue.choices;
      expect(a!.flag).not.toBe(b!.flag);
      expect(CLUE_FLAGS).toContain(a!.flag);
      expect(CLUE_FLAGS).toContain(b!.flag);
    }
  });

  it("锚定事件与两条解锁事件都真实存在，且解锁事件的 pre 含对应 flag", () => {
    const byId = new Map(EVENTS.map((e) => [e.id, e]));
    for (const clue of CLUES) {
      expect(byId.has(clue.anchorEventId), `${clue.id} 锚事件不存在`).toBe(true);
      clue.unlockEventIds.forEach((uid, i) => {
        const target = byId.get(uid);
        expect(target, `${clue.id} 解锁事件 ${uid} 不存在`).toBeTruthy();
        expect(target!.pre, `${uid} 的 pre 缺 ${clue.choices[i]!.flag}`).toContain(clue.choices[i]!.flag);
      });
    }
  });
});

describe("pendingClue（纯 flag / history 判定，零随机）", () => {
  it("锚事件未作答 → 无线索；作答后 → 该线索出现", () => {
    const before = { ...baseRun(), stageIndex: 2, history: [] };
    expect(pendingClue(before)).toBeNull();
    expect(pendingClue(withAnchor("clue-childhood-01"))?.id).toBe("clue-childhood-01");
  });

  it("落定后不再出现（同一条线索只出一次）", () => {
    const resolved = withAnchor("clue-childhood-01", { flags: ["clue-note-liked"] });
    expect(isResolved(resolved, clueById("clue-childhood-01")!)).toBe(true);
    expect(pendingClue(resolved)).toBeNull();
  });

  it("阶段不符不出（线索不跨阶段补播）", () => {
    const wrongStage = withAnchor("clue-childhood-01", { stageIndex: 3 });
    expect(pendingClue(wrongStage)).toBeNull();
  });

  it("同状态多次调用恒同结果（可复现，不掷骰）", () => {
    const s = withAnchor("clue-teen-01");
    expect(pendingClue(s)?.id).toBe(pendingClue(s)?.id);
    const unresolved = CLUES.map(() => pendingClue(s)?.id);
    expect(new Set(unresolved).size).toBe(1);
  });

  it("时代卡条目不算「作答」（kind:era 跳过）", () => {
    const eraOnly: RunState = {
      ...baseRun(),
      stageIndex: 2,
      history: [{ eventId: "clue-childhood-01", option: -1, dimsAfter, kind: "era" }],
    };
    // 造一个 era 条目指向锚事件 id：仍不应算作答
    expect(pendingClue(eraOnly)).toBeNull();
  });
});

describe("resolveClue（只写 flag，不动判定核）", () => {
  it("写入所选解读的 flag，且不改三观/资源/历史/线进度", () => {
    const s = withAnchor("clue-childhood-01");
    const next = resolveClue(s, "clue-childhood-01", 0);
    expect(next.flags).toEqual(["clue-note-liked"]);
    expect(next.values3).toEqual(s.values3);
    expect(next.resources).toEqual(s.resources);
    expect(next.lines).toEqual(s.lines);
    expect(next.history).toEqual(s.history);
    expect(next.dims).toEqual(s.dims);
    expect(next.npcs).toEqual(s.npcs);
  });

  it("选第二条解读写另一个 flag；重复落定幂等（不重复入册）", () => {
    const s = withAnchor("clue-childhood-01");
    const once = resolveClue(s, "clue-childhood-01", 1);
    expect(once.flags).toEqual(["clue-note-casual"]);
    expect(resolveClue(once, "clue-childhood-01", 1)).toBe(once);
  });

  it("未知线索 / 越界解读抛错（UI 传参错误不静默）", () => {
    const s = withAnchor("clue-childhood-01");
    expect(() => resolveClue(s, "clue-nope", 0)).toThrow(/未知线索/);
    expect(() => resolveClue(s, "clue-childhood-01", 9)).toThrow(/越界/);
  });

  it("落定后 unlockEventIdOf 指向所选解读对应的那条事件", () => {
    const clue = clueById("clue-childhood-01")!;
    const s = withAnchor("clue-childhood-01");
    expect(unlockEventIdOf(s, clue)).toBeNull(); // 未表态 → 无解锁
    expect(unlockEventIdOf(resolveClue(s, clue.id, 0), clue)).toBe("childhood-018");
    expect(unlockEventIdOf(resolveClue(s, clue.id, 1), clue)).toBe("childhood-020");
  });

  it("每阶段已用线索数随落定增加（≤1 口径的机读形式）", () => {
    const s = withAnchor("clue-childhood-01");
    expect(cluesUsedInStage(s, "childhood")).toBe(0);
    expect(cluesUsedInStage(resolveClue(s, "clue-childhood-01", 0), "childhood")).toBe(1);
    expect(cluesUsedInStage(s, "teen")).toBe(0);
  });
});

describe("线路接线（线索 flag 真的影响出牌）", () => {
  it("解锁事件在 flag 未写时永不出现在候选池（pre 门槛生效）", () => {
    const stage = "childhood";
    // 构造一个把 childhoood 事件抽干的 state：解锁事件若可出，早该被抽到
    const s: RunState = {
      ...baseRun(),
      stageIndex: 2,
      history: EVENTS.filter((e) => e.stage === stage && e.type !== "main").map((e) => ({
        eventId: e.id,
        option: 0,
        dimsAfter,
      })),
    };
    const drawn = pickEvent(s);
    // 其它都可能出，但绝不能出受线索 flag 控制的那两条
    expect(["childhood-018", "childhood-020"]).not.toContain(drawn?.id ?? "");
  });

  it("写 flag 之后，解锁事件进候选池（同状态加 flag 即变）", () => {
    const s = withAnchor("clue-childhood-01", { flags: ["clue-note-liked"] });
    const ids = new Set<string>();
    // 反复推进：把本阶段能出的卡抽完，看解锁事件是否出现
    let cur = s;
    for (let i = 0; i < 40; i++) {
      const ev = pickEvent(cur);
      if (!ev) break;
      ids.add(ev.id);
      cur = applyChoice(cur, 0);
      if (cur.stageIndex !== 2) break;
    }
    expect(ids.has("childhood-018") || ids.has("childhood-020")).toBe(true);
  });

  it("全程实证：3 环境 × 12 种子共 36 局里，6 条线索全部 100% 触发（锚事件都被抽到）", () => {
    // 这条是「线索真的玩得到」的常驻判据——只测 pendingClue 的纯逻辑证明不了可达性：
    // 阶段内 35 条事件里实际只出 ~25–32 张卡，锚事件有可能抽不到，那样线索就是死内容。
    const ENVS = [
      { era: "60s", place: "大城", mood: "和睦", style: "宽容" },
      { era: "80s", place: "小城", mood: "紧张", style: "权威" },
      { era: "90s", place: "农村", mood: "疏离", style: "忽视" },
    ] as const;
    const hit = new Map<string, number>(CLUES.map((c) => [c.id, 0]));
    let runs = 0;
    for (const env of ENVS) {
      for (let seed = 1; seed <= 12; seed++) {
        runs += 1;
        let s = createRun(env, seed, {
          birthYear: env.era === "60s" ? 1962 : env.era === "80s" ? 1982 : 1992,
          profile: { region: "南方", structure: "独生", parentsJob: "工人", wealth: "一般" },
        });
        for (let step = 0; step < 3000 && s.stageIndex < 8; step++) {
          const clue = pendingClue(s);
          if (clue) {
            hit.set(clue.id, (hit.get(clue.id) ?? 0) + 1);
            s = resolveClue(s, clue.id, 0);
            continue;
          }
          const ev = pickEvent(s);
          if (!ev) {
            s = advanceStage(s);
            continue;
          }
          let pick = 0;
          for (let i = 0; i < ev.options.length; i++) {
            if (optionAvailable(s, ev, i)) {
              pick = i;
              break;
            }
          }
          s = applyChoice(s, pick);
        }
      }
    }
    const missed = [...hit.entries()].filter(([, n]) => n === 0).map(([id]) => id);
    expect(runs).toBe(36);
    expect(missed, `以下线索在 36 局里从未触发：${missed.join(", ")}`).toEqual([]);
  }, 300000);
});
