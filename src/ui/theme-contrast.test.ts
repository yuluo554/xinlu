// 夜航主题 WCAG AA 抽验（v4-M2''' 2.1 出口门，plan/v4/02 §五「对比度过 WCAG AA」）。
// 色板单源在 src/style.css 主题块——本测试直接读 CSS 解析 [data-theme="night"] 的变量，
// 不复写色值（防双源漂移）；判据 = 关键前景/背景组合对比率 ≥4.5（正文 AA）。
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { THEMES } from "./theme";

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "style.css"), "utf8");

/** 抽取指定选择器块内的 16 进制 CSS 变量（纯字符串切片解析，不构造正则）。 */
function themeVars(selector: string): Record<string, string> {
  const head = CSS.indexOf(selector);
  expect(head, `style.css 应含 ${selector} 主题块`).toBeGreaterThanOrEqual(0);
  const open = CSS.indexOf("{", head);
  const close = CSS.indexOf("}", open);
  const body = CSS.slice(open + 1, close);
  const vars: Record<string, string> = {};
  for (const line of body.split(";")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("--")) continue;
    const colon = trimmed.indexOf(":");
    const name = trimmed.slice(2, colon);
    const value = trimmed.slice(colon + 1).trim();
    if (/^#[0-9a-fA-F]{6}$/.test(value)) vars[name] = value;
  }
  return vars;
}

/** WCAG 相对亮度与对比率（sRGB，标准公式）。 */
function luminance(hex: string): number {
  const n = hex.slice(1);
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg: string, bg: string): number {
  const pair = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  const hi = pair[0]!;
  const lo = pair[1]!;
  return (hi + 0.05) / (lo + 0.05);
}

describe("主题四款色板结构（style.css 单源）", () => {
  it("非默认三款各在位，且夜航块含五档色阶变量（主题联动依据）", () => {
    for (const id of ["moon", "night", "celadon"]) {
      expect(CSS.includes(`[data-theme="${id}"]`), `[data-theme="${id}"] 块缺失`).toBe(true);
    }
    const night = themeVars('[data-theme="night"]');
    for (let i = 1; i <= 5; i++) expect(night[`tier-${i}`], `夜航缺 --tier-${i}`).toBeTruthy();
  });

  it("代码内主题枚举与 CSS 块一一对应", () => {
    const ids = THEMES.map((t) => t.id);
    expect(ids).toContain("paper");
    for (const id of ids.filter((x) => x !== "paper")) {
      expect(CSS.includes(`[data-theme="${id}"]`)).toBe(true);
    }
  });
});

describe("夜航 WCAG AA 抽验（正文 4.5:1）", () => {
  const night = themeVars('[data-theme="night"]');
  const surface = night["surface"]!;
  const ground = night["ground"]!;

  it("正文墨色：ink 对 ground/surface、ink-2/ink-3 对 surface ≥4.5", () => {
    expect(contrast(night["ink"]!, ground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(night["ink"]!, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(night["ink-2"]!, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(night["ink-3"]!, surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("强调色作正文（stage-tag/链接 hover/四维增量）：accent 对 surface ≥4.5；按钮文字 on-accent 对 accent ≥4.5", () => {
    expect(contrast(night["accent"]!, surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(night["on-accent"]!, night["accent"]!)).toBeGreaterThanOrEqual(4.5);
  });

  it("五档色阶作档词正文（状态条 pill 底 = surface）≥4.5", () => {
    for (let i = 1; i <= 5; i++) {
      expect(contrast(night[`tier-${i}`]!, surface), `--tier-${i}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
