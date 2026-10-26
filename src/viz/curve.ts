// 四维演化曲线（plan/03 §5）：x = 抉择序（可选以出生初始值作 x=0 起点），y = 四维值 [0,100]。
// 四条折线 = 四个维度；参考线只画 0 / 50 / 100 三条；线端标维度字母 + 终值。
// v5 去装饰：一局 170+ 次抉择压在 290px 内会成锯齿，故按画布宽度做等距抽样（保留首末点与方向极值），
// 让线读起来是趋势而不是噪点；填充恒为 none（四维是四条线，不是四条面积）。
import { type DimKey, type Dims, type HistoryEntry } from "../engine/model";
import { sanitize, svgEl } from "./svg";

// 画幅加宽以容纳线端「E/I 62」终值标签；H 与上下 padding 不动（内高 160 是既有坐标口径）。
const W = 400;
const H = 200;
const PAD = { top: 14, right: 80, bottom: 26, left: 30 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

const SERIES: Array<{ dim: DimKey; label: string }> = [
  { dim: "ei", label: "E/I" },
  { dim: "sn", label: "S/N" },
  { dim: "tf", label: "T/F" },
  { dim: "jp", label: "J/P" },
];

/** 抽样上限：一行像素最多读这么多折点（再密就是噪点，不是趋势）。 */
const MAX_POINTS = 72;

/**
 * 等距抽样但保形：把序列切成 MAX_POINTS 个桶，每桶取 0–100 值域上离桶均值最远的真实点，
 * 于是尖峰与拐点不会因为抽稀被抹平；首末点必留。纯函数，可单测。
 */
export function thin(values: readonly Dims[], maxPoints = MAX_POINTS): Dims[] {
  if (values.length <= maxPoints) return [...values];
  const out: Dims[] = [values[0]!];
  const inner = values.slice(1, -1);
  const buckets = maxPoints - 2;
  const per = inner.length / buckets;
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor(b * per);
    const to = Math.max(from + 1, Math.floor((b + 1) * per));
    const bucket = inner.slice(from, to);
    if (!bucket.length) continue;
    // 桶内取「四维均值离桶均值最远」的那一点：拐点优先，噪声不优先
    const mean = bucket.reduce((a, d) => a + (d.ei + d.sn + d.tf + d.jp) / 4, 0) / bucket.length;
    let pick = bucket[0]!;
    let best = -1;
    for (const d of bucket) {
      const spread = Math.abs((d.ei + d.sn + d.tf + d.jp) / 4 - mean);
      if (spread > best) {
        best = spread;
        pick = d;
      }
    }
    out.push(pick);
  }
  out.push(values[values.length - 1]!);
  return out;
}

/** renderCurve(history, el)：契约签名；initial 为可选的出生初始值（作 x=0 起点）。 */
export function renderCurve(history: readonly HistoryEntry[], el: Element, initial?: Dims): void {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${W} ${H}`,
    class: "viz-curve",
    role: "img",
    "aria-label": "四维演化曲线",
  });

  const full: Dims[] = initial ? [initial, ...history.map((h) => h.dimsAfter)] : history.map((h) => h.dimsAfter);
  const values = thin(full);
  const n = values.length;
  const x = (i: number): number => PAD.left + (n <= 1 ? INNER_W / 2 : (i / (n - 1)) * INNER_W);
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
    // 线端标签按终值排序后互相让位（最小 12px 间隔），避免四条标签叠在一起
    const ends = SERIES.map((s) => ({ ...s, v: sanitize(lastEntry[s.dim]), y: y(lastEntry[s.dim]) })).sort(
      (a, b) => a.y - b.y,
    );
    const MIN_GAP = 12;
    for (let i = 1; i < ends.length; i++) {
      const prev = ends[i - 1]!;
      const cur = ends[i]!;
      if (cur.y - prev.y < MIN_GAP) cur.y = prev.y + MIN_GAP;
    }
    for (const s of SERIES) {
      const pts = values.map((d, i) => `${x(i).toFixed(2)},${y(d[s.dim]).toFixed(2)}`).join(" ");
      svg.appendChild(svgEl("polyline", { points: pts, class: `curve-line curve-${s.dim}` }));
    }
    for (const s of ends) {
      const end = svgEl("text", {
        x: W - PAD.right + 8,
        y: s.y.toFixed(2),
        "dominant-baseline": "middle",
        class: `curve-label curve-${s.dim}`,
      });
      end.textContent = `${s.label} ${s.v}`;
      svg.appendChild(end);
    }
  }

  el.appendChild(svg);
}
