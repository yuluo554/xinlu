#!/usr/bin/env node
// 语义配图总览（留痕图 docs/assets/v5-scenes-sheet.png）——把 scene-map.json 里的每张场景图
// 按类排成网格、用本机 Edge 无头截图落盘。为什么要有它：图库变动（增/删/改画法）后，
// 留痕图会过期；本档与 docs/v5-scenes.md 同批重跑（"图库变了 → 两处都刷新"）。
//
// 判据：图库实物 = assets/web-ready/scenes/*.avif（与 validate S 区同源）；本工具只读 + 截图，
// 不改任何数据（退出码恒 0）。HTML 写到系统临时目录，不落进仓库（脱敏门扫的是仓库文本文件）。
//
// 用法：node tools/v5-scenes-sheet.mjs [--out docs/assets/v5-scenes-sheet.png]
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const OUT_PNG = resolve(ROOT, outIdx >= 0 ? args[outIdx + 1] : "docs/assets/v5-scenes-sheet.png");

const map = JSON.parse(readFileSync(resolve(ROOT, "src/data/scene-map.json"), "utf8"));
const scenesDir = resolve(ROOT, "assets", "web-ready", "scenes");

const EDGE_CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const edge = EDGE_CANDIDATES.find((p) => existsSync(p));
if (!edge) {
  process.stderr.write("找不到 Edge（无头截图需要它）。本工具只报告不判红，未生成总览图。\n");
  process.exitCode = 0;
  process.exit();
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cards = [];
for (const [tag, list] of Object.entries(map.tags)) {
  for (const file of list) {
    // v5.1.0：分发物 = AVIF 具象配图（file:// 绝对 URL 直接引用，不再内联 SVG）
    const url = `file:///${join(scenesDir, file).replace(/\\/g, "/")}`;
    cards.push(
      `<figure><div class="box"><img src="${esc(url)}" width="800" height="280" alt=""></div><figcaption>${esc(file.replace(/\.avif$/, ""))}</figcaption></figure>`,
    );
  }
}
const cols = 4;
/** 每格像素宽：照片比线稿宽，5 列会把格子压到 232px，桌面反而看不清主体。 */
const CARD_W = 300;
const html = `<!doctype html><meta charset="utf-8"><title>v5 语义配图总览</title>
<style>
  /* 与 app 的素纸主题同色，避免留痕图与线上观感不一致 */
  :root { --scene-bg: #f2eee3; --scene-fill: #cfc9b8; --scene-line: #3a3730; }
  body { margin: 0; padding: 18px 22px; background: #f7f4ec; color: #3a3730;
         font: 12px/1.5 "Segoe UI", "Microsoft YaHei", sans-serif; }
  h1 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
  p.meta { margin: 0 0 14px; color: #6b6459; }
  .grid { display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 12px; }
  figure { margin: 0; background: #fff; border: 1px solid #e2dccd; border-radius: 3px; padding: 6px; }
  .box img { display: block; width: 100%; height: auto; }
  figcaption { margin-top: 4px; font-size: 11px; color: #6b6459; text-align: center; }
</style>
<h1>v5 · 语义配图总览（${Object.keys(map.tags).length} 类 / ${cards.length} 张）</h1>
<p class="meta">画法：800×280（400:140）AI 生成具象配图，逐图 AVIF 分发；本图由 tools/v5-scenes-sheet.mjs 生成。</p>
<div class="grid">${cards.join("")}</div>`;

const tmp = join(tmpdir(), `v5-scenes-sheet-${Date.now()}.html`);
writeFileSync(tmp, html);
const rows = Math.ceil(cards.length / cols);
const winH = 140 + rows * (Math.round((CARD_W * 280) / 800) + 34);
try {
  execFileSync(
    edge,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${cols * CARD_W + 44 + (cols - 1) * 12},${winH}`,
      `--screenshot=${OUT_PNG}`,
      `file:///${tmp.replace(/\\/g, "/")}`,
    ],
    { stdio: "ignore", timeout: 60000 },
  );
  process.stdout.write(`总览图已生成：${OUT_PNG}（${cards.length} 张 / ${Object.keys(map.tags).length} 类）\n`);
} finally {
  rmSync(tmp, { force: true });
}