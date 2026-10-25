// 资源实感化单测（v4-M2''' 2.2）：积蓄换算表逐档边界 + 五档词阈值（口径单源 plan/v4/02 §四 + ▸ M2''' 增补）。
import { describe, expect, it } from "vitest";
import { moneyBandOf, moneyDeltaDisplay, moneyDisplay, moneyYuan, resDisplay, resTier } from "./resources";

describe("moneyBandOf（运行年份 → 换算档，边界含 2010+ 并入末档）", () => {
  it("按年代段切档：55–69/70–79/80–89/90–99/00–09/≥2010", () => {
    expect(moneyBandOf(1955)).toBe("60s");
    expect(moneyBandOf(1969)).toBe("60s");
    expect(moneyBandOf(1970)).toBe("70s");
    expect(moneyBandOf(1979)).toBe("70s");
    expect(moneyBandOf(1980)).toBe("80s");
    expect(moneyBandOf(1999)).toBe("90s");
    expect(moneyBandOf(2000)).toBe("00s");
    expect(moneyBandOf(2009)).toBe("00s");
    expect(moneyBandOf(2010)).toBe("10s");
    // 长寿局：2015 出生活到 2115，仍按末档（购买力基准不再细分）
    expect(moneyBandOf(2085)).toBe("10s");
    expect(moneyBandOf(2115)).toBe("10s");
  });
});

describe("moneyYuan / moneyDisplay（换算表 02 §四：线性插值 + 体面位数舍入）", () => {
  it("满值口径：raw=100 → 各档满值（0→¥2,000 … 10s→¥1,200,000）", () => {
    expect(moneyDisplay(100, "60s")).toBe("¥2,000");
    expect(moneyDisplay(100, "70s")).toBe("¥5,000");
    expect(moneyDisplay(100, "80s")).toBe("¥20,000");
    expect(moneyDisplay(100, "90s")).toBe("¥80,000");
    expect(moneyDisplay(100, "00s")).toBe("¥400,000");
    expect(moneyDisplay(100, "10s")).toBe("¥1,200,000");
  });

  it("raw=0 → ¥0；越界值按域边钳制", () => {
    expect(moneyDisplay(0, "90s")).toBe("¥0");
    expect(moneyYuan(-5, "90s")).toBe(0);
    expect(moneyYuan(150, "90s")).toBe(80000);
  });

  it("线性插值 + 千分位 + 档位步长舍入（90s：800/点、步长 500）", () => {
    expect(moneyDisplay(50, "90s")).toBe("¥40,000");
    expect(moneyDisplay(33, "90s")).toBe("¥26,500"); // 26,400 → 步长 500 → 26,500
    expect(moneyDisplay(1, "60s")).toBe("¥20");
    expect(moneyDisplay(1, "10s")).toBe("¥10,000"); // 12,000 → 步长 10,000 → 10,000
  });
});

describe("moneyDeltaDisplay（增损浮动口语化）", () => {
  it("非零带符号换算，零返回空串", () => {
    expect(moneyDeltaDisplay(8, "90s")).toBe("+¥6,500"); // 6,400 → 6,500
    expect(moneyDeltaDisplay(-2, "00s")).toBe("−¥8,000");
    expect(moneyDeltaDisplay(0, "90s")).toBe("");
  });
});

describe("resTier（五档词，02 §四：心境/健康同表）", () => {
  it("边界：19/20、39/40、60/61、79/80 落对档", () => {
    expect(resTier(0)).toEqual({ tier: 1, word: "萎靡" });
    expect(resTier(19)).toEqual({ tier: 1, word: "萎靡" });
    expect(resTier(20)).toEqual({ tier: 2, word: "低落" });
    expect(resTier(39)).toEqual({ tier: 2, word: "低落" });
    expect(resTier(40)).toEqual({ tier: 3, word: "平稳" });
    expect(resTier(60)).toEqual({ tier: 3, word: "平稳" });
    expect(resTier(61)).toEqual({ tier: 4, word: "良好" });
    expect(resTier(79)).toEqual({ tier: 4, word: "良好" });
    expect(resTier(80)).toEqual({ tier: 5, word: "高涨" });
    expect(resTier(100)).toEqual({ tier: 5, word: "高涨" });
  });
});

describe("resDisplay（状态条文案单源：money 换算元、mood/health 五档词）", () => {
  it("money → 金额；mood/health → 档词", () => {
    expect(resDisplay("money", 72, "90s")).toBe("¥57,500");
    expect(resDisplay("mood", 75, "90s")).toBe("良好");
    expect(resDisplay("health", 10, "10s")).toBe("萎靡");
  });
});
