import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  advanceStage,
  applyChoice,
  createRun,
  deriveBirth,
  pickEvent,
  seededDraw,
} from "../engine/engine";
import { STAGES, type RunState } from "../engine/model";
import {
  clear,
  hasSaveKey,
  LEGACY_SAVE_KEY_V1,
  LEGACY_SAVE_KEY_V2,
  load,
  SAVE_KEY,
  save,
} from "./storage";

const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };

class MemoryStorage implements Storage {
  constructor(private readonly backing: Map<string, string>) {}
  get length(): number {
    return this.backing.size;
  }
  clear(): void {
    this.backing.clear();
  }
  getItem(key: string): string | null {
    return this.backing.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.backing.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.backing.delete(key);
  }
  setItem(key: string, value: string): void {
    this.backing.set(key, String(value));
  }
}

let backing: Map<string, string>;

beforeEach(() => {
  backing = new Map();
  vi.stubGlobal("localStorage", new MemoryStorage(backing));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function sampleState(): RunState {
  return applyChoice(createRun(ENV, 2026), 0);
}

/** v3 信封形（save 的逐字段镜像，供形状违约用例做基线）。 */
function rawFrom(state: RunState): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify({
      v: 3,
      seed: state.seed,
      birthYear: state.birthYear,
      profile: state.profile,
      env: state.env,
      stageIndex: state.stageIndex,
      dims: state.dims,
      history: state.history,
      flags: state.flags,
      values3: state.values3,
      resources: state.resources,
      lines: state.lines,
      npcs: state.npcs,
    }),
  ) as Record<string, unknown>;
}

/** v2 旧信封形（迁移链输入；plan/v3/02 §八 形状 + seedCode 可选）。 */
function rawV2From(state: RunState): Record<string, unknown> {
  const { birthYear: _b, profile: _p, migrated: _m, ...v2Fields } = state;
  return JSON.parse(
    JSON.stringify({
      v: 2,
      ...v2Fields,
    }),
  ) as Record<string, unknown>;
}

function putRaw(raw: unknown): string {
  const text = JSON.stringify(raw);
  backing.set(SAVE_KEY, text);
  return text;
}

describe("存档读写", () => {
  it("K6 延续：key 为 xinlu.save.v3（v2/v1 key 仅迁移链读取）", () => {
    expect(SAVE_KEY).toBe("xinlu.save.v3");
    expect(LEGACY_SAVE_KEY_V2).toBe("xinlu.save.v2");
    expect(LEGACY_SAVE_KEY_V1).toBe("xinlu.save.v1");
  });

  it("save → load 往返逐字段全等（含 v3 状态层 + v4 历法层）", () => {
    const state = sampleState();
    save(state);
    expect(load()).toEqual(state);
  });

  it("无存档返回 null；save 只落 schema v3 字段", () => {
    expect(load()).toBeNull();
    save({ ...sampleState(), extra: true } as RunState);
    const loaded = load() as RunState & { extra?: unknown };
    expect(loaded.extra).toBeUndefined();
    expect(backing.get(SAVE_KEY)).not.toContain("extra");
  });

  it("终局态（stageIndex = 8）也是合法存档", () => {
    const state = advanceStage({ ...sampleState(), stageIndex: STAGES.length - 1 });
    save(state);
    expect(load()).toEqual(state);
  });

  it("时代卡 history 条目（kind:era / option:-1）与迁移标记（migrated）往返保留", () => {
    const base = sampleState();
    const state: RunState = {
      ...base,
      migrated: true,
      history: base.history.concat({
        eventId: "era-1977-gaokao",
        option: -1,
        dimsAfter: base.dims,
        kind: "era",
      }),
    };
    save(state);
    expect(load()).toEqual(state);
  });
});

describe("损坏兜底（绝不静默清档）", () => {
  it("非法 JSON → null 且原文保留", () => {
    backing.set(SAVE_KEY, "{oops");
    expect(load()).toBeNull();
    expect(backing.get(SAVE_KEY)).toBe("{oops");
  });

  it("形状违约逐项拒绝，且不清档", () => {
    const base = sampleState();
    const cases: Array<[string, (raw: Record<string, unknown>) => void]> = [
      ["版本号缺失", (raw) => delete raw.v],
      ["版本号不识别", (raw) => (raw.v = 9)],
      ["顶层多余键", (raw) => (raw.hacked = true)],
      ["seed 缺失", (raw) => delete raw.seed],
      ["seed 非数", (raw) => (raw.seed = "2026")],
      ["birthYear 缺失", (raw) => delete raw.birthYear],
      ["birthYear 越界", (raw) => (raw.birthYear = 1954)],
      ["birthYear 非整数", (raw) => (raw.birthYear = 1990.5)],
      ["profile 缺键", (raw) => delete (raw.profile as Record<string, unknown>).region],
      ["profile 枚举越界", (raw) => ((raw.profile as Record<string, unknown>).wealth = "巨富")],
      ["env 枚举越界", (raw) => ((raw.env as Record<string, unknown>).era = "1900s")],
      ["env 多余键", (raw) => ((raw.env as Record<string, unknown>).extra = 1)],
      ["stageIndex 超上界", (raw) => (raw.stageIndex = STAGES.length + 1)],
      ["stageIndex 非整数", (raw) => (raw.stageIndex = 1.5)],
      ["dims 缺键", (raw) => delete (raw.dims as Record<string, unknown>).jp],
      ["dims 非数", (raw) => ((raw.dims as Record<string, unknown>).ei = "60")],
      ["history 非数组", (raw) => (raw.history = {})],
      [
        "history 条目缺 dimsAfter",
        (raw) => delete (raw.history as Array<Record<string, unknown>>)[0]!.dimsAfter,
      ],
      [
        "history 条目 option 为负（无 kind:era）",
        (raw) => ((raw.history as Array<Record<string, unknown>>)[0]!.option = -1),
      ],
      [
        "history 条目 kind 非法",
        (raw) => ((raw.history as Array<Record<string, unknown>>)[0]!.kind = "dream"),
      ],
      ["flags 元素非字符串", (raw) => (raw.flags = [1])],
      ["values3 缺轴", (raw) => delete (raw.values3 as Record<string, unknown>).outlook],
      ["values3 越界", (raw) => ((raw.values3 as Record<string, unknown>).values = 101)],
      ["resources 非整数", (raw) => ((raw.resources as Record<string, unknown>).mood = 60.5)],
      ["lines 缺键", (raw) => delete (raw.lines as Record<string, unknown>).career],
      ["npcs 元素 tag 非法", (raw) => ((raw.npcs as Array<Record<string, unknown>>)[0]!.tag = "挚爱")],
      ["npcs 元素缺 bond", (raw) => delete (raw.npcs as Array<Record<string, unknown>>)[0]!.bond],
      ["npcs 元素 name 非字符串", (raw) => ((raw.npcs as Array<Record<string, unknown>>)[0]!.name = 7)],
      ["migrated 非布尔", (raw) => (raw.migrated = "yes")],
    ];
    for (const [name, mutate] of cases) {
      const raw = rawFrom(base);
      mutate(raw);
      const text = putRaw(raw);
      expect(load(), name).toBeNull();
      expect(backing.get(SAVE_KEY), `${name}：不得清档`).toBe(text);
    }
  });
});

describe("版本迁移链（plan/v3/02 §八 + plan/v4/02 §九 ▸ M1''' 增补）", () => {
  it("v1 档迁移：补三观/资源中位、线进度 0、父母默认 → 再补历法层；迁入 v3 后清理旧 key", () => {
    const run = sampleState();
    const v1Raw = JSON.parse(
      JSON.stringify({
        v: 1,
        seed: run.seed,
        env: run.env,
        stageIndex: run.stageIndex,
        dims: run.dims,
        history: run.history,
        flags: run.flags,
      }),
    );
    backing.set(LEGACY_SAVE_KEY_V1, JSON.stringify(v1Raw));

    const loaded = load();
    expect(loaded).not.toBeNull();
    expect(loaded!.seed).toBe(run.seed);
    expect(loaded!.dims).toEqual(run.dims);
    expect(loaded!.history).toEqual(run.history);
    expect(loaded!.flags).toEqual(run.flags);
    // v3 状态层补初始中位（绝不静默清档：内容零丢失）
    expect(loaded!.values3).toEqual({ worldview: 50, outlook: 50, values: 50 });
    expect(loaded!.resources).toEqual({ mood: 60, money: 60, health: 60 });
    expect(loaded!.lines).toEqual({ study: 0, career: 0, love: 0, friend: 0, health: 0 });
    // v4 历法层：birthYear 由 era 中值派生、画像按 seed 复算、家庭补生成、迁移标记在位
    expect(loaded!.birthYear).toBe(1995);
    expect(loaded!.profile).toEqual(deriveBirth(run.env, run.seed).profile);
    expect(loaded!.migrated).toBe(true);
    const ids = loaded!.npcs.map((n) => n.id);
    expect(ids).toContain("mother");
    expect(ids).toContain("father");
    expect(loaded!.npcs.every((n) => n.name === undefined || typeof n.name === "string")).toBe(true);
    // 迁移副作用：v3 key 写入、v1 key 清理
    expect(backing.get(SAVE_KEY)).not.toBeNull();
    expect(backing.get(LEGACY_SAVE_KEY_V1) ?? null).toBeNull();
    // 再次 load 直读 v3，结果一致
    expect(load()).toEqual(loaded);
  });

  it("v2 档迁移：既有 bond 保留、家庭补齐缺失成员、v2 key 清理", () => {
    const run = createRun(ENV, 777);
    const raw = rawV2From(run);
    // 既有演化态：mother bond 拉到 85、bestie 已入册（模拟支线消费）
    const npcs = raw.npcs as Array<Record<string, unknown>>;
    npcs[0]!.bond = 85;
    npcs.push({ id: "bestie", bond: 62, tag: "亲密" });
    backing.set(LEGACY_SAVE_KEY_V2, JSON.stringify(raw));

    const loaded = load();
    expect(loaded).not.toBeNull();
    expect(loaded!.birthYear).toBe(1995);
    expect(loaded!.migrated).toBe(true);
    // 既有 NPC 的 bond 保留（不覆盖），补齐家庭缺失成员（祖辈/同辈随结构）
    const mother = loaded!.npcs.find((n) => n.id === "mother");
    expect(mother!.bond).toBe(85);
    expect(loaded!.npcs.find((n) => n.id === "bestie")!.bond).toBe(62);
    const familyIds = ["mother", "father", "grandma", "grandpa", "sibling-1", "sibling-2", "sibling-3"];
    const known = new Set(loaded!.npcs.map((n) => n.id));
    for (const id of familyIds) if (known.has(id)) expect(known.has(id)).toBe(true);
    // 家庭成员都有本局姓名（names.json 池）
    for (const n of loaded!.npcs) {
      if (familyIds.includes(n.id)) expect(n.name, `${n.id} 应有本局姓名`).toBeTruthy();
    }
    // 迁移副作用：v3 key 写入、v2 key 清理
    expect(backing.get(SAVE_KEY)).not.toBeNull();
    expect(backing.get(LEGACY_SAVE_KEY_V2) ?? null).toBeNull();
    expect(load()).toEqual(loaded);
  });

  it("损坏的 v1 档 → null 且旧 key 原样保留（不迁移不清理）", () => {
    backing.set(LEGACY_SAVE_KEY_V1, "{oops");
    expect(load()).toBeNull();
    expect(backing.get(LEGACY_SAVE_KEY_V1)).toBe("{oops");
    expect(backing.get(SAVE_KEY) ?? null).toBeNull();
  });

  it("损坏的 v2 档 → null 且旧 key 原样保留", () => {
    backing.set(LEGACY_SAVE_KEY_V2, "{oops");
    expect(load()).toBeNull();
    expect(backing.get(LEGACY_SAVE_KEY_V2)).toBe("{oops");
    expect(backing.get(SAVE_KEY) ?? null).toBeNull();
  });

  it("形状违约的 v1 档 → null（缺键不迁移）", () => {
    const run = sampleState();
    const v1Raw = { v: 1, seed: run.seed, env: run.env, stageIndex: run.stageIndex, dims: run.dims };
    backing.set(LEGACY_SAVE_KEY_V1, JSON.stringify(v1Raw));
    expect(load()).toBeNull();
    expect(backing.get(LEGACY_SAVE_KEY_V1)).not.toBeNull();
  });
});

describe("hasSaveKey（损坏判定辅助：区分「无档」与「有档但损坏」）", () => {
  it("无 key → false；v3 key 在位（哪怕内容损坏）→ true", () => {
    expect(hasSaveKey()).toBe(false);
    backing.set(SAVE_KEY, "{oops");
    expect(hasSaveKey()).toBe(true);
    expect(load()).toBeNull();
    expect(hasSaveKey()).toBe(true);
  });

  it("仅 v1/v2 旧 key 在位 → true（迁移前同样是「有档」）", () => {
    backing.set(LEGACY_SAVE_KEY_V1, "{oops");
    expect(hasSaveKey()).toBe(true);
    expect(load()).toBeNull();
    backing.clear();
    backing.set(LEGACY_SAVE_KEY_V2, "{oops");
    expect(hasSaveKey()).toBe(true);
    expect(load()).toBeNull();
  });

  it("合法存档 → true；clear 后 → false", () => {
    save(sampleState());
    expect(hasSaveKey()).toBe(true);
    clear();
    expect(hasSaveKey()).toBe(false);
  });
});

describe("clear", () => {
  it("清档后 load 为 null；空档 clear 不抛错", () => {
    save(sampleState());
    clear();
    expect(load()).toBeNull();
    expect(() => clear()).not.toThrow();
  });
});

describe("存档续局等价（可复现契约贯穿存档）", () => {
  const choose =
    (seed: number) =>
    (state: RunState): number =>
      seededDraw(seed, state.history.length) < 0.5 ? 0 : 1;

  function driveToEnd(start: RunState, choose: (state: RunState) => number): RunState {
    let state = start;
    while (state.stageIndex < STAGES.length) {
      const event = pickEvent(state);
      state = event ? applyChoice(state, choose(state)) : advanceStage(state);
    }
    return state;
  }

  it("中断存档后续局，与不中断全程逐字段全等", () => {
    const seed = 2026024;
    const pick = choose(seed);
    const uninterrupted = driveToEnd(createRun(ENV, seed), pick);

    let state = createRun(ENV, seed);
    let choices = 0;
    while (state.stageIndex < STAGES.length && choices < 5) {
      const event = pickEvent(state);
      if (event) {
        state = applyChoice(state, pick(state));
        choices += 1;
      } else {
        state = advanceStage(state);
      }
    }
    expect(choices).toBe(5);
    save(state);

    const resumed = load();
    expect(resumed).not.toBeNull();
    const final = driveToEnd(resumed!, pick);
    expect(final).toEqual(uninterrupted);
  });
});
