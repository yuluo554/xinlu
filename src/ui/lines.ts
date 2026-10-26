// 六线档位条（v5 界面改造；口径单源 plan/v3/02 §四 ▸ v5 增补一行）：
// 隐性进度 0–100 的可视化 = 值域**五等分**档位条（每档 20 点），只显档位不显数字。
// 这是纯表现量化（五等分），不新增门槛常数；线终态词仍走 engine 的 lineStateOf（0/1/30/80 四态）。
// fate（命运主线）不设进度，行内以一条实线表示「这一线是主干」，不给档位格。
import { LINE_KEYS, type LineKey, type LineProgress } from "../engine/model";
import { lineStateOf } from "../engine/values";
import { LINE_META } from "./timeline";

/** 档位格数（值域五等分，每格 20 点）。 */
export const LINE_BAR_CELLS = 5;

export interface LineBar {
  line: LineKey;
  label: string;
  cls: string;
  /** 填充格数 0–5；fate 恒 5（主干）。 */
  level: number;
  /** 线终态词（圆满/平顺/中断/未启；fate = 主线）；档位条不显示它，小结/终局用。 */
  word: string;
  isMain: boolean;
}

/** 单线档位：值域五等分向上取整（1 点也算「起」），0 → 空的。 */
export function lineLevel(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(LINE_BAR_CELLS, Math.ceil(Math.min(100, value) / (100 / LINE_BAR_CELLS)));
}

/** 六线档位（键序沿 LINE_KEYS：fate 在前，其后 study/career/love/friend/health）。 */
export function lineBars(lines: LineProgress): LineBar[] {
  return LINE_KEYS.map((line) => {
    const meta = LINE_META[line];
    if (line === "fate") {
      return { line, label: meta.label, cls: meta.cls, level: LINE_BAR_CELLS, word: "主线", isMain: true };
    }
    const value = lines[line] ?? 0;
    return {
      line,
      label: meta.label,
      cls: meta.cls,
      level: lineLevel(value),
      word: lineStateOf(value),
      isMain: false,
    };
  });
}
