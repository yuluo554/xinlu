// 种子码单测（v3-M3'' 3.2 · plan/v3/03 §5 验收：码编解码 + 同码复现断言 + 随机出生确定性）。
import { describe, expect, it } from "vitest";
import { advanceStage, applyChoice, createRun, optionAvailable, pickEvent, randomBirthEnv } from "./engine";
import { SEED_ALPHABET, SEED_MAX, seedCodeOf, seedFromCode } from "./seedcode";
import { STAGES, type RunState } from "./model";

const ENV = { era: "90s", place: "小城", mood: "和睦", style: "权威" };

describe("seedCodeOf / seedFromCode（XL-XXXX-XXXX）", () => {
  it("往返一致：[0, 2^31) 抽样 seed 全部还原", () => {
    const samples = [0, 1, 42, 65535, 2147483646, 2147483647, 1000000000];
    for (const s of samples) {
      expect(seedFromCode(seedCodeOf(s)), `seed=${s}`).toBe(s);
    }
  });

  it("码形合法：XL- 两段 4 符号，符号表不含 0/1/O/I", () => {
    expect(seedCodeOf(0)).toMatch(/^XL-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    expect(SEED_ALPHABET.length).toBe(32);
    for (const bad of ["0", "1", "O", "I"]) {
      expect(SEED_ALPHABET.includes(bad), bad).toBe(false);
    }
  });

  it("不同 seed 不同码（抽样无碰撞）", () => {
    const codes = new Set([0, 1, 2, 32, 33, 123456, 987654321].map(seedCodeOf));
    expect(codes.size).toBe(7);
  });

  it("非法输入一律 null：易混字符 / 错长 / 越界值 / 空串", () => {
    expect(seedFromCode("XL-0000-0000")).toBeNull(); // 含 0
    expect(seedFromCode("XL-AI23-9M2D")).toBeNull(); // 含 I
    expect(seedFromCode("XL-7Q3K-9M")).toBeNull(); // 短
    expect(seedFromCode("XL-7Q3K-9M2DX")).toBeNull(); // 长
    expect(seedFromCode("ZZ-ZZZZ-ZZZZ")).toBeNull(); // 前缀不对
    expect(seedFromCode("")).toBeNull();
    // 解码值 ≥ 2^31 的码无对应 seed → null（ZZZZ-ZZZZ = 32^8−1）
    expect(seedFromCode("XL-ZZZZ-ZZZZ")).toBeNull();
  });

  it("输入容错：小写 / 带空格 可识别", () => {
    const code = seedCodeOf(123456789);
    expect(seedFromCode(code.toLowerCase())).toBe(123456789);
    expect(seedFromCode(`  ${code.toLowerCase()} `)).toBe(123456789);
  });

  it("越界 seed 抛错（引擎层 bug 不静默）", () => {
    expect(() => seedCodeOf(-1)).toThrow();
    expect(() => seedCodeOf(SEED_MAX)).toThrow();
    expect(() => seedCodeOf(1.5)).toThrow();
  });
});

describe("randomBirthEnv（随机出生：seed 派生四要素）", () => {
  it("同 seed 必得同环境；不同 seed 大概率不同环境", () => {
    const a = randomBirthEnv(2024);
    const b = randomBirthEnv(2024);
    expect(a).toEqual(b);
    const others = new Set([1, 2, 3, 99, 12345, 999999].map(randomBirthEnv).map((e) => JSON.stringify(e)));
    expect(others.size).toBeGreaterThanOrEqual(5);
  });

  it("派生环境能直接开局（枚举合法性由 createRun 校验兜底）", () => {
    for (const s of [0, 7, 77777, SEED_MAX - 1]) {
      expect(() => createRun(randomBirthEnv(s), s)).not.toThrow();
    }
  });
});

describe("同码复现契约（DoD：两次同码随机出生 + 同选项序列 ⇒ 全程全等）", () => {
  function drive(seed: number): RunState {
    let state = createRun(randomBirthEnv(seed), seed);
    while (state.stageIndex < STAGES.length) {
      const event = pickEvent(state);
      if (!event) {
        state = advanceStage(state);
        continue;
      }
      const pref = state.history.length % 3;
      const idx = optionAvailable(state, event, pref)
        ? pref
        : event.options.findIndex((_, i) => optionAvailable(state, event, i));
      state = applyChoice(state, idx);
    }
    return state;
  }

  it("同码双跑逐字段全等", () => {
    for (const seed of [7, 424242, SEED_MAX - 1]) {
      expect(JSON.stringify(drive(seed))).toBe(JSON.stringify(drive(seed)));
    }
  });

  it("手选出生与同码随机出生同 seed 时环境可不同，但抽取流契约不变", () => {
    // 手选路径：env 来自玩家，seed 独立生成——复现性由「同 seed + 同选项序列」保证（02 §六）
    const a = createRun(ENV, 555);
    const b = createRun(ENV, 555);
    expect(a).toEqual(b);
  });
});
