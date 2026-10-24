#!/usr/bin/env node
// ═══ E2E 双端一键通关冒烟（v2-M1' 1.1 · v2/03 §1 契约）═══
// 零新增依赖：node 24 内置 WebSocket 直连 CDP，驱动本机 Edge 无头实例。
// 流程：vite build → vite preview（静态服务）→ Edge headless（CDP 9223）→
//       375/1280 两档视口各完整通关一局（同步 evaluate 连点，套路 = plan/HANDOFF-M7 §五）→
//       断言关键屏节点与终局类型非空 → 截图留痕（暖帧丢弃）→ 清杀子进程。
// 退出码：0 全绿 / 1 断言失败或环境异常 / 2 用法错误。
// 纪律：本脚本不加任何 devDependencies（K2 零运行时依赖的测试侧延伸）。

import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const VITE_JS = join(ROOT, "node_modules", "vite", "bin", "vite.js");
const EDGE_CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const PORT_PREVIEW = 4173;
const PORT_CDP = 9223;
const VIEWPORTS = [
  { width: 375, height: 812, mobile: true, shot: "e2e-smoke-375.png" },
  { width: 1280, height: 800, mobile: false, shot: "e2e-smoke-1280.png" },
];
const MAX_STEPS = 600; // 121 事件 + aftermath + 8 小结 + 开局，余量 ~2 倍

const args = process.argv.slice(2);
if (args.some((a) => a !== "--no-build")) {
  process.stderr.write("e2e smoke: 用法 node tests/e2e/smoke.mjs [--no-build]\n");
  process.exit(2);
}

const edge = EDGE_CANDIDATES.find((p) => existsSync(p));
if (!edge) {
  process.stderr.write("e2e smoke: 未找到 msedge.exe（CDP 驱动需要 Edge/Chromium）\n");
  process.exit(1);
}

const out = (s) => process.stdout.write(s + "\n");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, label, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      // 未就绪，继续轮询
    }
    await sleep(200);
  }
  throw new Error(`等待超时：${label}`);
}

/** 极简 CDP 客户端：id 配对响应 + 事件队列。 */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = [];
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.id !== undefined && this.pending.has(msg.id)) {
        const { resolve: res, reject: rej } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? rej(new Error(`${msg.error.message}`)) : res(msg.result);
      } else if (msg.method) {
        this.eventWaiters = this.eventWaiters.filter((w) => {
          if (w.method !== msg.method) return true;
          w.resolve(msg.params);
          return false;
        });
      }
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((res, rej) => this.pending.set(id, { resolve: res, reject: rej }));
  }
  waitEvent(method, timeoutMs = 15000) {
    return new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error(`事件等待超时：${method}`)), timeoutMs);
      this.eventWaiters.push({
        method,
        resolve: (p) => {
          clearTimeout(t);
          res(p);
        },
      });
    });
  }
  async evaluate(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true });
    if (r.exceptionDetails) throw new Error(`页面内异常：${r.exceptionDetails.text}`);
    return r.result?.value;
  }
}

async function main() {
  const spawned = [];
  const killAll = () => {
    for (const child of spawned) {
      try {
        execFileSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } catch {
        // 进程可能已退出
      }
    }
  };

  // ── 构建（保证 e2e 测的是当前代码；--no-build 跳过用现成 dist）──
  if (!args.includes("--no-build")) {
    out("[1/5] vite build …");
    execFileSync(process.execPath, [VITE_JS, "build"], { cwd: ROOT, stdio: "pipe" });
  } else if (!existsSync(join(ROOT, "dist", "index.html"))) {
    throw new Error("--no-build 但 dist/index.html 不存在，先 npm run build");
  }

  try {
    // ── 静态服务 ──
    out("[2/5] vite preview …");
    const preview = spawn(
      process.execPath,
      [VITE_JS, "preview", "--port", String(PORT_PREVIEW), "--strictPort", "--host", "127.0.0.1"],
      {
        cwd: ROOT,
        stdio: "ignore",
      }
    );
    spawned.push(preview);
    await waitFor(async () => {
      const r = await fetch(`http://127.0.0.1:${PORT_PREVIEW}/`);
      return r.ok;
    }, "preview server 就绪");

    // ── Edge 无头 + CDP ──
    out("[3/5] Edge headless (CDP) …");
    const profile = join(tmpdir(), "xinlu-e2e-smoke-profile");
    rmSync(profile, { recursive: true, force: true });
    const browser = spawn(
      edge,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        `--remote-debugging-port=${PORT_CDP}`,
        `--user-data-dir=${profile}`,
        "about:blank",
      ],
      { stdio: "ignore" }
    );
    spawned.push(browser);
    const version = await waitFor(async () => {
      const r = await fetch(`http://127.0.0.1:${PORT_CDP}/json/version`);
      return r.json();
    }, "CDP 就绪");
    void version;
    const targets = await (await fetch(`http://127.0.0.1:${PORT_CDP}/json/list`)).json();
    const page = targets.find((t) => t.type === "page");
    if (!page?.webSocketDebuggerUrl) throw new Error("CDP 无 page target");
    const cdp = new CDP(new WebSocket(page.webSocketDebuggerUrl));
    await new Promise((res, rej) => {
      cdp.ws.addEventListener("open", res);
      cdp.ws.addEventListener("error", () => rej(new Error("CDP WebSocket 连接失败")));
    });
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // ── 每档视口完整通关一局 ──
    const results = [];
    mkdirSync(join(ROOT, "docs", "assets"), { recursive: true });
    for (let v = 0; v < VIEWPORTS.length; v++) {
      const vp = VIEWPORTS[v];
      out(`[4/5] ${vp.width}×${vp.height} 一键通关 …`);
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile,
      });
      if (v > 0) {
        await cdp.evaluate("localStorage.clear()"); // 二局清档，从开局屏起跑
        await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT_PREVIEW}/` });
        await cdp.waitEvent("Page.loadEventFired");
      } else {
        await cdp.send("Page.navigate", { url: `http://127.0.0.1:${PORT_PREVIEW}/` });
        await cdp.waitEvent("Page.loadEventFired");
      }

      const startSeen = await cdp.evaluate("!!document.querySelector('.screen-start')");
      if (!startSeen) throw new Error("开局屏未出现");

      // 同步 evaluate 连点：卡片点第 0 项 / 小结与 aftermath 继续 / 开局提交默认组合
      let endingSeen = false;
      for (let step = 0; step < MAX_STEPS; step++) {
        const acted = await cdp.evaluate(`(() => {
          if (document.querySelector(".screen-ending")) return "ending";
          const opt = document.querySelector("[data-option]");
          if (opt) { opt.click(); return "card"; }
          const cont = document.querySelector("[data-continue]");
          if (cont) { cont.click(); return "next"; }
          const start = document.querySelector("[data-env-form] button[type=submit]");
          if (start) { start.click(); return "start"; }
          return "stuck:" + (document.querySelector(".screen")?.className ?? "no-screen");
        })()`);
        if (acted === "ending") {
          endingSeen = true;
          break;
        }
        if (String(acted).startsWith("stuck:")) throw new Error(`页面卡在未知屏：${acted}`);
      }
      if (!endingSeen) throw new Error(`${vp.width} 档：${MAX_STEPS} 步内未到终局`);

      // 断言：关键屏节点 + 终局类型非空（v2/03 §1）
      const verdict = await cdp.evaluate(`(() => {
        const ending = document.querySelector(".screen-ending");
        const title = ending?.querySelector("h2")?.textContent?.trim() ?? "";
        const letters = ending?.querySelector(".ending-type")?.textContent?.trim() ?? "";
        const radarSvg = !!ending?.querySelector("[data-slot='radar'] svg");
        return { title, letters, radarSvg };
      })()`);
      if (!verdict.title) throw new Error(`${vp.width} 档：终局标题为空`);
      if (!/^[EI][SN][TF][JP]$/.test(verdict.letters)) {
        throw new Error(`${vp.width} 档：终局类型字母非法「${verdict.letters}」`);
      }
      if (!verdict.radarSvg) throw new Error(`${vp.width} 档：终局雷达未渲染`);

      // 截图留痕（暖帧丢弃：第一张合成器可能滞后，丢）
      await cdp.evaluate("window.scrollTo(0, 0)");
      await cdp.send("Page.captureScreenshot", { format: "png" });
      const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(ROOT, "docs", "assets", vp.shot), Buffer.from(shot.data, "base64"));
      results.push({ viewport: vp.width, title: verdict.title, letters: verdict.letters });
      out(`      ✓ ${vp.width} 档通关：${verdict.title}（${verdict.letters}）`);
    }

    out("[5/5] 断言汇总 …");
    out("=".repeat(56));
    for (const r of results) {
      out(`PASS  ${r.viewport}px  终局「${r.title}」 typeText=${r.letters} 雷达已渲染`);
    }
    out(`PASS  截图留痕 docs/assets/${VIEWPORTS.map((v) => v.shot).join(" + ")}`);
    out("=".repeat(56));
    out("结论: e2e 冒烟全绿（375/1280 双端一键通关）");
  } finally {
    killAll();
    // Edge 退出后句柄释放有延迟：清理失败可容忍（profile 在系统临时目录，不碍事）
    await sleep(300);
    try {
      rmSync(join(tmpdir(), "xinlu-e2e-smoke-profile"), { recursive: true, force: true });
    } catch {
      // 下次启动前还会再清一次
    }
  }
}

main().catch((e) => {
  process.stderr.write(`e2e smoke FAIL: ${e.message}\n`);
  process.exitCode = 1;
});
