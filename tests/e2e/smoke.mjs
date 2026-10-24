#!/usr/bin/env node
// ═══ E2E 双端一键通关冒烟（v2-M1' 1.1 · v2/03 §1 契约）═══
// 零新增依赖：node 24 内置 WebSocket 直连 CDP，驱动本机 Edge 无头实例。
// 流程：vite build → vite preview（静态服务）→ Edge headless（CDP 9223）→
//       375/1280 两档视口各完整通关一局（同步 evaluate 连点，套路 = plan/HANDOFF-M7 §五）→
//       断言关键屏节点与终局类型非空 → 截图留痕（暖帧丢弃）→ 清杀子进程。
// 退出码：0 全绿 / 1 断言失败或环境异常 / 2 用法错误。
// 纪律：本脚本不加任何 devDependencies（K2 零运行时依赖的测试侧延伸）。

import { spawn, execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
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
  {
    width: 375,
    height: 812,
    mobile: true,
    shot: "e2e-smoke-375.png",
    fishCardShot: "v2m2-mascot-card-375.png",
    fishEndingShot: "v2m2-mascot-375.png",
    env: null, // 默认组合(era=60s/大城):预期最深水色 + 最浓云层
    expectScene: { brightness: "brightness(0.70)", clouds: "opacity:0.70" },
    shareShot: "share-card-375.png",
  },
  {
    width: 1280,
    height: 800,
    mobile: false,
    shot: "e2e-smoke-1280.png",
    fishCardShot: "v2m2-mascot-card-1280.png",
    fishEndingShot: "v2m2-mascot-1280.png",
    env: { era: "10s", place: "农村" }, // 提交前改选:预期最亮暖水色 + 最稀云层
    expectScene: { brightness: "brightness(1.05)", clouds: "opacity:0.15" },
    shareShot: "share-card-1280.png",
  },
];
const MAX_STEPS = 600; // 121 事件 + aftermath + 8 小结 + 开局，余量 ~2 倍

// --base-url <url>：跳过 build/preview，直接驱动已就绪的静态服务（干净环境冒烟 / Pages 线上实开复用同一套路）。
const args = process.argv.slice(2);
let baseUrl = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--no-build") continue;
  if (args[i] === "--base-url") {
    baseUrl = args[++i] ?? null;
    continue;
  }
  process.stderr.write("e2e smoke: 用法 node tests/e2e/smoke.mjs [--no-build] [--base-url <url>]\n");
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

  // ── 构建（保证 e2e 测的是当前代码；--base-url / --no-build 跳过）──
  if (baseUrl === null && !args.includes("--no-build")) {
    out("[1/5] vite build …");
    execFileSync(process.execPath, [VITE_JS, "build"], { cwd: ROOT, stdio: "pipe" });
  } else if (baseUrl === null && !existsSync(join(ROOT, "dist", "index.html"))) {
    throw new Error("--no-build 但 dist/index.html 不存在，先 npm run build");
  }

  try {
    // ── 静态服务（--base-url 模式由外部提供，常见为 py -m http.server 伺服 dist/ 或线上 Pages）──
    const pageUrl = baseUrl ?? `http://127.0.0.1:${PORT_PREVIEW}/`;
    if (baseUrl === null) {
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
    } else {
      out(`[2/5] 外部静态服务 ${baseUrl} …`);
      await waitFor(async () => {
        const r = await fetch(baseUrl);
        return r.ok;
      }, "外部 base-url 就绪");
    }

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
        // 二局只清存档键（图鉴 xinlu.gallery.v2 保留：跨局累计是其本意），从开局屏起跑
        await cdp.evaluate("localStorage.removeItem('xinlu.save.v1')");
        await cdp.send("Page.navigate", { url: pageUrl });
        await cdp.waitEvent("Page.loadEventFired");
      } else {
        await cdp.send("Page.navigate", { url: pageUrl });
        await cdp.waitEvent("Page.loadEventFired");
      }

      const startSeen = await cdp.evaluate("!!document.querySelector('.screen-start')");
      if (!startSeen) throw new Error("开局屏未出现");

      // v2-M3' 场景氛围:双端用不同出生环境,断言水域背景随之变化(scene-water filter / scene-clouds opacity)
      if (vp.env) {
        const switched = await cdp.evaluate(`(() => {
          let ok = true;
          for (const [k, v] of Object.entries(${JSON.stringify(vp.env)})) {
            const el = document.querySelector('input[name="' + k + '"][value="' + v + '"]');
            if (el) el.click(); else ok = false;
          }
          return ok;
        })()`);
        if (!switched) throw new Error(`${vp.width} 档:改选出生环境失败`);
      }

      // v2-M2' 卡片流 mascot 断言:提交开局进入首卡,mascot 已挂载且表情帧 href 非空(待机态)
      await cdp.evaluate(`document.querySelector("[data-env-form] button[type=submit]").click()`);
      const cardFish = await cdp.evaluate(`(() => {
        const svg = document.querySelector(".screen-card .fish-mascot");
        if (!svg) return null;
        const frame = svg.querySelector(".fish-frame");
        return { idle: !!svg.querySelector(".fish-idle"), href: frame ? frame.getAttribute("href") : "" };
      })()`);
      if (!cardFish) throw new Error(`${vp.width} 档：卡片流 mascot 未渲染`);
      if (!cardFish.idle) throw new Error(`${vp.width} 档：卡片流 mascot 不在待机态`);
      if (!cardFish.href) throw new Error(`${vp.width} 档：mascot 表情帧 href 为空`);

      // v2-M3' 场景背景断言:水面滤镜与云层不透明度 = 出生环境映射值(scene.ts 口径)
      const scene = await cdp.evaluate(`(() => {
        const w = document.querySelector(".screen-card .scene-water");
        const c = document.querySelector(".screen-card .scene-clouds");
        return { water: w?.getAttribute("style") ?? "", clouds: c?.getAttribute("style") ?? "" };
      })()`);
      if (!scene.water.includes(vp.expectScene.brightness)) {
        throw new Error(`${vp.width} 档：场景水面滤镜不符(预期含 ${vp.expectScene.brightness},实得 ${scene.water})`);
      }
      if (!scene.clouds.includes(vp.expectScene.clouds)) {
        throw new Error(`${vp.width} 档：场景云层不透明度不符(预期含 ${vp.expectScene.clouds},实得 ${scene.clouds})`);
      }
      // 截图留痕(暖帧丢弃:屏切 rise 动画 0.28s,先拍一张丢掉再拍正式——HANDOFF-M7 §五纪律)
      await cdp.send("Page.captureScreenshot", { format: "png" });
      const cardShot = await cdp.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(ROOT, "docs", "assets", vp.fishCardShot), Buffer.from(cardShot.data, "base64"));

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

      // 断言：关键屏节点 + 终局类型非空（v2/03 §1）+ mascot 主视觉（v2/03 §2）
      const verdict = await cdp.evaluate(`(() => {
        const ending = document.querySelector(".screen-ending");
        const title = ending?.querySelector("h2")?.textContent?.trim() ?? "";
        const letters = ending?.querySelector(".ending-type")?.textContent?.trim() ?? "";
        const radarSvg = !!ending?.querySelector("[data-slot='radar'] svg");
        const fishSvg = ending?.querySelector(".fish-mascot");
        const fishHref = fishSvg?.querySelector(".fish-frame")?.getAttribute("href") ?? "";
        const shareBtn = !!ending?.querySelector("[data-share]");
        const credits = !!ending?.querySelector(".about-links a[href*='credits']");
        return { title, letters, radarSvg, fishSvg: !!fishSvg, fishHref, shareBtn, credits };
      })()`);
      if (!verdict.title) throw new Error(`${vp.width} 档：终局标题为空`);
      if (!/^[EI][SN][TF][JP]$/.test(verdict.letters)) {
        throw new Error(`${vp.width} 档：终局类型字母非法「${verdict.letters}」`);
      }
      if (!verdict.credits) throw new Error(`${vp.width} 档：终局 credits 链接未渲染`);
      if (!verdict.radarSvg) throw new Error(`${vp.width} 档：终局雷达未渲染`);
      if (!verdict.fishSvg) throw new Error(`${vp.width} 档：终局 mascot 未渲染`);
      if (!verdict.fishHref) throw new Error(`${vp.width} 档：终局 mascot 表情帧 href 为空`);

      // v2-M3' 分享卡:终局「保存分享卡」按钮 → 真实下载落盘 → 文件名口径 xinlu-<mbti>-<yyyymmdd>.png
      if (!verdict.shareBtn) throw new Error(`${vp.width} 档：终局分享卡按钮未渲染`);
      const dlDir = join(tmpdir(), "xinlu-e2e-downloads-" + vp.width);
      rmSync(dlDir, { recursive: true, force: true });
      mkdirSync(dlDir, { recursive: true });
      // Browser domain 在 page session 直发(Edge/Chromium 支持);事件不依赖——轮询目录为准
      try {
        await cdp.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
      } catch {
        await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: dlDir });
      }
      await cdp.evaluate(`document.querySelector("[data-share]").click()`);
      const shareName = await waitFor(() => {
        if (!existsSync(dlDir)) return null;
        const names = readdirSync(dlDir).filter((n) => /^xinlu-[A-Z]{4}-\d{8}\.png$/.test(n));
        for (const n of names) {
          const size = statSync(join(dlDir, n)).size;
          if (size > 30000) return `${n}(${Math.round(size / 1024)}KB)`; // 完整 PNG(未完成的 .crdownload 不匹配)
        }
        return null;
      }, "分享卡 PNG 落盘", 30000);
      copyFileSync(join(dlDir, shareName.split("(")[0]), join(ROOT, "docs", "assets", vp.shareShot));
      verdict.share = shareName;

      // 截图留痕（暖帧丢弃：第一张合成器可能滞后，丢）
      await cdp.evaluate("window.scrollTo(0, 0)");
      await cdp.send("Page.captureScreenshot", { format: "png" });
      const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(ROOT, "docs", "assets", vp.shot), Buffer.from(shot.data, "base64"));
      writeFileSync(join(ROOT, "docs", "assets", vp.fishEndingShot), Buffer.from(shot.data, "base64"));

      // v2-M4' 图鉴:终局进度提示(未解锁型口径) → 重开 → 开局屏入口 → 图鉴屏断言(16 格/结局记录/累计局数/水合鱼像)
      const hint = await cdp.evaluate(`document.querySelector(".gallery-hint")?.textContent ?? ""`);
      if (!/已解锁 \d+ \/ 16 型|图鉴集齐/.test(hint)) {
        throw new Error(`${vp.width} 档：终局图鉴进度提示缺失（实得「${hint}」）`);
      }
      if (v === 0 && !hint.includes("新解锁")) {
        throw new Error(`${vp.width} 档：首局应提示新解锁型号（实得「${hint}」）`);
      }
      await cdp.evaluate(`document.querySelector("[data-restart]").click()`);
      if (!(await cdp.evaluate("!!document.querySelector('.screen-start')"))) {
        throw new Error(`${vp.width} 档：重开后未回开局屏`);
      }
      if (!(await cdp.evaluate("!!document.querySelector('[data-gallery-open]')"))) {
        throw new Error(`${vp.width} 档：开局屏图鉴入口未渲染`);
      }
      await cdp.evaluate(`document.querySelector("[data-gallery-open]").click()`);
      const gal = await cdp.evaluate(`(() => {
        const screen = document.querySelector(".screen-gallery");
        if (!screen) return null;
        const cells = [...screen.querySelectorAll(".gallery-cell")];
        const unlocked = cells.filter((c) => c.classList.contains("unlocked"));
        const records = [...screen.querySelectorAll(".gallery-record")];
        const unlockedRecords = records.filter((r) => r.classList.contains("unlocked"));
        return {
          progress: screen.querySelector(".gallery-progress")?.textContent ?? "",
          cells: cells.length,
          unlockedTypes: unlocked.map((c) => c.dataset.galleryType),
          records: records.length,
          unlockedRecords: unlockedRecords.length,
          fishCount: screen.querySelectorAll(".gallery-slot svg.fish-mascot").length,
        };
      })()`);
      if (!gal) throw new Error(`${vp.width} 档：图鉴屏未渲染`);
      if (gal.cells !== 16) throw new Error(`${vp.width} 档：图鉴格非 16（实得 ${gal.cells}）`);
      if (!gal.unlockedTypes.includes(verdict.letters)) {
        throw new Error(`${vp.width} 档：本局型号 ${verdict.letters} 未入图鉴（已解锁 ${gal.unlockedTypes.join(",")}）`);
      }
      if (gal.records !== 9) throw new Error(`${vp.width} 档：结局记录非 9 条（实得 ${gal.records}）`);
      if (gal.unlockedRecords < 1) throw new Error(`${vp.width} 档：结局记录无解锁条目`);
      // 水合像数 = 解锁型格 + 解局记录(每个解锁条目恰一只 avatar)
      if (gal.fishCount !== gal.unlockedTypes.length + gal.unlockedRecords) {
        throw new Error(`${vp.width} 档：图鉴 avatar 水合数不符（${gal.fishCount} ≠ ${gal.unlockedTypes.length}+${gal.unlockedRecords}）`);
      }
      const runsLine = `累计通关 ${v + 1} 局`;
      if (!gal.progress.includes(runsLine)) {
        throw new Error(`${vp.width} 档：图鉴累计局数不符（预期含「${runsLine}」，实得「${gal.progress}」）`);
      }
      // 图鉴屏截图留痕(暖帧丢弃纪律同上)
      await cdp.evaluate("window.scrollTo(0, 0)");
      await cdp.send("Page.captureScreenshot", { format: "png" });
      const galleryShot = await cdp.send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(ROOT, "docs", "assets", `v2m4-gallery-${vp.width}.png`), Buffer.from(galleryShot.data, "base64"));
      await cdp.evaluate(`document.querySelector("[data-gallery-back]").click()`);
      if (!(await cdp.evaluate("!!document.querySelector('.screen-start')"))) {
        throw new Error(`${vp.width} 档：图鉴返回未回开局屏`);
      }

      results.push({ viewport: vp.width, title: verdict.title, letters: verdict.letters, share: verdict.share });
      out(`      ✓ ${vp.width} 档通关：${verdict.title}（${verdict.letters}）分享卡 ${verdict.share}`);
    }

    out("[5/5] 断言汇总 …");
    out("=".repeat(56));
    for (const r of results) {
      out(`PASS  ${r.viewport}px  终局「${r.title}」 typeText=${r.letters} 雷达已渲染 mascot 已渲染 分享卡已落盘(${r.share}) 图鉴已断言`);
    }
    out(`PASS  截图留痕 docs/assets/${VIEWPORTS.map((v) => `${v.shot} + ${v.fishCardShot} + ${v.fishEndingShot}`).join(" / ")}`);
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
