// 家庭生成器单测（plan/v4/02 §三 ▸ M1''' 增补：构成枚举 × 氛围派生 / 姓名池南北分池同局无重复 / 确定性）。
import { describe, expect, it } from "vitest";
import { generateFamily } from "./family";
import type { BirthEnv, BirthProfile } from "./model";

const ENV = (mood: string, style: string): BirthEnv => ({ era: "90s", place: "小城", mood, style });
const PROFILE = (structure: string, region: "南方" | "北方" = "南方"): BirthProfile =>
  ({ region, structure, parentsJob: "工人", wealth: "一般" }) as BirthProfile;

describe("家庭构成（02 §三 ▸ M1''' 构成口径）", () => {
  it("双孩：父母 2 + 同辈恰 1（+ 祖辈 0–2）", () => {
    const family = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("双孩"), 11);
    const ids = family.map((n) => n.id);
    expect(ids).toContain("mother");
    expect(ids).toContain("father");
    expect(ids.filter((id) => id.startsWith("sibling-"))).toHaveLength(1);
    expect(ids.filter((id) => id === "grandma" || id === "grandpa").length).toBeLessThanOrEqual(2);
  });

  it("单亲：仅 mother 无 father；隔代：祖辈必 2", () => {
    const single = generateFamily(ENV("单亲", "宽容"), 1990, PROFILE("单亲"), 12);
    expect(single.map((n) => n.id)).toContain("mother");
    expect(single.map((n) => n.id)).not.toContain("father");
    const raised = generateFamily(ENV("疏离", "宽容"), 1990, PROFILE("隔代"), 13);
    const ids = raised.map((n) => n.id);
    expect(ids).toContain("grandma");
    expect(ids).toContain("grandpa");
  });

  it("独生：同辈 0；多孩：同辈 2–3", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const only = generateFamily(ENV("和睦", "权威"), 1990, PROFILE("独生"), seed);
      expect(only.filter((n) => n.id.startsWith("sibling-")), `seed=${seed}`).toHaveLength(0);
      const many = generateFamily(ENV("和睦", "权威"), 1990, PROFILE("多孩"), seed);
      const count = many.filter((n) => n.id.startsWith("sibling-")).length;
      expect(count, `seed=${seed}`).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it("同局全名不重复且非空；父/祖/同辈随家庭姓（同姓）、mother 随己姓", () => {
    for (const seed of [21, 22, 23]) {
      const family = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("多孩"), seed);
      const names = family.map((n) => n.name!);
      expect(new Set(names).size, `seed=${seed}`).toBe(names.length);
      for (const name of names) expect(name.length).toBeGreaterThanOrEqual(2);
      const surname = (id: string) => family.find((n) => n.id === id)!.name![0]!;
      const father = surname("father");
      if (family.some((n) => n.id === "sibling-1")) expect(surname("sibling-1")).toBe(father);
    }
  });

  it("南北分池：同 seed 下南北方名池产出不同（至少一轮可见差异）", () => {
    let diff = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      const south = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("双孩", "南方"), seed);
      const north = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("双孩", "北方"), seed);
      if (south[0]!.name !== north[0]!.name) diff += 1;
    }
    expect(diff).toBeGreaterThan(0);
  });

  it("确定性：同 (env, birthYear, profile, seed) 必得同一家庭", () => {
    const a = generateFamily(ENV("紧张", "权威"), 1995, PROFILE("多孩", "北方"), 77);
    const b = generateFamily(ENV("紧张", "权威"), 1995, PROFILE("多孩", "北方"), 77);
    expect(a).toEqual(b);
  });
});

describe("初始 bond 派生表（mood × style，单源 02 §三 ▸ M1'''）", () => {
  it("和睦×宽容=80 / 紧张×权威=55 / 疏离×忽视=40 / 单亲×宽容=75(+5 相依为命另计)", () => {
    const pick = (mood: string, style: string, structure = "双孩") =>
      generateFamily(ENV(mood, style), 1990, PROFILE(structure), 3).find((n) => n.id === "mother")!.bond;
    expect(pick("和睦", "宽容")).toBe(80);
    expect(pick("紧张", "权威")).toBe(55);
    expect(pick("疏离", "忽视")).toBe(40);
    expect(pick("单亲", "宽容", "单亲")).toBe(80); // 75 + 5 相依为命
  });

  it("隔代祖辈 bond 75（朝夕相处）；同辈恒 65", () => {
    const raised = generateFamily(ENV("疏离", "宽容"), 1990, PROFILE("隔代"), 31);
    expect(raised.find((n) => n.id === "grandma")!.bond).toBe(75);
    const sib = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("双孩"), 31).find((n) => n.id === "sibling-1");
    if (sib) expect(sib.bond).toBe(65);
  });
});
