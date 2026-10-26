// 开局屏的年份尺（v5 界面改造）：把 76 条年代锚按年铺成一条时间轴，每格一个年份 + 一句锚名。
// 数据单源 = src/data/era-events.json（engine 亦从此表派生时代卡），本档只做「年份 → 轴格」的排列，
// 不复写任何年份或文案。这是产品独有的内容：中国一段具体年代的人生起点，不是装饰。
import eraRaw from "../data/era-events.json" with { type: "json" };
import type { EraEvent } from "../engine/model";

const ERA_EVENTS = eraRaw as unknown as EraEvent[];

export interface YearTick {
  year: number;
  /** 该年的时代锚名字（如「粮票年代」）；缺锚年为 null（只画刻度）。 */
  anchor: string | null;
  /** 出生可选（birthYear 域 1955–2015）；域外年份只能作刻度。 */
  selectable: boolean;
}

/** 年份尺：轴跨度 = 锚年与出生年的并集（1955–2030），逐年一格。 */
export function yearTicks(years: readonly number[]): YearTick[] {
  const anchorYears = ERA_EVENTS.map((e) => e.year);
  const all = [...anchorYears, ...years];
  if (!all.length) return [];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const anchorOf = new Map<number, string>();
  for (const e of ERA_EVENTS) {
    if (!anchorOf.has(e.year)) anchorOf.set(e.year, e.titleHint);
  }
  const birthable = new Set(years);
  const out: YearTick[] = [];
  for (let y = min; y <= max; y++) {
    out.push({ year: y, anchor: anchorOf.get(y) ?? null, selectable: birthable.has(y) });
  }
  return out;
}

/** 年代带（每十年一段，标 1955 起的年代名），用来给年份尺分段读。 */
export interface DecadeBand {
  label: string;
  from: number;
  to: number;
  /** 该带内的锚数。 */
  anchors: number;
}

export function decadeBands(ticks: readonly YearTick[]): DecadeBand[] {
  const out: DecadeBand[] = [];
  for (const t of ticks) {
    const decadeStart = Math.floor(t.year / 10) * 10;
    const label = `${decadeStart} 年代`;
    const last = out[out.length - 1];
    if (last && last.from === decadeStart) {
      last.to = t.year;
      if (t.anchor) last.anchors += 1;
    } else {
      out.push({ label, from: decadeStart, to: t.year, anchors: t.anchor ? 1 : 0 });
    }
  }
  return out;
}
