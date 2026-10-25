// v4 出生画像/随机出生访问器单测（plan/v4/02 §一/§三 ▸ M1''' 增补；派生表单源该节）。
import { describe, expect, it } from "vitest";
import birthMapRaw from "../data/birth-map.json";
import { createRun, deriveBirth, envFromBirth, profileOptions, randomBirth } from "./engine";
import { eraOf } from "./year";
import type { BirthEnv, BirthProfile } from "./model";

const BIRTH_MAP = birthMapRaw as unknown as Record<string, Record<string, unknown>>;
const ENV = (era: string): BirthEnv => ({ era, place: "小城", mood: "和睦", style: "权威" });

describe("profileOptions（自定义页签枚举唯一来源）", () => {
  it("四因素枚举与 birth-map 新组键逐一相等", () => {
    const opts = profileOptions();
    expect(opts.region).toEqual(Object.keys(BIRTH_MAP.region!));
    expect(opts.structure).toEqual(Object.keys(BIRTH_MAP.structure!));
    expect(opts.parentsJob).toEqual(Object.keys(BIRTH_MAP.parentsJob!));
    expect(opts.wealth).toEqual(Object.keys(BIRTH_MAP.wealth!));
    expect(opts.region).toHaveLength(2);
    expect(opts.structure).toHaveLength(5);
    expect(opts.parentsJob).toHaveLength(6);
    expect(opts.wealth).toHaveLength(3);
  });
});

describe("deriveBirth（手选页签派生：draw 4–8 确定性）", () => {
  it("同 seed 同派生；birthYear 落 era 区间且 eraOf 回环一致", () => {
    for (const seed of [1, 7, 42, 2026, 1990123]) {
      const a = deriveBirth(ENV("90s"), seed);
      const b = deriveBirth(ENV("90s"), seed);
      expect(a, `seed=${seed}`).toEqual(b);
      expect(a.birthYear).toBeGreaterThanOrEqual(1990);
      expect(a.birthYear).toBeLessThanOrEqual(1999);
      expect(eraOf(a.birthYear)).toBe("90s");
    }
  });

  it("概率表结构约束：mood=单亲 ⇒ structure=单亲；era 60s/70s 不出个体与待岗", () => {
    for (const seed of Array.from({ length: 300 }, (_, i) => i)) {
      const single = deriveBirth({ ...ENV("80s"), mood: "单亲" }, seed);
      expect(single.profile.structure, `seed=${seed}`).toBe("单亲");
      const early = deriveBirth(ENV("60s"), seed);
      expect(early.profile.parentsJob, `seed=${seed}`).not.toBe("个体");
      expect(early.profile.parentsJob).not.toBe("待岗");
    }
  });
});

describe("envFromBirth（自定义页签六因素 → 四要素派生表）", () => {
  const P = (structure: string, job = "工人", wealth = "一般"): BirthProfile =>
    ({ region: "南方", structure, parentsJob: job, wealth }) as BirthProfile;

  it("structure → mood：独生/双孩→和睦、多孩→紧张、单亲→单亲、隔代→疏离", () => {
    expect(envFromBirth(1987, P("独生"), "大城").mood).toBe("和睦");
    expect(envFromBirth(1987, P("双孩"), "大城").mood).toBe("和睦");
    expect(envFromBirth(1987, P("多孩"), "大城").mood).toBe("紧张");
    expect(envFromBirth(1987, P("单亲"), "大城").mood).toBe("单亲");
    expect(envFromBirth(1987, P("隔代"), "大城").mood).toBe("疏离");
  });

  it("style：教师医生/公职 → 权威（覆盖家境）；拮据 → 忽视；其余 → 宽容", () => {
    expect(envFromBirth(1987, P("双孩", "教师医生", "拮据"), "大城").style).toBe("权威");
    expect(envFromBirth(1987, P("双孩", "公职", "宽裕"), "大城").style).toBe("权威");
    expect(envFromBirth(1987, P("双孩", "工人", "拮据"), "大城").style).toBe("忽视");
    expect(envFromBirth(1987, P("双孩", "个体", "宽裕"), "大城").style).toBe("宽容");
  });

  it("era = eraOf(birthYear)；createRun 对跨段出生年抛错", () => {
    expect(envFromBirth(2012, P("独生"), "农村").era).toBe("10s");
    expect(() => createRun(ENV("90s"), 1, { birthYear: 2012, profile: P("独生") })).toThrow(/不同段/);
    expect(() => createRun(ENV("90s"), 1, { birthYear: 1994, profile: P("独生") })).not.toThrow();
  });
});

describe("randomBirth（v4 随机出生：同码 ⇒ 同出生年同画像同家庭）", () => {
  it("同 seed 全等（env/birthYear/profile/家庭）", () => {
    for (const seed of [3, 33, 333]) {
      const a = randomBirth(seed);
      const b = randomBirth(seed);
      expect(a).toEqual(b);
      const runA = createRun(a.env, seed, { birthYear: a.birthYear, profile: a.profile });
      const runB = createRun(b.env, seed, { birthYear: b.birthYear, profile: b.profile });
      expect(runA).toEqual(runB);
      expect(eraOf(a.birthYear)).toBe(a.env.era);
    }
  });

  it("birthYear 落 [1955, 2015]；跨 seed 抽样覆盖多段 era", () => {
    const eras = new Set<string>();
    for (const seed of Array.from({ length: 200 }, (_, i) => i)) {
      const born = randomBirth(seed);
      expect(born.birthYear).toBeGreaterThanOrEqual(1955);
      expect(born.birthYear).toBeLessThanOrEqual(2015);
      eras.add(born.env.era);
    }
    expect(eras.size).toBeGreaterThanOrEqual(4);
  });
});
