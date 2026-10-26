#!/usr/bin/env node
// ═══ 脱敏门（发布前必跑，进 CI 的 layout job；改自 ai-tool-project-sprint references/templates/check-desensitized.mjs） ═══
// 为什么是"门"而不是一次性 grep：发布之后任何一次改动都可能把本机痕迹带回来
// （HANDOFF/留档是高频追加面），所以它必须常驻、可跑红、进 CI。
// 退出码：0 零命中 / 1 有命中 / 2 用法错误。
//
// ── 变异验证（每条规则一组，必须逐组变红；见 plan/HANDOFF 里的验红记录）─────
//   V1 文档写 `D:/ProgramData/<something>`     → absolute-session-path 红
//   V2 写 `C:/Users/<真实用户名>/x`（非占位符） → absolute-session-path + host-username 红
//   V3 写 `/c/Users/<名字>/x`                   → msys-user-path 红
//   V4 写 `127.0.0.1:7897`                      → loopback-proxy 红
//   还原后必须复绿；命中行逐条打印 `文件:行: [规则] 原文`。

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// 自豁免面 = 文件集合（项目里若同时存在多版门，逐条列全），豁免份数打进结论行
const SELF = new Set(["tools/check-desensitized.mjs"]);

// 不扫的目录：`.git` 目录形态与 worktree 文件形态一起挡（下方 name === ".git"）
// 纪律：凡 .gitignore 声明的"本地产物/环境"目录，必须在这里有对应项
const SKIP_DIRS = new Set([
  ".git", ".tmp", "dist", "dist-release", "node_modules", ".cache", ".venv", "build",
  ".mimosa", ".pytest_cache", "coverage", ".taste-skill",
]);
const SKIP_SUFFIXES = [".egg-info", ".dist-info"];
const SKIP_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".ico", ".zip", ".gz", ".exe", ".dll", ".pdf", ".woff", ".woff2"]);

const RULES = [
  {
    id: "absolute-session-path",
    // 盘符绝对路径；`<repo>` / `<user>` 占位符放行（负向前瞻）
    re: /\b[A-Za-z]:[\\/](?:ProgramData|Users|zcode|repos?|projects?)[\\/](?!<)/,
  },
  {
    id: "msys-user-path",
    // Git Bash 形态 `/c/Users/<name>/…`（占位符放行）
    re: /\/[a-z]\/Users\/(?!<)[A-Za-z0-9._-]+\//,
  },
  {
    id: "host-username",
    // 本机用户名（本机实测值；换机器要改这一行，别用环境实算——CI runner 上叫 runner）
    re: /\bASUS\b/,
  },
  {
    id: "loopback-proxy",
    // 回环代理端口；私网段同理可加 `\b192\.168\.\d+\.\d+:\d+\b`
    re: /\b127\.0\.0\.1:\d{2,5}\b/,
  },
];

for (const a of process.argv.slice(2)) {
  process.stderr.write(`check-desensitized: unknown argument ${a}\n`);
  process.exit(2);
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git") continue; // 目录形态与 worktree 文件形态一起挡
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || SKIP_SUFFIXES.some((s) => entry.name.endsWith(s))) continue;
      yield* walk(join(dir, entry.name));
      continue;
    }
    if (!entry.isFile()) continue;
    const dot = entry.name.lastIndexOf(".");
    if (dot >= 0 && SKIP_EXTS.has(entry.name.slice(dot))) continue;
    yield join(dir, entry.name);
  }
}

const hits = [];
let scanned = 0;
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file).split(sep).join("/");
  if (SELF.has(rel)) continue; // 自豁免（门自己必须写出被判据禁止的字面量）
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (text.includes("\u0000")) continue; // 二进制
  scanned++;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const rule of RULES) {
      if (rule.re.test(lines[i])) {
        hits.push(`${rel}:${i + 1}: [${rule.id}] ${lines[i].trim().slice(0, 160)}`);
      }
    }
  }
}

if (hits.length > 0) {
  process.stdout.write(`脱敏门：${hits.length} 处命中（扫了 ${scanned} 个文本文件，豁免 ${SELF.size} 份）\n`);
  for (const h of hits) process.stdout.write(`FAIL  ${h}\n`);
  process.exit(1);
}
process.stdout.write(`脱敏门：扫了 ${scanned} 个文本文件，0 命中（豁免 ${SELF.size} 份）\n`);
