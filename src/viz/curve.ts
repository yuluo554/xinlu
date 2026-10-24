// 四维演化曲线（plan/03 §5）：x = 抉择序（可选以出生初始值作 x=0 起点），y = 四维值 [0,100]。
// 四条折线 = 四个维度，线端标维度字母；参考线只画 0 / 50 / 100 三条。
import { type DimKey, type Dims, type HistoryEntry } from "../engine/model";
import { sanitize, svgEl } from "./svg";

const W = 360;
const H = 200;
const PAD = { top: 14, right: 40, bottom: 26, left: 30 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

const SERIES: Array<{ dim: DimKey; label: string }> = [
  { dim: "ei", label: "E/I" },
  { dim: "sn", label: "S/N" },
  { dim: "tf", label: "T/F" },
  { dim: "jp", label: "J/P" },
];

/** renderCurve(history, el)：契约签名；initial 为可选的出生初始值（作 x=0 起点）。 */
export function renderCurve(history: readonly HistoryEntry[], el: Element, initial?: Dims): void {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "viz-curve",
    role: "img",
    "aria-label": "四维演化曲线",
  });

  const values: Dims[] = initial ? [initial, ...history.map((h) => h.dimsAfter)] : history.map((h) => h.dimsAfter);
  const n = values.length;
  const x = (i: number): number =>
    PAD.left + (n <= 1 ? INNER_W / 2 : (i / (n - 1)) * INNER_W);
  const y = (v: unknown): number => PAD.top + ((100 - sanitize(v)) / 100) * INNER_H;

  for (const [v, label] of [[0, "0"], [50, "50"], [100, "100"]] as const) {
    const gy = y(v).toFixed(2);
    svg.appendChild(svgEl("line", { x1: PAD.left, x2: W - PAD.right, y1: gy, y2: gy, class: "curve-grid" }));
    const t = svgEl("text", { x: PAD.left - 6, y: gy, "text-anchor": "end", "dominant-baseline": "middle" });
    t.textContent = label;
    svg.appendChild(t);
  }

  if (n > 0) {
    const lastEntry = values[n - 1]!;
    for (const s of SERIES) {
      const pts = values.map((d, i) => `${x(i).toFixed(2)},${y(d[s.dim]).toFixed(2)}`).join(" ");
      svg.appendChild(svgEl("polyline", { points: pts, class: `curve-line curve-${s.dim}` }));
      const end = svgEl("text", {
        x: W - PAD.right + 8,
        y: y(lastEntry[s.dim]).toFixed(2),
        "dominant-baseline": "middle",
        class: `curve-label curve-${s.dim}`,
      });
      end.textContent = s.label;
      svg.appendChild(end);
    }
  }

  el.appendChild(svg);
}
