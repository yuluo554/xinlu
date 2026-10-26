// 卡片三层结构单测（plan/v5/02 §六）：L1 正文焦点（字号/留白/行宽 ≤34 字）、L2 操作（变体控件）、
// L3 辅助弱化（状态条默认折叠为细线，点开才是三项读数）。
// 判据面对 = 样式表与屏幕装配的**结构事实**（CSS 块 + 模板片段），不是渲染像素：
// 像素级观感由 E2E（三档截图 + 展开对账）守，这里守「口径没了会红」的那一半。
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(HERE, "..", "style.css"), "utf8");
const SCREENS = readFileSync(join(HERE, "screens.ts"), "utf8");

/** 取某个选择器块（首个匹配）的声明体；找不到返回空串。 */
function block(selector: string): string {
  const head = CSS.indexOf(selector);
  if (head < 0) return "";
  const open = CSS.indexOf("{", head);
  if (open < 0) return "";
  const close = CSS.indexOf("}", open);
  return CSS.slice(open + 1, close);
}

/** em 数值（max-width 口径）：只认纯数字 + em，其他形态交给其他门。 */
function emOf(decl: string, prop: string): number | null {
  const at = decl.indexOf(prop);
  if (at < 0) return null;
  const colon = decl.indexOf(":", at);
  const semi = decl.indexOf(";", colon);
  const value = decl.slice(colon + 1, semi).trim();
  if (!value.endsWith("em")) return null;
  const n = Number(value.slice(0, -2));
  return Number.isFinite(n) ? n : null;
}

describe("L1 正文焦点（大字号 + 行宽 ≤34 字）", () => {
  it(".event-text 的 max-width 是 ≤34em（汉字宽 ≈ 1em，即一行 ≤34 字）", () => {
    const body = block(".event-text {") || block(".event-text");
    expect(body, ".event-text 块缺失").not.toBe("");
    const em = emOf(body, "max-width");
    expect(em, `.event-text 的 max-width 应为 em 值（实得 ${body.match(/max-width:[^;]+/)?.[0] ?? "无"}）`).not.toBeNull();
    expect(em!).toBeLessThanOrEqual(34);
    expect(em!).toBeGreaterThanOrEqual(20); // 过窄会碎成短行，同样不好读
  });

  it("正文比次级文字大一档以上（L1 视觉焦点，不靠加粗边框）", () => {
    const body = block(".event-text {") || block(".event-text");
    expect(body.includes("var(--fs-section)"), `.event-text 字号应为 --fs-section（L1 焦点档），实得 ${body.match(/font-size:[^;]+/)?.[0] ?? "无"}`).toBe(true);
    // 细看层（L2 之下的原文层）比正文小：焦点只有一处
    const detail = block(".ev-detail-text {") || block(".ev-detail-text");
    expect(detail.includes("1rem"), ".ev-detail-text 应为 1rem（小于正文焦点档）").toBe(true);
  });

  it("细看层用原生 <details> 承载（内容零损失，展开不换页）", () => {
    expect(SCREENS.includes('<details class="ev-detail" data-detail>'), "卡片应渲染 <details data-detail> 细看层").toBe(true);
    expect(SCREENS.includes('class="ev-detail-text"'), "细看层应有原文容器").toBe(true);
  });
});

describe("L3 辅助弱化（状态条默认折叠为细线）", () => {
  it("状态条包在 <details data-statebar-fold> 里，且三项读数在折叠层内部", () => {
    // 折叠壳必须是 <details>（原生可展开，无脚本依赖）
    expect(
      SCREENS.indexOf('<details class="statebar-fold" data-statebar-fold>'),
      "折叠壳应为 <details data-statebar-fold>",
    ).toBeGreaterThanOrEqual(0);
    // 在返回的模板串里：折叠壳先开，.statebar 后开（= statebar 是 details 的子节点，收起时一并隐藏）
    const ret = SCREENS.indexOf('return `<details class="statebar-fold" data-statebar-fold>');
    expect(ret, "折叠壳应是状态条模板的根节点（return 的第一个标签）").toBeGreaterThanOrEqual(0);
    const barAt = SCREENS.indexOf('<div class="statebar" role="status"');
    expect(barAt, ".statebar 容器缺失").toBeGreaterThan(ret);
    // 三项读数（items 里的 res-word）在 .statebar 内 → 只有展开 details 才可见
    const itemsAt = SCREENS.indexOf("const items = RES_KEYS.map");
    expect(itemsAt).toBeGreaterThanOrEqual(0);
    expect(SCREENS.indexOf('class="res-word"', itemsAt)).toBeGreaterThan(itemsAt);
  });

  it("折叠摘要是一条细线 + 三枚档位点（不抢注意力但一眼知异常）", () => {
    const sum = block(".statebar-sum {") || block(".statebar-sum");
    expect(sum, ".statebar-sum 块缺失").not.toBe("");
    expect(sum.includes("list-style: none"), "摘要行应去掉默认三角标记（换细线表达）").toBe(true);
    const rule = block(".sb-rule {") || block(".sb-rule");
    expect(rule.includes("height: 1px"), "细线应为 1px（L3 = 一条细线）").toBe(true);
    expect(SCREENS.includes("data-sb-dot"), "摘要应渲染档位点（data-sb-dot × 3）").toBe(true);
  });

  it("折叠壳默认不展开（不带 open 属性）", () => {
    expect(SCREENS.includes('data-statebar-fold open'), "折叠壳不应默认 open（L3 默认收起）").toBe(false);
  });
});

describe("阅读偏好与卡片层级的联动（plan/v5/02 §七 ▸ 设置页补全）", () => {
  it("大字档只放大字号档位，不改行宽口径（层级不因偏好漂移）", () => {
    const large = block('[data-font="large"] {') || block('[data-font="large"]');
    expect(large, "[data-font=large] 块缺失").not.toBe("");
    expect(large.includes("--fs-body"), "大字档应抬 --fs-body").toBe(true);
    expect(large.includes("max-width"), "大字档不应改行宽（层级口径不与偏好耦合）").toBe(false);
  });

  it("减弱动效档关掉换屏与浮动动画（信息一个不少）", () => {
    const reduced = block('[data-motion="reduced"] .screen,');
    expect(reduced, "[data-motion=reduced] 块缺失").not.toBe("");
    expect(reduced.includes("animation: none"), "减弱动效应置 animation: none").toBe(true);
  });
});
