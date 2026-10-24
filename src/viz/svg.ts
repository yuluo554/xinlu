// viz 共享原语：SVG 节点构造与值域消毒。只用 createElementNS / setAttribute / appendChild /
// textContent 四个 DOM 面，单测以最小桩替换 document 即可断言（plan/03 §5，零第三方图表库）。
export const SVG_NS = "http://www.w3.org/2000/svg";

export function svgEl(
  tag: string,
  attrs: Record<string, string | number> = {},
): SVGElement {
  const node = document.createElementNS(SVG_NS, tag) as SVGElement;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

/**
 * 值域消毒：非有限值归中（50），越界钳制到 [0,100]。
 * 图形属性只允许从这里取数——任何越界/脏数据都不可能以 NaN 落进属性（单测钉死）。
 */
export function sanitize(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}
