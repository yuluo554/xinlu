import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  advanceStage,
  applyChoice,
  createRun,
  pickEvent,
  seededDraw,
} from "../engine/engine";
import { STAGES, type RunState } from "../engine/model";
import { clear, hasSaveKey, load, SAVE_KEY, save } from "./storage";

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

function rawFrom(state: RunState): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify({
      v: 1,
      seed: state.seed,
      env: state.env,
      stageIndex: state.stageIndex,
      dims: state.dims,
      history: state.history,
      flags: state.flags,
    }),
  ) as Record<string, unknown>;
}

function putRaw(raw: unknown): string {
  const text = JSON.stringify(raw);
  backing.set(SAVE_KEY, text);
  return text;
}

describe("存档读写", () => {
  it("K6：key 为 xinlu.save.v1", () => {
    expect(SAVE_KEY).toBe("xinlu.save.v1");
  });

  it("save → load 往返逐字段全等", () => {
    const state = sampleState();
    save(state);
    expect(load()).toEqual(state);
  });

  it("无存档返回 null；save 只落 schema v1 字段", () => {
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
      ["版本号不识别", (raw) => (raw.v = 2)],
      ["顶层多余键", (raw) => (raw.hacked = true)],
      ["seed 缺失", (raw) => delete raw.seed],
      ["seed 非数", (raw) => (raw.seed = "2026")],
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
        "history 条目 option 为负",
        (raw) => ((raw.history as Array<Record<string, unknown>>)[0]!.option = -1),
      ],
      ["flags 元素非字符串", (raw) => (raw.flags = [1])],
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

describe("版本迁移链", () => {
  it("v1 透传校验通过；非 v1 一律拒绝（无更早版本可迁移）", () => {
    const state = sampleState();
    save(state);
    expect(load()).toEqual(state);
    const raw = rawFrom(state);
    delete raw.v;
    putRaw(raw);
    expect(load()).toBeNull();
  });
});

describe("hasSaveKey（损坏判定辅助：区分「无档」与「有档但损坏」）", () => {
  it("无 key → false；key 在位（哪怕内容损坏）→ true", () => {
    expect(hasSaveKey()).toBe(false);
    backing.set(SAVE_KEY, "{oops");
    expect(hasSaveKey()).toBe(true);
    expect(load()).toBeNull();
    expect(hasSaveKey()).toBe(true);
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
