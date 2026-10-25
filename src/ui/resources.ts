// 资源实感化（v4-M2''' 2.2，口径单源 plan/v4/02 §四 + ▸ M2''' 增补）：积蓄 [0,100] → 按运行年份
// 年代段换算「元」；心境/健康五档词。纯函数、零 DOM；阈值与换算表只在本档与 02 §四两处成对出现
// （02 定口径、本档承载实现，测试对边界对账）。
import type { ResKey } from "../engine/model";

/** 年代段键（按运行年份划档；2010 及以后并入末档——锚覆盖到 2030，之后购买力基准不再细分）。 */
export type MoneyBand = "60s" | "70s" | "80s" | "90s" | "00s" | "10s";

/** 换算表（02 §四：raw=100 对应该档满值）+ 体面位数舍入步长（▸ M2''' 增补）。 */
const MONEY_TABLE: Record<MoneyBand, { full: number; step: number }> = {
  "60s": { full: 2_000, step: 10 },
  "70s": { full: 5_000, step: 50 },
  "80s": { full: 20_000, step: 100 },
  "90s": { full: 80_000, step: 500 },
  "00s": { full: 400_000, step: 2_000 },
  "10s": { full: 1_200_000, step: 10_000 },
};

/** 运行年份 → 换算档（55–69 / 70–79 / 80–89 / 90–99 / 00–09 / ≥2010；比 1955 更早不存在）。 */
export function moneyBandOf(year: number): MoneyBand {
  if (!Number.isFinite(year) || year < 1970) return "60s";
  if (year < 1980) return "70s";
  if (year < 1990) return "80s";
  if (year < 2000) return "90s";
  if (year < 2010) return "00s";
  return "10s";
}

/** 千分位分组（整数金额展示口径：¥8,000）。 */
function group(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 积蓄换算：[0,100] 线性插值到该档满值，四舍五入到体面位数步长。越界 raw 按域边处理。 */
export function moneyYuan(raw: number, band: MoneyBand): number {
  const { full, step } = MONEY_TABLE[band];
  const clamped = Math.min(100, Math.max(0, raw));
  const exact = (clamped / 100) * full;
  return Math.round(exact / step) * step;
}

/** 状态条积蓄展示：「¥8,000」（02 §四：文案引用积蓄一律用换算后口语）。 */
export function moneyDisplay(raw: number, band: MoneyBand): string {
  return `¥${group(moneyYuan(raw, band))}`;
}

/** 增损浮动积蓄文案：「+¥800」/「−¥400」（数值只在浮动层出现的口径，换算后展示）。 */
export function moneyDeltaDisplay(delta: number, band: MoneyBand): string {
  if (delta === 0) return "";
  const sign = delta > 0 ? "+" : "−";
  return `${sign}¥${group(moneyYuan(Math.abs(delta), band))}`;
}

// ── 五档词色阶（02 §四：心境/健康同表；阈值口径仅存该表）──

export interface ResTier {
  tier: 1 | 2 | 3 | 4 | 5;
  word: string;
}

const TIER_WORDS = ["萎靡", "低落", "平稳", "良好", "高涨"] as const;

/** 五档归档：<20 萎靡 / <40 低落 / 40–60 平稳 / <80 良好 / ≥80 高涨。 */
export function resTier(value: number): ResTier {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  const tier = v < 20 ? 1 : v < 40 ? 2 : v <= 60 ? 3 : v < 80 ? 4 : 5;
  return { tier: tier as ResTier["tier"], word: TIER_WORDS[tier - 1]! };
}

/** 资源键 → 状态条文案（mood/health 五档词；money 换算元——口语化引用单源此函数）。 */
export function resDisplay(key: ResKey, value: number, band: MoneyBand): string {
  if (key === "money") return moneyDisplay(value, band);
  return resTier(value).word;
}
