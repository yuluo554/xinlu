// 家庭生成器单测（plan/v4/02 §三 ▸ M1''' 增补 + v5/02 §一 槽位逐位命名）。
// 覆盖：结构↔槽组合合法 / 槽位唯一 / role 与槽一致 / 姓名池南北分池同局无重复 / 确定性。
import { describe, expect, it } from "vitest";
import { FAMILY_SLOT_TABLE, familySlotRole, generateFamily } from "./family";
import type { BirthEnv, BirthProfile, NpcState } from "./model";

const ENV = (mood: string, style: string): BirthEnv => ({ era: "90s", place: "小城", mood, style });
const PROFILE = (structure: string, region: "南方" | "北方" = "南方"): BirthProfile =>
  ({ region, structure, parentsJob: "工人", wealth: "一般" }) as BirthProfile;

/** 槽组提取：parent- / gp- / sib- 前缀。 */
const groupOf = (slot: string | undefined): "parent" | "grandparent" | "sibling" | null => {
  if (!slot) return null;
  if (slot.startsWith("parent-")) return "parent";
  if (slot.startsWith("gp-")) return "grandparent";
  if (slot.startsWith("sib-")) return "sibling";
  return null;
};

const countBy = (family: NpcState[], group: "parent" | "grandparent" | "sibling"): number =>
  family.filter((n) => groupOf(n.slot) === group).length;

const SEEDS = Array.from({ length: 24 }, (_, i) => i + 1);

describe("家庭构成（v5/02 §一 结构↔槽合法组合）", () => {
  it("独生：父母恰 2、同辈 0（祖辈 0–2）", () => {
    for (const seed of SEEDS) {
      const family = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("独生"), seed);
      expect(countBy(family, "parent"), `seed=${seed}`).toBe(2);
      expect(countBy(family, "sibling"), `seed=${seed}`).toBe(0);
      expect(countBy(family, "grandparent"), `seed=${seed}`).toBeLessThanOrEqual(2);
    }
  });

  it("双孩：父母 2 + 同辈恰 1 且为年长位（兄/姐）", () => {
    for (const seed of SEEDS) {
      const family = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("双孩"), seed);
      expect(countBy(family, "parent"), `seed=${seed}`).toBe(2);
      const sib = family.filter((n) => groupOf(n.slot) === "sibling");
      expect(sib, `seed=${seed}`).toHaveLength(1);
      expect(["sib-older-brother", "sib-older-sister"], `seed=${seed}`).toContain(sib[0]!.slot);
    }
  });

  it("多孩：父母 2 + 同辈 2–3（首位年长，其余年幼）", () => {
    for (const seed of SEEDS) {
      const family = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("多孩"), seed);
      expect(countBy(family, "parent"), `seed=${seed}`).toBe(2);
      const sib = family.filter((n) => groupOf(n.slot) === "sibling");
      expect(sib.length, `seed=${seed}`).toBeGreaterThanOrEqual(2);
      expect(sib.length, `seed=${seed}`).toBeLessThanOrEqual(3);
      expect(["sib-older-brother", "sib-older-sister"], `seed=${seed}`).toContain(sib[0]!.slot);
      for (const n of sib.slice(1)) {
        expect(["sib-younger-brother", "sib-younger-sister"], `seed=${seed}`).toContain(n.slot);
      }
    }
  });

  it("单亲：父母恰 1（父或母皆合法），同辈 0", () => {
    const parentsSeen = new Set<string>();
    for (const seed of SEEDS) {
      const family = generateFamily(ENV("单亲", "宽容"), 1990, PROFILE("单亲"), seed);
      const parents = family.filter((n) => groupOf(n.slot) === "parent");
      expect(parents, `seed=${seed}`).toHaveLength(1);
      expect(countBy(family, "sibling"), `seed=${seed}`).toBe(0);
      parentsSeen.add(parents[0]!.slot!);
    }
    // 父/母两种单亲形态在 24 个种子里都应出现（draw 36 二选一，不是死分支）
    expect([...parentsSeen].sort()).toEqual(["parent-father", "parent-mother"]);
  });

  it("隔代：祖辈必 2 且同侧（南北派生），父母 0–1", () => {
    for (const seed of SEEDS) {
      const south = generateFamily(ENV("疏离", "宽容"), 1990, PROFILE("隔代", "南方"), seed);
      const gpS = south.filter((n) => groupOf(n.slot) === "grandparent");
      expect(gpS, `seed=${seed}`).toHaveLength(2);
      expect(gpS.map((n) => n.slot).sort(), `seed=${seed}`).toEqual(["gp-maternal-grandma", "gp-maternal-grandpa"]);
      expect(countBy(south, "parent"), `seed=${seed}`).toBeLessThanOrEqual(1);

      const north = generateFamily(ENV("疏离", "宽容"), 1990, PROFILE("隔代", "北方"), seed);
      const gpN = north.filter((n) => groupOf(n.slot) === "grandparent");
      expect(gpN.map((n) => n.slot).sort(), `seed=${seed}`).toEqual(["gp-paternal-grandma", "gp-paternal-grandpa"]);
    }
  });
});

describe("槽位唯一性与 role 一致性（缺陷修复本体）", () => {
  it("同局槽位互不重复；每个家庭成员都有 slot", () => {
    const all: Array<{ seed: number; structure: string }> = [];
    for (const structure of ["独生", "双孩", "多孩", "单亲", "隔代"]) {
      for (const seed of SEEDS) all.push({ seed, structure });
    }
    for (const { seed, structure } of all) {
      const family = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE(structure), seed);
      const slots = family.map((n) => n.slot);
      expect(slots.every((s) => typeof s === "string" && s.length > 0), `${structure}/seed=${seed} 有成员缺 slot`).toBe(true);
      expect(new Set(slots).size, `${structure}/seed=${seed} 槽位重复：${slots.join(",")}`).toBe(slots.length);
      // 槽位必须在封闭枚举内
      for (const s of slots) expect(Object.keys(FAMILY_SLOT_TABLE.slots), `未知槽位 ${s}`).toContain(s);
    }
  });

  it("role 与槽位一致：父母/祖辈/同辈逐位命名，禁泛称", () => {
    const family = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("多孩"), 5);
    for (const n of family) {
      const role = familySlotRole(n.slot);
      expect(role, `${n.id} 槽 ${n.slot} 无 role`).toBeTruthy();
      expect(["父母", "祖辈", "同辈", "家长"]).not.toContain(role);
      if (n.slot === "parent-mother") expect(role).toBe("母亲");
      if (n.slot === "parent-father") expect(role).toBe("父亲");
    }
  });

  it("注册槽 id 与分组的对应关系与 family-slots.json 一致", () => {
    const family = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("多孩"), 9);
    for (const [id, group] of Object.entries(FAMILY_SLOT_TABLE.groups)) {
      const found = family.find((n) => n.id === id);
      if (!found) continue;
      expect(groupOf(found.slot), `${id} 分组应为 ${group}`).toBe(group);
    }
  });
});

describe("姓名池与确定性（v4/02 §三 ▸ M1''' 口径不变）", () => {
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

  it("确定性：同 (env, birthYear, profile, seed) 必得同一家庭（含槽位）", () => {
    const a = generateFamily(ENV("紧张", "权威"), 1995, PROFILE("多孩", "北方"), 77);
    const b = generateFamily(ENV("紧张", "权威"), 1995, PROFILE("多孩", "北方"), 77);
    expect(a).toEqual(b);
    expect(a.every((n) => n.slot)).toBe(true);
  });

  it("未知结构抛错（数据缺陷不静默出空家庭）", () => {
    expect(() => generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("不存在"), 1)).toThrow(/未知家庭结构/);
  });
});

describe("初始 bond 派生表（mood × style，单源 02 §三 ▸ M1'''）", () => {
  const pickMotherBond = (mood: string, style: string, structure = "双孩", seed = 3): number => {
    const family = generateFamily(ENV(mood, style), 1990, PROFILE(structure), seed);
    const mother = family.find((n) => n.slot === "parent-mother");
    expect(mother, `${mood}×${style} 应有母亲槽（${structure}）`).toBeTruthy();
    return mother!.bond;
  };

  it("和睦×宽容=80 / 紧张×权威=55 / 疏离×忽视=40", () => {
    expect(pickMotherBond("和睦", "宽容")).toBe(80);
    expect(pickMotherBond("紧张", "权威")).toBe(55);
    expect(pickMotherBond("疏离", "忽视")).toBe(40);
  });

  it("隔代祖辈 bond 75（朝夕相处）；非隔代 60；同辈恒 65", () => {
    const raised = generateFamily(ENV("疏离", "宽容"), 1990, PROFILE("隔代"), 31);
    for (const gp of raised.filter((n) => groupOf(n.slot) === "grandparent")) expect(gp.bond).toBe(75);
    for (const seed of SEEDS) {
      const normal = generateFamily(ENV("和睦", "宽容"), 1990, PROFILE("多孩"), seed);
      const gp = normal.find((n) => groupOf(n.slot) === "grandparent");
      if (gp) expect(gp.bond, `seed=${seed}`).toBe(60);
      const sib = normal.find((n) => groupOf(n.slot) === "sibling");
      if (sib) expect(sib.bond, `seed=${seed}`).toBe(65);
    }
  });
});
