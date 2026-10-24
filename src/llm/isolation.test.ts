// 过网隔离测试（v3/02 §七：判定核心 engine/ 禁止出现网络 API，grep 守护；LLM 调用全部在 src/llm/ 单层）。
// 防回退：任何人在 engine/（或其余非授权层）引入 fetch/WebSocket/HTTP 客户端 → 本文件必红。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");
/** 网络面特征：fetch 调用形、XHR、WebSocket、sendBeacon、事件循环外发（EventSource）。 */
const NETWORK_RE = /\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket|sendBeacon|new\s+EventSource/;
/** 引擎判词：engine/ 全部 .ts 文件（含测试——测试也不许发起真实网络）。 */
const ENGINE_DIR = join(SRC, "engine");

function listTs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listTs(full));
    else if (name.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("过网隔离（v3/02 §七）", () => {
  it("engine/ 目录零网络 API（判定核心离线纯度）", () => {
    const violations: string[] = [];
    for (const file of listTs(ENGINE_DIR)) {
      const src = readFileSync(file, "utf8");
      if (NETWORK_RE.test(src)) violations.push(file);
    }
    expect(violations, `以下判定核心文件出现网络调用形：${violations.join(", ")}`).toEqual([]);
  });

  it("src/llm/ 是唯一网络层：provider.ts 存在 fetch 调用形（层在位）", () => {
    const src = readFileSync(join(SRC, "llm", "provider.ts"), "utf8");
    expect(src).toMatch(/\bfetch\b/);
    expect(src).toMatch(/AbortController/); // 8s 超时口径在位
  });

  it("ui/ 与 storage/ 不直接过网（旁路只经 llm/ 单层进 UI）", () => {
    const violations: string[] = [];
    for (const dir of ["ui", "storage", "viz"]) {
      for (const file of listTs(join(SRC, dir))) {
        if (NETWORK_RE.test(readFileSync(file, "utf8"))) violations.push(file);
      }
    }
    expect(violations, `以下文件绕过 llm/ 直接过网：${violations.join(", ")}`).toEqual([]);
  });
});
