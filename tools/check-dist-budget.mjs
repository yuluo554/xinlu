#!/usr/bin/env node
// ═══ dist 体积预算门(v2-M3' 3.1,判据单源 plan/v4/02 §十 ▸ M2''' 增补)═══
//   1. dist/ 全部产物 gzip 求和 > 预算线(v4: 850KB,plan/v4/02 §十 ▸ M2''' 增补;v5.0.2 维持不抬) → FAIL(发布红线,红灯即停发);
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

// ── 判据常量(口径单源:plan/v4/02 §十 ▸ M2''' 增补——v4 起预算线 850KB,V4-1 重审决策见 v4/00 决策记录:
//    内容工程为 v4 主轴不裁,M1''' A/B 两段内容增量(era 库+names 池+243 条写实文本)已实打 714.34KB,
//    余量预留给 M2''' 主题/小结与 M3''' 配图/objectKey 增量;v3 期 650KB 口径(plan/v3/02 §九)随 v3 腿留档;
//    压缩 WebP > 减帧 > 降分辨率纪律不变)──
// ── v5.0.2 配图层接入：**不抬线**，维持 850KB ──
//    本版曾有过两种口径（都在这一个工作区里发生过，故并列留档，不抹掉任一方实测）：
//      · 口径 A（抬线）：AVIF 逐图 crf45–60 = 131.8KB（mean SSIM 0.888 / min 0.820）放不进 850，
//        主张抬到 920KB。→ 已撤销。
//      · 口径 B（守线，**现行**）：均匀 crf58 + `-still-picture 1` 实测 86.2KB gz，
//        全量 build 844.03KB < 850KB 绿；目检主体可辨，涂抹集中在渐变区，375 档 104px 图区不可见。
//    取舍：**线的纪律优先于桌面纹理保真**（用户 2026-10-29 定为守 850KB）。
//    代价已知：min SSIM 0.6486、余量仅 5.97KB ——已登记 plan/v5/backlog.md 观察区。
//    下一轮若打红或收到「糊」反馈：正路是逐图分配且合计 ≤92KB（131.8KB 那张表不达标，
//    勿直接复用），或提请用户重新拍板抬线——**不许静默重编码或静默抬线**。
const BUDGET_BYTES = 850 * 1024; // gzip 总量 ≤ 850KB
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
  out("dist 体积预算门 · 依据 plan/v4/02 §十 ▸ M2''' 增补(压缩 WebP > 减帧 > 降分辨率)");
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
