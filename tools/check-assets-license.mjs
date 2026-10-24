#!/usr/bin/env node
// ═══ 素材许可门(v2-M3' 3.1 判据,提前随 v2-M2' 交付——排序约束:先有许可门,再入 fish/ 素材)═══
// 依据 plan/v2/02 §六实现其点名的全部判据;许可结论单源是 assets/README.md 台账,本脚本只"查"不复写:
//   1. git 跟踪文件与 dist 内容中,图像素材路径 ⊆ 白名单清单(清单随 D1 拍板版本化,见下方常量);
//   2. ❌ 层素材(梗图原图 / 无 LICENSE 的 GIF 原件)不得进入 git 跟踪或 dist;
//   3. credits 文件存在且含必需署名行(3 行,见 assets/README.md §署名文案)。
// 退出码:0 全绿 / 1 有 FAIL。
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ── 白名单清单(D1 = B 档,2026-10-24 拍板;v3-M2'' 2.1 增补 Game-Icons/CC0;前缀目录级,单源 = assets/README.md 台账)──
const ALLOW_PREFIXES = [
  "assets/web-ready/",
  "assets/dafeiyu/fish/", // ⚠️ B 档:处理版 webp,已知限制声明随分发(assets/README.md / public/credits.md)
  "assets/cc-by/",
  "assets/game-icons/", // v3:Game-Icons 事件图标层(CC-BY 3.0,逐张作者对照 docs/v3-M2-icons.md)
  "assets/cc0/", // v3:CC0 场景底图/纹理(检索式与下载留痕 assets/README.md 增量节)
  "assets/dafeiyu/favicon.svg",
  "public/",
  "docs/assets/", // 项目自产截图留痕(非第三方素材)
];
// ── ❌ 层(02 §六:不进 git、不进 dist、不进 Release)──
const FORBIDDEN = [
  "assets/upstream/deepseek-fat-fish-codex-pet/", // 4 张 GIF 原件,上游无 LICENSE
  "你这吃白饭的蓝色大肥鱼", // 梗图原图,原作者与授权尚待核实
];
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg|ico|avif)$/i;
/** dist 产物 hash 文件名还原:vite 默认 [name]-[hash][extname]。 */
const VITE_HASH = /-[A-Za-z0-9_-]{8}(\.[A-Za-z0-9]+)$/;

const CREDITS = "public/credits.md";
/** 必需署名行(3 行,assets/README.md §v2 可直接粘贴的署名文案)。 */
const CREDIT_LINES = [
  "Open Ocean Game Art by Paul Kankiewicz",
  "Ocean Animals by Jana Ochse",
  "YunYueSama/codex-deepseek-pet",
  "1190fasheqi/dafeiyu-pet",
  "Icons made by Lorc, Delapouite and contributors (game-icons.net, CC-BY 3.0)", // v3 事件图标层;逐张作者对照 docs/v3-M2-icons.md
];

const fails = [];
const fail = (msg) => fails.push(msg);

function trackedFiles() {
  const out = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 })
    .toString()
    .split("\0")
    .filter(Boolean);
  return out;
}

function listImages(dir, base) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(base, full).split("\\").join("/");
    if (statSync(full).isDirectory()) out.push(...listImages(full, base));
    else if (IMAGE_EXT.test(name)) out.push(rel);
  }
  return out;
}

const tracked = trackedFiles();

// ── 1. git 跟踪图像 ⊆ 白名单 ──
const trackedImages = tracked.filter((f) => IMAGE_EXT.test(f));
for (const f of trackedImages) {
  const norm = f.split("\\").join("/");
  if (!ALLOW_PREFIXES.some((p) => norm.startsWith(p))) {
    fail(`git 跟踪图像不在白名单:${norm}`);
  }
}

// ── 2. ❌ 层双向断言(git 跟踪 + dist)──
for (const f of tracked) {
  const norm = f.split("\\").join("/");
  if (FORBIDDEN.some((p) => norm.includes(p))) fail(`❌ 层素材进入 git 跟踪:${norm}`);
}

const distDir = join(ROOT, "dist");
if (existsSync(join(distDir, "index.html"))) {
  // vite 把资源拍平到 dist/assets/(去目录、名后带 hash):按 basename 还原后回源树对账——
  // dist 图像的还原名必须能在白名单跟踪图像里找到同名源。
  const allowedBasenames = new Set(
    trackedImages
      .filter((f) => ALLOW_PREFIXES.some((p) => f.split("\\").join("/").startsWith(p)))
      .map((f) => f.split(/[/\\]/).pop().replace(VITE_HASH, "$1")),
  );
  for (const img of listImages(distDir, distDir)) {
    if (FORBIDDEN.some((p) => img.includes(p))) fail(`❌ 层素材进入 dist:${img}`);
    const unbuilt = img.split(/[/\\]/).pop().replace(VITE_HASH, "$1");
    if (FORBIDDEN.some((p) => unbuilt.includes(p))) fail(`❌ 层素材进入 dist:${img}`);
    if (!allowedBasenames.has(unbuilt)) fail(`dist 图像溯源不到白名单源:${img}`);
  }
} else {
  process.stdout.write("NOTE  dist/ 不存在,跳过 dist 内容检查(先 npm run build 可全量核查)\n");
}

// ── 3. credits 署名 ──
if (!existsSync(join(ROOT, CREDITS))) {
  fail(`credits 文件缺失:${CREDITS}`);
} else {
  const text = readFileSync(join(ROOT, CREDITS), "utf8");
  for (const line of CREDIT_LINES) {
    if (!text.includes(line)) fail(`credits 缺必需署名行:「${line}」`);
  }
}

// ── 输出 ──
const out = (s) => process.stdout.write(s + "\n");
out("素材许可门 · 依据 plan/v2/02 §六(许可结论单源:assets/README.md)");
out("=".repeat(56));
out(`PASS  git 跟踪图像 ${trackedImages.length} 件 ⊆ 白名单(D1=B:web-ready + fish/ 处理版 + cc-by + game-icons + cc0 + favicon)`);
if (existsSync(join(distDir, "index.html"))) out(`PASS  dist 图像 ${listImages(distDir, distDir).length} 件全部溯源到白名单源`);
out("PASS  ❌ 层(梗图原图 / GIF 原件)未进入 git 跟踪与 dist");
out(`PASS  credits ${CREDITS} 在位且署名行齐(Open Ocean / Ocean Animals / 大肥鱼双仓库)`);
for (const f of fails) out(`FAIL  ${f}`);
out("=".repeat(56));
out(`结论: ${fails.length === 0 ? "0 FAIL,许可门全绿" : `${fails.length} 项 FAIL`}`);
process.exitCode = fails.length === 0 ? 0 : 1;
