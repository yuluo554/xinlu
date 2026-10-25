// 出生年历法纯函数（plan/v4/02 §一 ▸ M1''' 增补；口径表单源该节，本档只承载实现）。
// 零 DOM、零存储、零过网，属判定核邻接的展示派生层。
import type { BirthEnv } from "./model.ts";

/** 可选出生年域（plan/v4/02 §一）。 */
export const BIRTH_YEAR_MIN = 1955;
export const BIRTH_YEAR_MAX = 2015;

/** era 出生年区间（eraOf 归段表单源）：键 = birth-map era 枚举，值 = [min, max] 闭区间。 */
export const ERA_YEAR_RANGES: Record<string, [number, number]> = {
  "60s": [1955, 1969],
  "70s": [1970, 1979],
  "80s": [1980, 1989],
  "90s": [1990, 1999],
  "00s": [2000, 2009],
  "10s": [2010, 2015],
};

/** era 中值表（旧档迁移 birthYear 派生单源，plan/v4/02 §一 ▸ M1''' 增补）。 */
export const ERA_MID_YEAR: Record<string, number> = {
  "60s": 1965,
  "70s": 1975,
  "80s": 1985,
  "90s": 1995,
  "00s": 2005,
  "10s": 2012,
};

/** 出生年 → era 段（1955–1959 折入 60s，2010–2015 归 10s）。域外年份是调用方错误，直接抛错。 */
export function eraOf(birthYear: number): string {
  if (!Number.isInteger(birthYear) || birthYear < BIRTH_YEAR_MIN || birthYear > BIRTH_YEAR_MAX) {
    throw new Error(`eraOf：birthYear 越界 [${BIRTH_YEAR_MIN}, ${BIRTH_YEAR_MAX}]：${birthYear}`);
  }
  if (birthYear < 1970) return "60s";
  if (birthYear < 1980) return "70s";
  if (birthYear < 1990) return "80s";
  if (birthYear < 2000) return "90s";
  if (birthYear < 2010) return "00s";
  return "10s";
}

/** 运行时年份（plan/v4/02 §一）：birthYear + floor(ageMonths / 12)。 */
export function runYearOf(birthYear: number, ageMonths: number): number {
  return birthYear + Math.floor(ageMonths / 12);
}

/** 旧档（v2）迁移：era → 出生年中值。未知 era 是存档层错误，由调用方先校验。 */
export function eraMidYearOf(era: string): number {
  const mid = ERA_MID_YEAR[era];
  if (typeof mid !== "number") throw new Error(`eraMidYearOf：未知 era「${era}」`);
  return mid;
}

/** 手选页签出生年校验（BirthEnv 的 era 与 birthYear 必须同段：era = eraOf(birthYear)）。 */
export function eraMatchesYear(env: BirthEnv, birthYear: number): boolean {
  return eraOf(birthYear) === env.era;
}
