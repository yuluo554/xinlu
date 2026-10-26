// 开局四步状态机单测（plan/v5/02 §五 DoD）：四步推进、任何一步可回退且不丢已填值、
// 出生证明八因素齐、再来一次确实换结果、入场四件套与 createRun 同构。
// 纯函数直测，零 DOM —— 「回退保值」在这里是结构性质，不是 DOM 残留的巧合。
import { describe, expect, it } from "vitest";
import { createRun } from "../engine/engine";
import { generateFamily } from "../engine/family";
import type { BirthEnv, BirthProfile } from "../engine/model";
import {
  back,
  chooseMode,
  initialDraft,
  openingLineOf,
  preview,
  previewYear,
  reroll,
  START_MODES,
  START_STEP_COUNT,
  startInput,
  useCert,
  withCustomBirth,
  withManualEnv,
} from "./start-flow";

const ENV: BirthEnv = { era: "90s", place: "小城", mood: "紧张", style: "忽视" };
const PROFILE: BirthProfile = { region: "南方", structure: "双孩", parentsJob: "教师医生", wealth: "一般" };

describe("四步推进与进度口径（1/4–4/4）", () => {
  it("初始在 step 1，四步总数 = 4，玩法三选一按显示序", () => {
    const d = initialDraft();
    expect(d.step).toBe(1);
    expect(d.mode).toBeNull();
    expect(d.cert).toBeNull();
    expect(START_STEP_COUNT).toBe(4);
    expect([...START_MODES]).toEqual(["random", "manual", "custom"]);
  });

  it("选玩法 → 填要素 → 出生证明 → 入场，step 逐级 2/3/4", () => {
    let d = chooseMode(initialDraft(), "random");
    expect(d.step).toBe(2);
    d = preview(d, 12345);
    expect(d.step).toBe(3);
    expect(d.cert).not.toBeNull();
    d = useCert(d);
    expect(d.step).toBe(4);
  });

  it("step 1 回退原地不动（没有上一步可退）", () => {
    const d = back(initialDraft());
    expect(d.step).toBe(1);
  });
});

describe("回退保值（DoD：任何一步可回退且不丢已填值）", () => {
  it("手选四要素：回退后再进，值仍在", () => {
    let d = chooseMode(initialDraft(), "manual");
    d = withManualEnv(d, ENV);
    d = back(d);
    expect(d.step).toBe(1);
    d = chooseMode(d, "manual");
    expect(d.step).toBe(2);
    expect(d.manualEnv).toEqual(ENV);
  });

  it("自定义八因素：回退后再进，出生年/城乡/四画像都在", () => {
    let d = chooseMode(initialDraft(), "custom");
    d = withCustomBirth(d, { birthYear: 1978, place: "县镇", profile: PROFILE });
    d = back(d);
    d = chooseMode(d, "custom");
    expect(d.customBirth).toEqual({ birthYear: 1978, place: "县镇", profile: PROFILE });
  });

  it("出生证明回退到填要素再回来：证明作废但已填值在（重进一次即恢复同证）", () => {
    let d = chooseMode(initialDraft(), "manual");
    d = withManualEnv(d, ENV);
    d = preview(d, 777);
    const cert = d.cert!;
    d = back(d); // → step 2
    expect(d.cert).toBeNull(); // 回退即作废上一份证明（同一步重新派生）
    expect(d.manualEnv).toEqual(ENV);
    d = preview(d, 777);
    expect(d.cert).toEqual(cert); // 同 seed 同配置 ⇒ 同证
  });

  it("换玩法不丢别的路径已填的值（三选一来回切换）", () => {
    let d = chooseMode(initialDraft(), "manual");
    d = withManualEnv(d, ENV);
    d = chooseMode(d, "custom");
    d = withCustomBirth(d, { birthYear: 1990, place: "大城", profile: PROFILE });
    d = chooseMode(d, "manual");
    expect(d.manualEnv).toEqual(ENV);
    d = chooseMode(d, "custom");
    expect(d.customBirth?.birthYear).toBe(1990);
  });
});

describe("出生证明八因素（DoD：八因素全显性）", () => {
  it("随机路径：八因素齐（出生年/南北/城乡/结构/父母职业/家境/家庭成员/种子码）", () => {
    const d = preview(chooseMode(initialDraft(), "random"), 20260101);
    const cert = d.cert!;
    expect(cert.birthYear).toBeGreaterThanOrEqual(1955);
    expect(cert.birthYear).toBeLessThanOrEqual(2015);
    expect(cert.profile.region).toBeTruthy();
    expect(cert.env.place).toBeTruthy();
    expect(cert.profile.structure).toBeTruthy();
    expect(cert.profile.parentsJob).toBeTruthy();
    expect(cert.profile.wealth).toBeTruthy();
    expect(cert.family.length).toBeGreaterThanOrEqual(1);
    expect(cert.seedCode).toMatch(/^XL-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
  });

  it("家庭成员与 generateFamily 同源（同 seed 同名单，逐位 role 非泛称）", () => {
    const seed = 4242;
    const d = preview(chooseMode(initialDraft(), "random"), seed);
    const cert = d.cert!;
    const fromEngine = generateFamily(cert.env, cert.birthYear, cert.profile, seed);
    expect(cert.family.map((m) => m.slot)).toEqual(fromEngine.map((n) => n.slot));
    expect(cert.family.map((m) => m.name)).toEqual(fromEngine.map((n) => n.name));
    for (const member of cert.family) {
      expect(["父母", "祖辈", "同辈", "家人"]).not.toContain(member.role);
    }
  });

  it("自定义路径：玩家填的因素一字不改地进证，且不给「再来一次」", () => {
    let d = chooseMode(initialDraft(), "custom");
    d = withCustomBirth(d, { birthYear: 1978, place: "县镇", profile: PROFILE });
    d = preview(d, 9001);
    const cert = d.cert!;
    expect(cert.birthYear).toBe(1978);
    expect(cert.env.place).toBe("县镇");
    expect(cert.profile).toEqual(PROFILE);
    expect(cert.rerollable).toBe(false);
  });

  it("手选路径：玩家 env 原样进证，出生年/画像由种子派生且可复现", () => {
    let d = chooseMode(initialDraft(), "manual");
    d = withManualEnv(d, ENV);
    const a = preview(d, 555).cert!;
    const b = preview(d, 555).cert!;
    expect(a).toEqual(b);
    expect(a.env).toEqual(ENV);
    expect(a.rerollable).toBe(true);
  });
});

describe("再来一次（DoD：确实改变结果）", () => {
  it("换种子 ⇒ 种子码必变；随机态八因素至少一项随之变", () => {
    const d = preview(chooseMode(initialDraft(), "random"), 111);
    const first = d.cert!;
    const next = reroll(d, 222).cert!;
    expect(next.seedCode).not.toBe(first.seedCode);
    const changed = [
      first.birthYear !== next.birthYear,
      first.profile.region !== next.profile.region,
      first.env.place !== next.env.place,
      first.profile.structure !== next.profile.structure,
      first.profile.parentsJob !== next.profile.parentsJob,
      first.profile.wealth !== next.profile.wealth,
      JSON.stringify(first.family) !== JSON.stringify(next.family),
    ].filter(Boolean).length;
    expect(changed).toBeGreaterThanOrEqual(1);
  });

  it("同一次「再来一次」的两张证可各自复算（同 seed 同证）", () => {
    const d = preview(chooseMode(initialDraft(), "random"), 111);
    const next = reroll(d, 222);
    expect(reroll(d, 222).cert).toEqual(next.cert);
  });

  it("自定义态重掷只换种子，玩家填的因素不变", () => {
    let d = chooseMode(initialDraft(), "custom");
    d = withCustomBirth(d, { birthYear: 1988, place: "大城", profile: PROFILE });
    d = preview(d, 10);
    const next = reroll(d, 11).cert!;
    expect(next.birthYear).toBe(1988);
    expect(next.profile).toEqual(PROFILE);
    expect(next.env.place).toBe("大城");
    expect(next.seedCode).not.toBe(d.cert!.seedCode);
  });
});

describe("年份尺点选（锁定出生年）", () => {
  it("点哪一年就生在那一年；「再来一次」不换已锁定的年", () => {
    const d = previewYear(initialDraft(), 333, 1972);
    expect(d.cert!.birthYear).toBe(1972);
    expect(d.mode).toBe("random");
    expect(d.pinnedYear).toBe(1972);
    const next = reroll(d, 444).cert!;
    expect(next.birthYear).toBe(1972);
    expect(next.seedCode).not.toBe(d.cert!.seedCode);
  });

  it("锁定的年份与 env.era 同段（envFromBirth 单源，不新增口径）", () => {
    const d = previewYear(initialDraft(), 333, 2015);
    expect(d.cert!.env.era).toBe("10s");
  });
});

describe("入场四件套（createRun 同构）", () => {
  it("startInput 直接喂 createRun 可建局，且出生年/画像/家庭与证一致", () => {
    const d = useCert(preview(chooseMode(initialDraft(), "random"), 888));
    const input = startInput(d);
    const run = createRun(input.env, input.seed, { birthYear: input.birthYear, profile: input.profile });
    expect(run.birthYear).toBe(d.cert!.birthYear);
    expect(run.profile).toEqual(d.cert!.profile);
    expect(run.npcs.map((n) => n.slot)).toEqual(d.cert!.family.map((m) => m.slot));
    expect(run.npcs.map((n) => n.name)).toEqual(d.cert!.family.map((m) => m.name));
  });

  it("没有出生证明时 startInput / useCert 不越界（原样返回/抛错清晰）", () => {
    const d = initialDraft();
    expect(useCert(d).step).toBe(1);
    expect(() => startInput(d)).toThrow(/出生证明/);
  });

  it("缺已填值就派不出证（不静默造一个默认出生）", () => {
    expect(() => preview(chooseMode(initialDraft(), "manual"), 1)).toThrow(/缺四要素/);
    expect(() => preview(chooseMode(initialDraft(), "custom"), 1)).toThrow(/缺八因素/);
    expect(() => preview(initialDraft(), 1)).toThrow(/还没选玩法/);
  });

  it("入场白只复述证上的事实（含出生年/城乡/结构/职业/家境）", () => {
    let c = chooseMode(initialDraft(), "custom");
    c = withCustomBirth(c, { birthYear: 1978, place: "县镇", profile: PROFILE });
    c = preview(c, 12);
    const line = openingLineOf(c.cert!);
    expect(line).toContain("1978");
    expect(line).toContain("县镇");
    expect(line).toContain(PROFILE.structure);
    expect(line).toContain(PROFILE.parentsJob);
    expect(line).toContain(PROFILE.wealth);
  });
});

describe("随机路径的种子可复现（同码同人生）", () => {
  it("同 seed 同证；不同 seed 至少一处不同", () => {
    const mode = chooseMode(initialDraft(), "random");
    const a = preview(mode, 2468).cert!;
    const b = preview(mode, 2468).cert!;
    expect(a).toEqual(b);
    let differing = 0;
    for (let s = 1; s <= 20; s++) {
      const c = preview(mode, s).cert!;
      if (JSON.stringify({ ...c, seed: 0, seedCode: "" }) !== JSON.stringify({ ...a, seed: 0, seedCode: "" })) differing += 1;
    }
    expect(differing).toBeGreaterThan(0);
  });
});
