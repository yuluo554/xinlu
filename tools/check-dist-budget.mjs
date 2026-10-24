#!/usr/bin/env node
// ═══ dist 体积预算门(v2-M3' 3.1,判据单源 plan/v2/02 §七)═══
//   1. dist/ 全部产物 gzip 求和 > 预算线(v3: 650KB,plan/v3/02 §九 ▸ M2'' 增补) → FAIL(发布红线,红灯即停发);
//   2. dist 内图像资产单张原始字节 > 50KB → WARN + 清单(源在 assets/ 不入 dist 的不计——
//      本门只扫 dist/,天然满足;WARN 不影响退出码,但清单留痕供下一轮裁剪);
//   3. dist/ 不存在 → NOTE 跳过(先 npm run build 可全量核查),退出码 0。
// 退出码:0 全绿(WARN 允许)/ 1 有 FAIL。
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

// ── 判据常量(口径单源:plan/v3/02 §九 ▸ M2'' 增补——v3 预算线 650KB,重审依据与 dist 构成实算见该节;
//    v2 期 500KB 口径出自 plan/v2/02 §七,按 v3 增量口径替换;压缩 WebP > 减帧 > 降分辨率纪律不变)──
const BUDGET_BYTES = 650 * 1024; // gzip 总量 ≤ 650KB
const WARN_IMAGE_BYTES = 50 * 1024; // 单张图像 ≤ 50KB
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|ico|avif)$/i;

function walk(dir, base) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(base, full).split("\\").join("/");
    if (statSync(full).isDirectory()) out.push(...walk(full, base));
    else out.push(rel);
  }
  return out;
}

const fails = [];
const warns = [];
const fail = (msg) => fails.push(msg);
const warn = (msg) => warns.push(msg);

if (!existsSync(join(DIST, "index.html"))) {
  process.stdout.write("NOTE  dist/ 不存在,跳过预算核查(先 npm run build 可全量核查)\n");
  process.exitCode = 0;
} else {
  const files = walk(DIST, DIST);
  let totalGzip = 0;
  const bigImages = [];
  for (const rel of files) {
    const buf = readFileSync(join(DIST, rel));
    totalGzip += gzipSync(buf, { level: 9 }).length;
    if (IMAGE_EXT.test(rel) && buf.length > WARN_IMAGE_BYTES) {
      bigImages.push(`${rel}(${(buf.length / 1024).toFixed(1)}KB)`);
    }
  }
  const kb = (n) => (n / 1024).toFixed(2);

  const out = (s) => process.stdout.write(s + "\n");
  out("dist 体积预算门 · 依据 plan/v2/02 §七(压缩 WebP > 减帧 > 降分辨率)");
  out("=".repeat(56));
  out(`PASS  dist 全部产物 ${files.length} 件,gzip 求和 ${kb(totalGzip)}KB / 上限 ${kb(BUDGET_BYTES)}KB`);
  if (totalGzip > BUDGET_BYTES) fail(`gzip 总量 ${kb(totalGzip)}KB > ${kb(BUDGET_BYTES)} 预算线`);
  if (bigImages.length > 0) {
    warn(`单张图像 >50KB 共 ${bigImages.length} 件:${bigImages.join("、")}`);
  } else {
    out("PASS  dist 内图像单张全部 ≤50KB");
  }
  for (const f of fails) out(`FAIL  ${f}`);
  for (const w of warns) out(`WARN  ${w}`);
  out("=".repeat(56));
  out(`结论: ${fails.length === 0 ? "0 FAIL,预算门绿" : `${fails.length} 项 FAIL`}(${warns.length > 0 ? `另有 ${warns.length} 项 WARN` : "无 WARN"})`);
  process.exitCode = fails.length === 0 ? 0 : 1;
}
