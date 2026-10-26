// 六线档位条单测（v5 界面改造）：五等分档位（每格 20 点）、fate 主干恒满、键序与线终态词接线。
// 口径纪律：本档只做「隐性进度 → 档位数」的纯表现量化（plan/v3/02 §四 ▸ v5 增补一行），
// 终态词直取 engine 的 lineStateOf（四态阈值 0/1/30/80 不在本档复写）。
import { describe, expect, it } from "vitest";
import { LINE_KEYS, type LineProgress } from "../engine/model";
import { LINE_BAR_CELLS, lineBars, lineLevel } from "./lines";

const lines = (p: Partial<LineProgress>): LineProgress => ({
  study: 0,
  career: 0,
  love: 0,
  friend: 0,
  health: 0,
  ...p,
});

describe("lineLevel（值域五等分，每格 20 点）", () => {
  it("边界逐格：0/1/20/21/40/41/60/80/100", () => {
    expect(lineLevel(0)).toBe(0);
    expect(lineLevel(1)).toBe(1);
    expect(lineLevel(20)).toBe(1);
    expect(lineLevel(21)).toBe(2);
    expect(lineLevel(40)).toBe(2);
    expect(lineLevel(41)).toBe(3);
    expect(lineLevel(60)).toBe(3);
    expect(lineLevel(80)).toBe(4);
    expect(lineLevel(100)).toBe(5);
  });

  it("越界与非数值入参钳制/归零，不产生 NaN", () => {
    expect(lineLevel(-5)).toBe(0);
    expect(lineLevel(140)).toBe(5);
    expect(lineLevel(Number.NaN)).toBe(0);
  });

  it("格数上限与 LINE_BAR_CELLS 一致", () => {
    expect(LINE_BAR_CELLS).toBe(5);
  });
});

describe("lineBars（六线档位视图模型）", () => {
  it("恒为六线且键序 = LINE_KEYS（fate 在前）", () => {
    const bars = lineBars(lines({}));
    expect(bars.map((b) => b.line)).toEqual([...LINE_KEYS]);
  });

  it("fate 是主干：恒满格、词为「主线」、不参与进度", () => {
    const fate = lineBars(lines({ study: 100 })).find((b) => b.line === "fate")!;
    expect(fate.level).toBe(LINE_BAR_CELLS);
    expect(fate.word).toBe("主线");
    expect(fate.isMain).toBe(true);
  });

  it("支线档位与终态词同源：0→未启 / 1–29→中断 / 30–79→平顺 / ≥80→圆满", () => {
    const bars = lineBars(lines({ study: 0, career: 12, love: 45, friend: 85, health: 100 }));
    const by = (l: string) => bars.find((b) => b.line === l)!;
    expect(by("study").word).toBe("未启");
    expect(by("career").word).toBe("中断");
    expect(by("love").word).toBe("平顺");
    expect(by("friend").word).toBe("圆满");
    expect(by("health").word).toBe("圆满");
    // 档位单调不减于数值
    expect(by("study").level).toBe(0);
    expect(by("career").level).toBe(1);
    expect(by("love").level).toBe(3);
    expect(by("friend").level).toBe(5);
  });

  it("缺键按 0 处理（老档/迁移档不崩）", () => {
    const partial = { study: 30 } as unknown as LineProgress;
    const bars = lineBars(partial);
    expect(bars).toHaveLength(6);
    expect(bars.find((b) => b.line === "career")!.level).toBe(0);
  });
});
