// 终局分享卡(v2/02 §四规格实现):纯客户端 Canvas 生成 1080×1440 PNG,零上传。
// 结构纪律:布局计算纯函数(computeShareCardLayout,可 canvas stub 单测)与绘制(drawShareCard)分离;
// 雷达顶点复用 viz/radar.ts 的 radarVertex(轴方位/值域口径单源,不在本文件复写);
// 水印印制尺寸 ≤120px(规格字面),文件名口径 xinlu-<mbti>-<yyyymmdd>.png。
import { DIM_KEYS, type Dims } from "../engine/model";
import { radarVertex } from "../viz/radar";
import { FRAMES } from "../viz/fish";
import watermarkUrl from "../../assets/dafeiyu/fish/watermark.webp";

const WATERMARK_URL: string = watermarkUrl;

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1440;
/** 水印印制上限(02 §四:尺寸 ≤120px)。 */
export const WATERMARK_MAX = 120;

export interface ShareCardInput {
  /** 终局标题(resolveEnding().title)。 */
  title: string;
  /** 型号四字母(endingLetters 口径)。 */
  letters: string;
  /** 终局四维。 */
  dims: Dims;
  /** 画像一句话(portraits.json 复用)。 */
  portrait: string;
  /** 关键抉择(问答对,布局取前 3 条)。 */
  criticals: Array<{ q: string; a: string }>;
  /** 终局表情帧名(fish-mood-map ending 锁表键,FRAMES 域)。 */
  frame: string;
  /** 导出日期(文件名 yyyymmdd 口径;注入以便纯函数可测)。 */
  date: Date;
}

export interface TextBlock {
  text: string;
  x: number;
  y: number;
  size: number;
}

export interface ShareCardLayout {
  width: number;
  height: number;
  banner: TextBlock;
  title: TextBlock;
  letters: TextBlock;
  /** 鱼主视觉位(印 FRAMES[frame] 位图)。 */
  fish: { x: number; y: number; size: number; frame: string };
  /** 终局雷达(几何复用 radarVertex;ring 外沿/neutral 中立环/now 当前值多边形)。 */
  radar: {
    cx: number;
    cy: number;
    radius: number;
    ring: Array<[number, number]>;
    neutral: Array<[number, number]>;
    now: Array<[number, number]>;
    labels: Array<{ text: string; x: number; y: number }>;
  };
  /** 画像一句话折行结果。 */
  portrait: { lines: string[]; x: number; y0: number; lineHeight: number; size: number };
  criticalsTitle: TextBlock;
  criticals: Array<{ q: TextBlock; a: TextBlock }>;
  /** 水印(左下,size ≤ WATERMARK_MAX)。 */
  watermark: { x: number; y: number; size: number };
  footer: TextBlock;
}

/** 文本宽度度量(注入点:测试传 stub;产品传基于字符宽估算的 estimateTextWidth)。 */
export type TextMeasure = (text: string, size: number) => number;

/** 默认度量:CJK/全角按 1.0 字宽、其余按 0.55 字宽估(布局折行用,不追求像素级精确)。 */
export const estimateTextWidth: TextMeasure = (text, size) => {
  let w = 0;
  for (const ch of text) w += size * (ch.charCodeAt(0) > 0xff ? 1 : 0.55);
  return w;
};

/** 按宽度折行(逐字贪心;单词不拆,长词整词下移)。 */
export function wrapText(text: string, maxWidth: number, size: number, measure: TextMeasure): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const ch of text) {
    if (ch === "\n" || measure(cur + ch, size) > maxWidth) {
      if (cur) lines.push(cur);
      cur = ch === "\n" ? "" : ch;
    } else {
      cur += ch;
    }
  }
  if (cur) lines.push(cur);
  return lines.length > 0 ? lines : [""];
}

/** 导出文件名口径(02 §四):xinlu-<mbti>-<yyyymmdd>.png。 */
export function shareCardFileName(letters: string, date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `xinlu-${letters}-${y}${m}${d}.png`;
}

/** 布局纯函数:输入全部语义数据,输出全部几何/文本(不含任何 DOM/Canvas 依赖)。 */
export function computeShareCardLayout(
  input: ShareCardInput,
  measure: TextMeasure = estimateTextWidth,
): ShareCardLayout {
  const PAD = 80;
  const LEFT = PAD;
  const CONTENT_W = CARD_WIDTH - PAD * 2;

  const banner: TextBlock = { text: "心路 · 一段人生的总结", x: LEFT, y: 96, size: 30 };
  const title: TextBlock = { text: input.title, x: LEFT, y: 176, size: 60 };
  const letters: TextBlock = { text: input.letters, x: LEFT, y: 268, size: 84 };

  const FISH_SIZE = 330;
  const RADAR_SIZE = 330;
  const radarRadius = RADAR_SIZE / 2 - 34;
  const fish = { x: LEFT, y: 320, size: FISH_SIZE, frame: input.frame };
  const radarCx = CARD_WIDTH - PAD - RADAR_SIZE / 2;
  const radarCy = 320 + RADAR_SIZE / 2;
  const ring = DIM_KEYS.map((d) => radarVertex(d, 100, radarCx, radarCy, radarRadius));
  const neutral = DIM_KEYS.map((d) => radarVertex(d, 50, radarCx, radarCy, radarRadius));
  const now = DIM_KEYS.map((d) => radarVertex(d, input.dims[d], radarCx, radarCy, radarRadius));
  const labels = [
    { text: "E–I", x: radarCx, y: radarCy - radarRadius - 18 },
    { text: "S–N", x: radarCx + radarRadius + 18, y: radarCy },
    { text: "T–F", x: radarCx, y: radarCy + radarRadius + 18 },
    { text: "J–P", x: radarCx - radarRadius - 18, y: radarCy },
  ];
  const radar = { cx: radarCx, cy: radarCy, radius: radarRadius, ring, neutral, now, labels };

  const portraitSize = 34;
  const portrait = {
    lines: wrapText(input.portrait, CONTENT_W, portraitSize, measure).slice(0, 4),
    x: LEFT,
    y0: 724,
    lineHeight: 48,
    size: portraitSize,
  };

  const criticalsTitle: TextBlock = { text: "关键抉择", x: LEFT, y: 952, size: 40 };
  // 问答各占一行:超长截断加省略号(区域高度固定,水印在左下让位,不留第二行)
  const picked = input.criticals.slice(0, 3);
  let cy = 1000;
  const criticals = picked.map((c) => {
    const qLines = wrapText(c.q, CONTENT_W, 26, measure);
    const qText = (qLines.length > 1 ? qLines[0]!.replace(/…$/, "") + "…" : qLines[0]!);
    const aLines = wrapText(`你选择了:${c.a}`, CONTENT_W, 30, measure);
    const aText = (aLines.length > 1 ? aLines[0]!.replace(/…$/, "") + "…" : aLines[0]!);
    const block = {
      q: { text: qText, x: LEFT, y: cy, size: 26 },
      a: { text: aText, x: LEFT, y: cy + 38, size: 30 },
    };
    cy += 86;
    return block;
  });

  const wmSize = Math.min(112, WATERMARK_MAX);
  const watermark = { x: LEFT, y: CARD_HEIGHT - PAD - wmSize, size: wmSize };
  const footer: TextBlock = { text: "心路 · 人格演化人生模拟", x: CARD_WIDTH - PAD, y: CARD_HEIGHT - PAD + 8, size: 24 };

  return { width: CARD_WIDTH, height: CARD_HEIGHT, banner, title, letters, fish, radar, portrait, criticalsTitle, criticals, watermark, footer };
}

export interface ShareCardImages {
  fish: CanvasImageSource;
  watermark: CanvasImageSource;
}

/** 绘制:只消费布局与图片源,不做任何计算外决策(布局决定一切几何)。 */
export function drawShareCard(ctx: CanvasRenderingContext2D, layout: ShareCardLayout, images: ShareCardImages): void {
  // 水色底 + 渐变光带
  const grad = ctx.createLinearGradient(0, 0, 0, layout.height);
  grad.addColorStop(0, "#dff3f2");
  grad.addColorStop(1, "#f7fbfa");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, layout.width, layout.height);

  ctx.fillStyle = "#2b2b28";
  ctx.textBaseline = "alphabetic";
  putText(ctx, layout.banner, "300");
  putText(ctx, layout.title, "bold");
  ctx.fillStyle = "#2f7d6d";
  putText(ctx, layout.letters, "bold");

  // 鱼主视觉(圆角底衬)
  ctx.fillStyle = "rgba(47,125,109,0.08)";
  roundRect(ctx, layout.fish.x, layout.fish.y, layout.fish.size, layout.fish.size, 24);
  ctx.fill();
  ctx.drawImage(images.fish, layout.fish.x, layout.fish.y, layout.fish.size, layout.fish.size);

  // 雷达:外沿环 + 中立环 + 当前多边形 + 轴标签
  const r = layout.radar;
  ctx.strokeStyle = "#9dc9c1";
  ctx.lineWidth = 2;
  strokePoly(ctx, r.ring);
  ctx.strokeStyle = "#c4ded9";
  strokePoly(ctx, r.neutral);
  ctx.fillStyle = "rgba(47,125,109,0.25)";
  ctx.strokeStyle = "#2f7d6d";
  fillPoly(ctx, r.now);
  strokePoly(ctx, r.now);
  ctx.fillStyle = "#2f7d6d";
  for (const [px, py] of r.now) {
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#6b6b66";
  ctx.font = "26px system-ui, sans-serif";
  ctx.textAlign = "center";
  for (const l of r.labels) ctx.fillText(l.text, l.x, l.y);
  ctx.textAlign = "left";

  // 画像一句话
  ctx.fillStyle = "#3f3f3a";
  ctx.font = `${layout.portrait.size}px system-ui, sans-serif`;
  layout.portrait.lines.forEach((line, i) => {
    ctx.fillText(line, layout.portrait.x, layout.portrait.y0 + i * layout.portrait.lineHeight);
  });

  // 关键抉择
  ctx.fillStyle = "#2f7d6d";
  putText(ctx, layout.criticalsTitle, "bold");
  for (const c of layout.criticals) {
    ctx.fillStyle = "#8a8a84";
    putText(ctx, c.q, "normal");
    ctx.fillStyle = "#2b2b28";
    putText(ctx, c.a, "normal");
  }

  // 水印(左下,尺寸由布局锁定 ≤120px)
  ctx.drawImage(images.watermark, layout.watermark.x, layout.watermark.y, layout.watermark.size, layout.watermark.size);
  ctx.fillStyle = "#9a9a94";
  ctx.textAlign = "right";
  putText(ctx, layout.footer, "normal");
  ctx.textAlign = "left";
}

function putText(ctx: CanvasRenderingContext2D, block: TextBlock, weight: string): void {
  ctx.font = weight === "normal" ? `${block.size}px system-ui, sans-serif` : `${weight} ${block.size}px system-ui, sans-serif`;
  ctx.fillText(block.text, block.x, block.y);
}

function strokePoly(ctx: CanvasRenderingContext2D, poly: Array<[number, number]>): void {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.stroke();
}

function fillPoly(ctx: CanvasRenderingContext2D, poly: Array<[number, number]>): void {
  ctx.beginPath();
  poly.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 加载位图(Image + onload;失败 reject 由调用方降级)。 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败:${url}`));
    img.src = url;
  });
}

/**
 * 导出分享卡:建 canvas → 加载终局帧与水印 → 绘制 → toBlob → 触发下载。
 * 返回文件名(口径断言用);全程纯客户端,零上传(02 §四)。
 */
export async function exportShareCard(input: ShareCardInput): Promise<string> {
  const layout = computeShareCardLayout(input);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D 上下文不可用");
  const [fish, watermark] = await Promise.all([loadImage(FRAMES[input.frame] ?? ""), loadImage(WATERMARK_URL)]);
  drawShareCard(ctx, layout, { fish, watermark });
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("PNG 编码失败");
  const name = shareCardFileName(input.letters, input.date);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return name;
}
