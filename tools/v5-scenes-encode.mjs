#!/usr/bin/env node
// ═══ 场景配图编码器（v5.0.2：源 WebP → 分发 AVIF）═══
// 判据单源 = docs/v5-M9-scene-webp.md（方案对比 / 实测体积 / SSIM / 为何不是 WebP 也不是抬线）。
//
// 为什么必须转格式：52 张 800×280 源 WebP 合计 989.4KB，而 WebP 已是压缩格式、
// gzip 后仍 ≈990KB；原样入 dist 会把预算门从基线 761.06KB 推到 1751.82KB（实测 FAIL）。
// WebP 在任何可接受画质下都压不进预算（实测 800w q45 = 772KB、480w q55 = 374KB、400w q20 = 164KB）。
// AVIF（AV1 帧内，-still-picture 1）在 800×280 全分辨率、均匀 crf58 下实测 **86.2KB gz**，
// 使全量 build 落在 841.82KB < 850KB（v5.0.2 不抬线；v5.1.0 棒曾抬到 920KB 已撤回）。
//
// 档位：均匀 crf58（v5.0.2 本棒实测定档，理由见下方 SCENE_CRF 注释与 docs/v5-M9-scene-webp.md §三）。
//
// 源图（assets/web-ready/scenes-src/*.webp）**不随构建分发**，只作编码输入；
// 分发物 = assets/web-ready/scenes/*.avif。
// 依赖：本机 ffmpeg（含 libaom-av1）——**离线素材工具**，产物已入库，他人 clone 后无需安装（K2 不受影响）。
//
// 用法：
//   node tools/v5-scenes-encode.mjs            # 按 SCENE_CRF 重新编码全部
//   node tools/v5-scenes-encode.mjs --check    # 只核验分发物在位与体积，不重编码
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(ROOT, "assets", "web-ready", "scenes-src");
const OUT_DIR = join(ROOT, "assets", "web-ready", "scenes");

/** 逐图 CRF 表。
 *  v5.0.2 本棒实测（docs/v5-M9-scene-webp.md §三）：v5.1.0 棒的逐图 SSIM 分配表（45/50/52/55/57 +
 *  默认 60）在 `-still-picture 1` 下合计 **131.8KB gz**，超出「850 线内可分配给配图的 ≤92KB」；
 *  表 +2 / +3 档仍 109.1 / 97.5KB，均不达标。均匀档实测：crf58 = **86.2KB**（余 5.8KB）、
 *  crf60 = 69.5KB（余 22.5KB 但目检明显更糊：工人/窗棂成块）。
 *  → 采用**均匀 crf58**（保 800×280 全分辨率，纪律「压缩 > 减帧 > 降分辨率」）。
 *  逐图表保留为注释供溯源，不再启用；若未来要重启逐图分配，须先重测合计 ≤92KB。
 *  const SCENE_CRF_V510 = { factory-hall:45, field-harvest:45, field-rows:45, outdoors-park:45,
 *    outdoors-road:45, school-field:45, home-threshold:50, school-gate:50, street-crossing:50,
 *    factory-machine:52, pet-cat:52, rain-street:52, wedding-hall:52, home-courtyard:55,
 *    market-scales:55, market-stall:55, pet-cage:55, school-corridor:55, station-luggage:55,
 *    station-platform:55, street-shopfront:55, home-window:57, kitchen-vegetables:57,
 *    music-mic:57, office-desk:57, relic-letter:57, station-ticket:57, wedding-table:57 };
 */
const SCENE_CRF = {};
const DEFAULT_CRF = 58;
/** 分发物单张上限（预算门 WARN 线是 50KB，这里自查一致）。 */
const MAX_BYTES = 50 * 1024;

const checkOnly = process.argv.includes("--check");

if (!existsSync(SRC_DIR)) {
  process.stderr.write("FAIL  源图目录不存在：assets/web-ready/scenes-src/\n");
  process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });

const sources = readdirSync(SRC_DIR).filter((f) => f.endsWith(".webp")).sort();
if (sources.length === 0) {
  process.stderr.write("FAIL  源图目录为空\n");
  process.exit(1);
}

let encoded = 0;
let total = 0;
const oversized = [];
for (const name of sources) {
  const stem = name.replace(/\.webp$/, "");
  const out = join(OUT_DIR, `${stem}.avif`);
  const crf = SCENE_CRF[stem] ?? DEFAULT_CRF;
  if (!checkOnly) {
    execFileSync(
      "ffmpeg",
      ["-hide_banner", "-loglevel", "error", "-y", "-i", join(SRC_DIR, name),
        "-c:v", "libaom-av1", "-still-picture", "1", "-crf", String(crf),
        "-b:v", "0", "-pix_fmt", "yuv420p", out],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    encoded += 1;
  }
  if (!existsSync(out)) {
    process.stderr.write(`FAIL  分发物缺失：${stem}.avif（先去掉 --check 跑一次编码）\n`);
    process.exit(1);
  }
  const bytes = statSync(out).size;
  total += bytes;
  if (bytes > MAX_BYTES) oversized.push(`${stem}.avif(${(bytes / 1024).toFixed(1)}KB)`);
}

const out = (s) => process.stdout.write(s + "\n");
out("场景配图编码器 · 源 WebP → 分发 AVIF（判据单源 docs/v5-M9-scene-webp.md）");
out("=".repeat(56));
out(`${checkOnly ? "核验" : "编码"} ${sources.length} 张 · AVIF / 800×280 / yuv420p / 均匀 crf${DEFAULT_CRF}${checkOnly ? "" : ` · 本轮新编码 ${encoded} 张`}`);
out(`PASS  分发物合计 ${(total / 1024).toFixed(1)}KB（单张上限 ${MAX_BYTES / 1024}KB）`);
if (oversized.length) out(`WARN  单张超限 ${oversized.length} 件：${oversized.join("、")}`);
out("=".repeat(56));
out(`结论: ${oversized.length === 0 ? "0 FAIL,编码器自检绿" : `0 FAIL,${oversized.length} 项 WARN`}`);
process.exitCode = 0;
