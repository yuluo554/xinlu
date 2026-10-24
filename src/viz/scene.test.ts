// 场景氛围映射单测(v2-M3' 3.3:出生环境 → 水域背景;枚举键序单源 birth-map.json)。
import { describe, expect, it } from "vitest";
import birthMap from "../data/birth-map.json" with { type: "json" };
import { eraIndexOf, placeIndexOf, sceneBackdrop } from "./scene";

const ERAS = Object.keys(birthMap.era);
const PLACES = Object.keys(birthMap.place);

describe("sceneBackdrop(3.3:出生环境 → 水域背景)", () => {
  it("era 6 档 → brightness 单调抬升、hue 从 −10° 线性到 +10°(时代水温)", () => {
    const outs = ERAS.map((era) => sceneBackdrop({ era, place: PLACES[0]!, mood: "和睦", style: "宽容" }));
    expect(outs).toHaveLength(6);
    for (let i = 1; i < outs.length; i++) {
      const prev = outs[i - 1]!;
      const cur = outs[i]!;
      const bPrev = Number(prev.filter.match(/brightness\(([\d.]+)\)/)![1]);
      const bCur = Number(cur.filter.match(/brightness\(([\d.]+)\)/)![1]);
      expect(bCur).toBeGreaterThan(bPrev);
    }
    // 两端锚点:60s 最深冷、10s 最亮暖
    expect(outs[0]!.filter).toContain("brightness(0.70)");
    expect(outs[0]!.filter).toContain("hue-rotate(-10.0deg)");
    expect(outs[5]!.filter).toContain("brightness(1.05)");
    expect(outs[5]!.filter).toContain("hue-rotate(10.0deg)");
  });

  it("place 4 档 → 云层不透明度单调递减(大城最多、农村最少)", () => {
    const outs = PLACES.map((place) => sceneBackdrop({ era: ERAS[0]!, place, mood: "和睦", style: "宽容" }));
    expect(outs).toHaveLength(4);
    for (let i = 1; i < outs.length; i++) {
      expect(outs[i]!.cloudsOpacity).toBeLessThan(outs[i - 1]!.cloudsOpacity);
    }
    expect(outs[0]!.cloudsOpacity).toBeCloseTo(0.7);
    expect(outs[3]!.cloudsOpacity).toBeCloseTo(0.15);
  });

  it("未知 era/place 回落中位档(不抛错、不产生 NaN)", () => {
    const out = sceneBackdrop({ era: "20s", place: "外星", mood: "和睦", style: "宽容" });
    expect(out.filter).not.toMatch(/NaN|undefined/);
    expect(out.cloudsOpacity).toBeGreaterThan(0);
    expect(out.cloudsOpacity).toBeLessThan(1);
  });

  it("确定性:同环境两次调用全等", () => {
    const env = { era: "90s", place: "小城", mood: "紧张", style: "权威" };
    expect(sceneBackdrop(env)).toEqual(sceneBackdrop(env));
  });

  it("eraIndexOf/placeIndexOf:键序与 birth-map.json 一致,未知回落中位", () => {
    expect(eraIndexOf(ERAS[0]!)).toBe(0);
    expect(eraIndexOf(ERAS[5]!)).toBe(5);
    expect(eraIndexOf("nope")).toBe(3); // floor(6/2)
    expect(placeIndexOf(PLACES[3]!)).toBe(3);
    expect(placeIndexOf("nope")).toBe(2); // floor(4/2)
  });
});
