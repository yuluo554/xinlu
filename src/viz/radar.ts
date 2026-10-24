// 四轴雷达图（plan/03 §5）：当前四维实线多边形 + 历史淡影虚线多边形。
// 轴方位：ei 上、sn 右、tf 下、jp 左；值 0 在圆心、100 在外沿，50 为虚线中立环。
import { DIM_KEYS, type DimKey, type Dims } from "../engine/model";
import { sanitize, svgEl } from "./svg";

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 88;

const ANGLES: Record<DimKey, number> = { ei: -90, sn: 0, tf: 90, jp: 180 };
const AXIS_LABEL: Record<DimKey, string> = { ei: "E–I", sn: "S–N", tf: "T–F", jp: "J–P" };

/**
 * 雷达几何单源导出(v2-M3' 分享卡复用,新增导出——不改 v1 既有函数)。
 * 口径:轴方位 ei 上/sn 右/tf 下/jp 左;值 0 在圆心、100 在外沿。
 */
export function radarVertex(dim: DimKey, value: number, cx: number, cy: number, radius: number): [number, number] {
  const rad = (ANGLES[dim] * Math.PI) / 180;
  const r = (sanitize(value) / 100) * radius;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function point(dim: DimKey, value: unknown): [number, number] {
  const rad = (ANGLES[dim] * Math.PI) / 180;
  const r = (sanitize(value) / 100) * RADIUS;
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

function polygonPoints(dims: Dims): string {
  return DIM_KEYS.map((d) => point(d, dims[d]).map((n) => n.toFixed(2)).join(",")).join(" ");
}

/** renderRadar(dims, el)：契约签名；past 为可选历史淡影（扩展参数，缺省不渲染淡影）。 */
export function renderRadar(dims: Dims, el: Element, past: readonly Dims[] = []): void {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${SIZE} ${SIZE}`,
    class: "viz-radar",
    role: "img",
    "aria-label": `四维雷达图：E-I ${sanitize(dims.ei)}、S-N ${sanitize(dims.sn)}、T-F ${sanitize(dims.tf)}、J-P ${sanitize(dims.jp)}`,
  });

  // 参考环：外沿与中立环（50，虚线）
  svg.appendChild(svgEl("polygon", { points: rimPolygon(), class: "radar-ring" }));
  svg.appendChild(svgEl("polygon", { points: rimPolygon(50), class: "radar-ring neutral" }));
  for (const dim of DIM_KEYS) {
    const [x, y] = point(dim, 100);
    svg.appendChild(svgEl("line", { x1: CENTER, y1: CENTER, x2: x, y2: y, class: "radar-spoke" }));
  }

  // 历史淡影（虚线空心）
  for (const ghost of past) {
    svg.appendChild(svgEl("polygon", { points: polygonPoints(ghost), class: "radar-ghost" }));
  }

  // 当前四维实线多边形 + 顶点
  svg.appendChild(svgEl("polygon", { points: polygonPoints(dims), class: "radar-now" }));
  for (const dim of DIM_KEYS) {
    const [x, y] = point(dim, dims[dim]);
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 3, class: "radar-dot" }));
  }

  // 轴端标签
  const LABEL_OFFSET = 16;
  for (const dim of DIM_KEYS) {
    const rad = (ANGLES[dim] * Math.PI) / 180;
    const t = svgEl("text", {
      x: (CENTER + (RADIUS + LABEL_OFFSET) * Math.cos(rad)).toFixed(2),
      y: (CENTER + (RADIUS + LABEL_OFFSET) * Math.sin(rad)).toFixed(2),
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    });
    t.textContent = AXIS_LABEL[dim];
    svg.appendChild(t);
  }

  el.appendChild(svg);
}

function rimPolygon(value = 100): string {
  return DIM_KEYS.map((d) => point(d, value).map((n) => n.toFixed(2)).join(",")).join(" ");
}
