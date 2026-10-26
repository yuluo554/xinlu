// 年份尺单测（v5 界面改造）：逐年一格的连续性、锚名接线、可选年域、十年分段。
import { describe, expect, it } from "vitest";
import eraRaw from "../data/era-events.json";
import type { EraEvent } from "../engine/model";
import { decadeBands, yearTicks } from "./years";

const ERA = eraRaw as unknown as EraEvent[];
const birthYears = Array.from({ length: 2015 - 1955 + 1 }, (_, i) => 1955 + i);

describe("yearTicks（76 年逐年一格）", () => {
  it("覆盖锚年全跨度且严格逐年连续（不跳年、不重复）", () => {
    const ticks = yearTicks(birthYears);
    const years = ERA.map((e) => e.year);
    expect(ticks[0]!.year).toBe(Math.min(...years));
    expect(ticks[ticks.length - 1]!.year).toBe(Math.max(...years));
    for (let i = 1; i < ticks.length; i++) expect(ticks[i]!.year).toBe(ticks[i - 1]!.year + 1);
  });

  it("每条锚都落到它那一年（锚数 = 表长，一年一锚不丢）", () => {
    const ticks = yearTicks(birthYears);
    const withAnchor = ticks.filter((t) => t.anchor);
    expect(withAnchor.length).toBe(ERA.length);
    for (const e of ERA) {
      expect(ticks.find((t) => t.year === e.year)?.anchor).toBe(e.titleHint);
    }
  });

  it("可选年域 = 出生年 1955–2015；域外年份只作刻度", () => {
    const ticks = yearTicks(birthYears);
    expect(ticks.find((t) => t.year === 1955)?.selectable).toBe(true);
    expect(ticks.find((t) => t.year === 2015)?.selectable).toBe(true);
    expect(ticks.find((t) => t.year === 2016)?.selectable).toBe(false);
    expect(ticks.find((t) => t.year === 2030)?.selectable).toBe(false);
  });

  it("无出生年入参时，轴仍铺满锚年跨度（全部不可选）", () => {
    const ticks = yearTicks([]);
    const years = ERA.map((e) => e.year);
    expect(ticks[0]!.year).toBe(Math.min(...years));
    expect(ticks[ticks.length - 1]!.year).toBe(Math.max(...years));
    expect(ticks.every((t) => t.selectable === false)).toBe(true);
  });
});

describe("decadeBands（十年分段）", () => {
  it("分段首尾相接，覆盖全部刻度，锚数合计 = 锚总数", () => {
    const ticks = yearTicks(birthYears);
    const bands = decadeBands(ticks);
    expect(bands[0]!.from).toBe(1950);
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i]!.from).toBe(bands[i - 1]!.from + 10);
      expect(bands[i]!.from).toBe(bands[i - 1]!.to + 1);
    }
    expect(bands.reduce((a, b) => a + b.anchors, 0)).toBe(ERA.length);
  });
});
