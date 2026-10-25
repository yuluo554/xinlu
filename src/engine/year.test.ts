// 出生年历法单测（plan/v4/02 §一 ▸ M1''' 增补；口径表单源该节）。
import { describe, expect, it } from "vitest";
import { BIRTH_YEAR_MAX, BIRTH_YEAR_MIN, ERA_MID_YEAR, ERA_YEAR_RANGES, eraMatchesYear, eraMidYearOf, eraOf, runYearOf } from "./year";

describe("eraOf 归段（1955–1959 折入 60s，2010–2015 归 10s）", () => {
  it("段边界逐点核对", () => {
    expect(eraOf(1955)).toBe("60s");
    expect(eraOf(1959)).toBe("60s");
    expect(eraOf(1969)).toBe("60s");
    expect(eraOf(1970)).toBe("70s");
    expect(eraOf(1979)).toBe("70s");
    expect(eraOf(1980)).toBe("80s");
    expect(eraOf(1989)).toBe("80s");
    expect(eraOf(1990)).toBe("90s");
    expect(eraOf(1999)).toBe("90s");
    expect(eraOf(2000)).toBe("00s");
    expect(eraOf(2009)).toBe("00s");
    expect(eraOf(2010)).toBe("10s");
    expect(eraOf(2015)).toBe("10s");
  });

  it("域外出生年直接抛错（不静默钳制）", () => {
    expect(() => eraOf(1954)).toThrow();
    expect(() => eraOf(2016)).toThrow();
    expect(() => eraOf(1990.5)).toThrow();
  });

  it("era 区间表与 eraOf 全量互恰（61 年逐年落段）", () => {
    for (const [era, [min, max]] of Object.entries(ERA_YEAR_RANGES)) {
      for (let y = min; y <= max; y++) expect(eraOf(y), `${y} 应落 ${era}`).toBe(era);
    }
    // 区间无缝覆盖可选出生年域
    const years = Object.values(ERA_YEAR_RANGES).flatMap(([min, max]) => {
      const out: number[] = [];
      for (let y = min; y <= max; y++) out.push(y);
      return out;
    });
    expect(years).toHaveLength(BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1);
  });
});

describe("eraMidYearOf（旧档迁移派生单源）", () => {
  it("六段中值逐项核对", () => {
    expect(ERA_MID_YEAR).toEqual({ "60s": 1965, "70s": 1975, "80s": 1985, "90s": 1995, "00s": 2005, "10s": 2012 });
    expect(eraMidYearOf("90s")).toBe(1995);
  });

  it("未知 era 抛错", () => {
    expect(() => eraMidYearOf("40s")).toThrow();
  });
});

describe("runYearOf（运行时年份）", () => {
  it("birthYear + floor(ageMonths/12)", () => {
    expect(runYearOf(1987, 0)).toBe(1987);
    expect(runYearOf(1987, 11)).toBe(1987);
    expect(runYearOf(1987, 12)).toBe(1988);
    expect(runYearOf(1987, 30)).toBe(1989);
    expect(runYearOf(1956, 14)).toBe(1957);
  });
});

describe("eraMatchesYear（env.era 与 birthYear 同段校验）", () => {
  it("同段 true / 跨段 false", () => {
    expect(eraMatchesYear({ era: "90s", place: "小城", mood: "和睦", style: "权威" }, 1994)).toBe(true);
    expect(eraMatchesYear({ era: "90s", place: "小城", mood: "和睦", style: "权威" }, 2001)).toBe(false);
  });
});
