// 分享卡布局纯函数单测(v2/03 §3 验收:canvas stub 只测计算结果,不测像素)。
import { describe, expect, it } from "vitest";
import type { Dims } from "../engine/model";
import { radarVertex } from "../viz/radar";
import { FRAMES } from "../viz/fish";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  WATERMARK_MAX,
  computeShareCardLayout,
  estimateTextWidth,
  shareCardFileName,
  wrapText,
  type ShareCardInput,
} from "./share-card";

const dims = (ei: number, sn: number, tf: number, jp: number): Dims => ({ ei, sn, tf, jp });

const input = (over: Partial<ShareCardInput> = {}): ShareCardInput => ({
  title: "人群里的执炬者",
  letters: "ENFJ",
  dims: dims(80, 30, 90, 60),
  portrait: "你走到哪里，哪里的气氛就亮起来。你记得每个人的名字和心事。",
  criticals: [
    { q: "问题一", a: "答案一" },
    { q: "问题二", a: "答案二" },
    { q: "问题三", a: "答案三" },
    { q: "问题四", a: "答案四" },
    { q: "问题五", a: "答案五" },
  ],
  frame: "04",
  date: new Date(2026, 9, 24),
  ...over,
});

// 等宽 stub:每字符固定 10px,折行结果可精确预期。
const fixedMeasure: Parameters<typeof computeShareCardLayout>[1] = (text) => text.length * 10;

describe("02 §四规格:画布与硬性尺寸", () => {
  it("画布 1080×1440(3:4 竖版)", () => {
    const l = computeShareCardLayout(input(), fixedMeasure);
    expect(l.width).toBe(1080);
    expect(l.height).toBe(1440);
    expect(CARD_WIDTH).toBe(1080);
    expect(CARD_HEIGHT).toBe(1440);
  });

  it("水印印制 ≤120px 且在左下角", () => {
    const l = computeShareCardLayout(input(), fixedMeasure);
    expect(l.watermark.size).toBeLessThanOrEqual(WATERMARK_MAX);
    expect(WATERMARK_MAX).toBe(120);
    expect(l.watermark.x).toBeLessThan(l.width / 2);
    expect(l.watermark.y).toBeGreaterThan(l.height / 2);
  });

  it("鱼主视觉印终局帧,帧 URL 在 FRAMES 域(素材与 mascot 同源)", () => {
    const l = computeShareCardLayout(input(), fixedMeasure);
    expect(Object.keys(FRAMES)).toContain(l.fish.frame);
    expect(FRAMES[l.fish.frame]).toBeTruthy();
  });

  it("导出文件名口径 xinlu-<mbti>-<yyyymmdd>.png", () => {
    expect(shareCardFileName("ENFJ", new Date(2026, 0, 2))).toBe("xinlu-ENFJ-20260102.png");
    expect(shareCardFileName("ISTP", new Date(2026, 9, 24))).toBe("xinlu-ISTP-20261024.png");
  });
});

describe("布局纯函数计算", () => {
  it("关键抉择取前 3 条(输入 5 条 → 3 条;0 条 → 空),问答超长单行截断加省略号", () => {
    const l = computeShareCardLayout(input(), fixedMeasure);
    expect(l.criticals).toHaveLength(3);
    expect(l.criticals[0]!.q.text).toBe("问题一");
    expect(l.criticals[2]!.a.text).toContain("答案三");
    const long = computeShareCardLayout(
      input({ criticals: [{ q: "问".repeat(120), a: "答".repeat(120) }] }),
      fixedMeasure,
    );
    expect(long.criticals[0]!.q.text.endsWith("…")).toBe(true);
    expect(long.criticals[0]!.q.text.length).toBeLessThan(120);
    expect(long.criticals[0]!.a.text.endsWith("…")).toBe(true);
    const empty = computeShareCardLayout(input({ criticals: [] }), fixedMeasure);
    expect(empty.criticals).toHaveLength(0);
  });

  it("最后一条抉择与左下水印不重叠(布局回归守护)", () => {
    const l = computeShareCardLayout(input(), fixedMeasure);
    const last = l.criticals[l.criticals.length - 1];
    expect(last!.a.y + 30).toBeLessThanOrEqual(l.watermark.y + 6);
  });

  it("画像句折行 ≤4 行且行宽不超内容区", () => {
    const long = computeShareCardLayout(
      input({ portrait: "一".repeat(80) }),
      fixedMeasure,
    );
    expect(long.portrait.lines.length).toBeLessThanOrEqual(4);
    for (const line of long.portrait.lines) {
      expect(fixedMeasure(line, long.portrait.size)).toBeLessThanOrEqual(1080 - 160);
    }
  });

  it("雷达顶点与 radarVertex 同源复算一致(ei 上/sn 右/tf 下/jp 左;ring=100 中立=50)", () => {
    const l = computeShareCardLayout(input(), fixedMeasure);
    const d = dims(80, 30, 90, 60);
    l.radar.now.forEach(([x, y], i) => {
      const keys = ["ei", "sn", "tf", "jp"] as const;
      const vals = [80, 30, 90, 60] as const;
      const [ex, ey] = radarVertex(keys[i]!, vals[i]!, l.radar.cx, l.radar.cy, l.radar.radius);
      expect(x).toBeCloseTo(ex);
      expect(y).toBeCloseTo(ey);
    });
    const [tx, ty] = radarVertex("ei", 100, l.radar.cx, l.radar.cy, l.radar.radius);
    expect(l.radar.ring[0]![1]).toBeCloseTo(ty); // ei=100 → 正上方(ring 顶点 y 最小)
    expect(l.radar.ring[0]![0]).toBeCloseTo(l.radar.cx);
    const [nx] = radarVertex("sn", 50, l.radar.cx, l.radar.cy, l.radar.radius);
    expect(l.radar.neutral[1]![0]).toBeCloseTo(nx); // sn=50 → 右侧一半
    expect(l.radar.neutral).toHaveLength(4);
  });

  it("型号/标题/横幅文本透传", () => {
    const l = computeShareCardLayout(input(), fixedMeasure);
    expect(l.letters.text).toBe("ENFJ");
    expect(l.title.text).toBe("人群里的执炬者");
    expect(l.banner.text).toContain("心路");
  });
});

describe("折行与度量", () => {
  it("estimateTextWidth:CJK 全宽、ASCII 半宽", () => {
    expect(estimateTextWidth("中文", 10)).toBe(20);
    expect(estimateTextWidth("ab", 10)).toBe(11);
  });

  it("wrapText:超宽即换行,空串回单空行", () => {
    expect(wrapText("aaaaaaaaa", 30, 10, fixedMeasure)).toEqual(["aaa", "aaa", "aaa"]);
    expect(wrapText("aaaaaaaaaa", 30, 10, fixedMeasure)).toEqual(["aaa", "aaa", "aaa", "a"]);
    expect(wrapText("", 30, 10, fixedMeasure)).toEqual([""]);
  });

  it("确定性:同输入两次布局全等", () => {
    expect(computeShareCardLayout(input(), fixedMeasure)).toEqual(computeShareCardLayout(input(), fixedMeasure));
  });
});
