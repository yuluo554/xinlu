// 夜航主题 WCAG AA 抽验（v4-M2''' 2.1 出口门，plan/v4/02 §五「对比度过 WCAG AA」）。
// 色板单源在 src/style.css 主题块——本测试直接读 CSS 解析 [data-theme="night"] 的变量，
// 不复写色值（防双源漂移）；判据 = 关键前景/背景组合对比率 ≥4.5（正文 AA）。
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { THEMES } from "./theme";

const CSS = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "style.css"), "utf8");

/** 抽取指定选择器块内的 16 进制 CSS 变量（纯字符串切片解析，不构造正则）。
 *  先剥掉块内注释：注释行后面的第一条变量若被注释黏住会整条漏采（:root 的 --ground/--ink 就是这种）。 */
function themeVars(selector: string): Record<string, string> {
  const head = CSS.indexOf(selector);
  expect(head, `style.css 应含 ${selector} 主题块`).toBeGreaterThanOrEqual(0);
  const open = CSS.indexOf("{", head);
  const close = CSS.indexOf("}", open);
  const body = stripComments(CSS.slice(open + 1, close));
  const vars: Record<string, string> = {};
  for (const line of body.split(";")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("--")) continue;
    const colon = trimmed.indexOf(":");
    const name = trimmed.slice(2, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    if (/^#[0-9a-fA-F]{6}$/.test(value)) vars[name] = value;
  }
  return vars;
}

/** 去掉 CSS 注释（逐段扫，不用正则回溯）。 */
function stripComments(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf("/*", i);
    if (start < 0) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, start);
    const end = text.indexOf("*/", start + 2);
    if (end < 0) break;
    i = end + 2;
  }
  return out;
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

describe("素纸主题（D8，plan/v5/02 §七）：无纹理 + 四款提对比", () => {
  /** 取 themeVars 并回落 :root（主题块只覆盖差异项时，等价于浏览器继承）。 */
  const rootVars = themeVars(":root");
  const varsOf = (selector: string): Record<string, string> => {
    if (selector === ":root") return rootVars;
    const own = themeVars(selector);
    const out: Record<string, string> = {};
    for (const key of new Set([...Object.keys(rootVars), ...Object.keys(own)])) {
      const v = own[key] ?? rootVars[key];
      if (v) out[key] = v;
    }
    return out;
  };

  it("纹理已关：--tex-wash: 0，且样式表里没有 body::before 纹理层（无背景图/无纹理 URL）", () => {
    const head = CSS.indexOf(":root");
    const open = CSS.indexOf("{", head);
    const close = CSS.indexOf("}", open);
    const body = CSS.slice(open + 1, close).replace(/\/\*[\s\S]*?\*\//g, "");
    const at = body.indexOf("--tex-wash");
    expect(at, "style.css 的 :root 应保留 --tex-wash token（素纸的机检事实）").toBeGreaterThanOrEqual(0);
    const colon = body.indexOf(":", at);
    const semi = body.indexOf(";", colon);
    expect(body.slice(colon + 1, semi).trim()).toBe("0");
    expect(CSS.includes("body::before"), "纹理层伪元素应已删除（素纸无纹理）").toBe(false);
    expect(CSS.includes("parchment"), "样式表不应再引用 parchment 纹理素材").toBe(false);
    expect(CSS.includes("--tex-opacity"), "旧的 --tex-opacity 纹理强度 token 应已删除").toBe(false);
  });

  it("四款主题正文墨色对纸面/白页均 ≥7:1（素纸提对比口径）", () => {
    for (const [label, selector] of [
      ["米纸", ":root"],
      ["月白", '[data-theme="moon"]'],
      ["夜航", '[data-theme="night"]'],
      ["青瓷", '[data-theme="celadon"]'],
    ] as const) {
      const v = varsOf(selector);
      expect(contrast(v["ink"]!, v["ground"]!), `${label} ink/ground`).toBeGreaterThanOrEqual(7);
      expect(contrast(v["ink"]!, v["surface"]!), `${label} ink/surface`).toBeGreaterThanOrEqual(7);
    }
  });

  it("四款主题次级墨色（ink-2 / ink-3）对白页 ≥4.5:1（正文级 AA，不靠放大字号兜底）", () => {
    for (const [label, selector] of [
      ["米纸", ":root"],
      ["月白", '[data-theme="moon"]'],
      ["夜航", '[data-theme="night"]'],
      ["青瓷", '[data-theme="celadon"]'],
    ] as const) {
      const v = varsOf(selector);
      expect(contrast(v["ink-2"]!, v["surface"]!), `${label} ink-2/surface`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(v["ink-3"]!, v["surface"]!), `${label} ink-3/surface`).toBeGreaterThanOrEqual(4.5);
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
