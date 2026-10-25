#!/usr/bin/env node
// ═══ E2E 双端一键通关冒烟（v2-M1' 1.1 · v2/03 §1 契约；v3-M2'' 增时间轴/状态条/分级/浮动断言 + 768 中档截图）═══
// v4-M2''' 增量（plan/v4/02 §十）：状态条五档词+积蓄换算元 / D6=A 顶部八段阶段条（移动）+阶段计数徽标（桌面）/
//   主题四款切换（夜航即时生效+独立键）/ 小结三观三轴说明（区间词+箭头+独白）+ 身家状态五档行。
// 零新增依赖：node 24 内置 WebSocket 直连 CDP，驱动本机 Edge 无头实例。
// 流程：vite build → vite preview（静态服务）→ Edge headless（CDP 9223）→
//       375/1280 两档视口各完整通关一局（同步 evaluate 连点，套路 = plan/HANDOFF-M7 §五）→
//       断言关键屏节点与终局类型非空 → 截图留痕（暖帧丢弃）→ 768 中档布局断言 + 截图 → 清杀子进程。
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
const MAX_STEPS = 900; // 175 事件 × 2 屏 + 8 小结 + 开局 + rescue，余量 ~1.2 倍

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
        await cdp.evaluate("localStorage.removeItem('xinlu.save.v3'); localStorage.removeItem('xinlu.save.v2'); localStorage.removeItem('xinlu.save.v1')");
        await cdp.send("Page.navigate", { url: pageUrl });
        await cdp.waitEvent("Page.loadEventFired");
      } else {
        await cdp.send("Page.navigate", { url: pageUrl });
        await cdp.waitEvent("Page.loadEventFired");
      }

      const startSeen = await cdp.evaluate("!!document.querySelector('.screen-start')");
      if (!startSeen) throw new Error("开局屏未出现");
      // v4-M2''' 主题默认：无存储时挂 <html data-theme="paper">（02 §五）
      const themeDefault = await cdp.evaluate("document.documentElement.dataset.theme ?? '(none)'");
      if (themeDefault !== "paper") throw new Error(`默认主题应为米纸（实得 ${themeDefault}）`);

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

      // v3-M3'' 开局屏三入口 + v4 三页签（随机/手选/自定义）：提交开局前断言
      const startTools = await cdp.evaluate(`(() => ({
        random: !!document.querySelector("[data-random-birth]"),
        seed: !!document.querySelector("[data-seed-form] .seed-input"),
        settings: !!document.querySelector("[data-settings-open]"),
        tabs: document.querySelectorAll(".start-tablist label").length,
        customForm: !!document.querySelector("[data-custom-form]"),
        yearSelect: !!document.querySelector("[data-custom-form] select[name=birthYear]"),
      }))()`);
      if (!startTools.random || !startTools.seed || !startTools.settings) {
        throw new Error(`${vp.width} 档：开局屏种子码/随机出生/设置入口缺失（${JSON.stringify(startTools)}）`);
      }
      if (startTools.tabs !== 3 || !startTools.customForm || !startTools.yearSelect) {
        throw new Error(`${vp.width} 档：开局屏三页签/自定义表单缺失（${JSON.stringify(startTools)}）`);
      }

      // v3-M2' 时间轴画卷断言:提交开局进入首卡——图标位/状态条/八段轨道在位,mascot 已按 08 §四降级(卡上无鱼)
      // v4-M1''':出生年命中锚年时首屏是时代卡（锚先于首事件注入），先穿过再断言事件卡
      await cdp.evaluate(`document.querySelector("[data-env-form] button[type=submit]").click()`);
      for (let guard = 0; guard < 4; guard++) {
        const eraFirst = await cdp.evaluate(`!!document.querySelector("[data-era-card]")`);
        if (!eraFirst) break;
        await cdp.evaluate(`document.querySelector("[data-era-card] [data-continue]").click()`);
        await sleep(120);
      }
      const cardInfo = await cdp.evaluate(`(() => {
        const card = document.querySelector(".screen-card .event-card[data-age-months]");
        const icon = card?.querySelector(".ev-icon[data-icon]");
        const res = [...document.querySelectorAll(".statebar .res")].map((r) => ({
          key: r.dataset.res,
          word: r.querySelector(".res-word")?.textContent ?? "",
          tier: Number(r.dataset.tier ?? 0),
          bar: r.querySelector(".res-tier-bar i")?.style.width ?? "",
        }));
        const railBox = document.querySelector(".timeline")?.getBoundingClientRect();
        return {
          card: !!card,
          iconName: icon?.dataset.icon ?? "",
          iconMasked: icon ? (icon.style.getPropertyValue("--gi") || "").includes("url(") : false,
          statebar: res,
          railSegs: document.querySelectorAll(".timeline .timeline-segment").length,
          railW: railBox?.width ?? 0,
          railH: railBox?.height ?? 0,
          railDots: [...document.querySelectorAll(".timeline-segment")].map(
            (s) => s.querySelectorAll(".tl-dot").length,
          ),
          railCounts: [...document.querySelectorAll(".timeline-segment")].map(
            (s) => Number(s.dataset.count ?? 0),
          ),
          fishOnCard: !!document.querySelector(".screen-card .fish-mascot"),
        };
      })()`);
      if (!cardInfo.card) throw new Error(`${vp.width} 档：事件卡未渲染`);
      if (!cardInfo.iconName) throw new Error(`${vp.width} 档：事件卡图标位缺失（icon-map 未接线）`);
      if (!cardInfo.iconMasked) throw new Error(`${vp.width} 档：事件卡图标未挂 SVG mask URL`);
      if (cardInfo.statebar.length !== 3) throw new Error(`${vp.width} 档：状态条非 3 项（实得 ${cardInfo.statebar.length}）`);
      // v4-M2''' 五档词 + 换算元（02 §四）：mood/health「标签 · 档词」+tier+细色条；money「¥N,nnn」
      const TIER_WORDS = /^(萎靡|低落|平稳|良好|高涨)$/;
      for (const r of cardInfo.statebar) {
        if (r.key === "money") {
          if (!/^¥[\d,]+$/.test(r.word)) throw new Error(`${vp.width} 档：积蓄未换算元（实得「${r.word}」）`);
          if (r.tier !== 0 || r.bar !== "") throw new Error(`${vp.width} 档：积蓄不应带档色（${r.tier}/${r.bar}）`);
        } else {
          const label = r.key === "mood" ? "心境" : "健康";
          const hit = new RegExp("^" + label + " · (.+)$").exec(r.word);
          if (!hit || !TIER_WORDS.test(hit[1])) throw new Error(`${vp.width} 档：${label}五档词非法（实得「${r.word}」）`);
          if (!(r.tier >= 1 && r.tier <= 5)) throw new Error(`${vp.width} 档：${label}档位非法（${r.tier}）`);
          if (!/^\d+%$/.test(r.bar)) throw new Error(`${vp.width} 档：${label}细色条缺失（${r.bar}）`);
        }
      }
      if (cardInfo.railSegs !== 8) throw new Error(`${vp.width} 档：人生轨道非 8 段（实得 ${cardInfo.railSegs}）`);
      if (vp.width >= 768) {
        if (cardInfo.railW < 200 || cardInfo.railH <= cardInfo.railW) {
          throw new Error(`${vp.width} 档：桌面竖轨未生效（${cardInfo.railW.toFixed(0)}×${cardInfo.railH.toFixed(0)}px）`);
        }
        if (!cardInfo.railCounts.every((c) => Number.isInteger(c))) {
          throw new Error(`${vp.width} 档：阶段计数徽标缺失`);
        }
      } else {
        // D6=A：移动端顶部固定八段阶段条（横向矮条，不随事件增长）+ 小点 ≤5 封顶
        if (cardInfo.railH > 90 || cardInfo.railW <= cardInfo.railH) {
          throw new Error(`${vp.width} 档：顶部阶段条非横向固定形态（${cardInfo.railW.toFixed(0)}×${cardInfo.railH.toFixed(0)}px）`);
        }
        if (!cardInfo.railDots.every((d) => d <= 5)) {
          throw new Error(`${vp.width} 档：阶段条小点未封顶 ≤5（${cardInfo.railDots.join(",")}）`);
        }
      }
      if (cardInfo.fishOnCard) throw new Error(`${vp.width} 档：事件卡上仍有 mascot（08 §四降级口径：三类出场，卡由图标承担）`);
      // v3-M3'' 自定义第 4 槽离线隐藏口径（v3/02 §七）：默认无 Key/未启用 → 槽不渲染
      const customSlotOffline = await cdp.evaluate(`!!document.querySelector("[data-custom-slot]")`);
      if (customSlotOffline) throw new Error(`${vp.width} 档：离线状态下自定义槽仍渲染（v3/02 §七隐藏口径）`);

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
      // v3-M1'':全程采集 data-age-months 序列与选项数（年龄不回退 + ≥3 选项断言）
      // v3-M2'':增采状态条值域 / 图标覆盖 / critical 分级 / 浮动层
      // v4-M1''':增采年份徽章（YYYY 年 · N 岁，格式 + 年份随月龄单调）与时代卡出现计数
      // v4-M2''':增采五档词格式 / 阶段计数徽标增长（桌面）/ 阶段条高度恒定（移动 D6=A）/ 小结三观三轴
      const ageSeq = [];
      const yearSeq = [];
      let minOptions = Infinity;
      let endingSeen = false;
      let cardActions = 0;
      let criticalSeen = 0;
      let floatSeen = false;
      let countGrew = false;
      let railFixed = true;
      let relationsChecked = false;
      let eraCards = 0;
      let summarySeen = null;
      for (let step = 0; step < MAX_STEPS; step++) {
        const acted = await cdp.evaluate(`(() => {
          if (document.querySelector(".screen-ending")) return "ending";
          if (document.querySelector("[data-era-card]")) { window.__era = (window.__era ?? 0) + 1; }
          // v4-M2''' 小结三观三轴说明：首个阶段小结一次性采集（区间词/箭头/独白/身家状态/阶段跨度）
          if (!window.__sumDone && document.querySelector(".screen-summary [data-values-note]")) {
            window.__sumDone = true;
            window.__sum = {
              notes: [...document.querySelectorAll(".values-note")].map((n) => ({
                band: n.querySelector(".vn-band")?.textContent ?? "",
                shift: n.querySelector(".vn-shift")?.textContent ?? "",
                mono: n.querySelector(".vn-monologue")?.textContent ?? "",
              })),
              span: document.querySelector("[data-stage-span]")?.textContent ?? "",
              resRow: [...document.querySelectorAll(".sum-res b")].map((e) => e.textContent ?? ""),
              criticals: !!document.querySelector(".sum-criticals"),
            };
          }
          // v3-M3'' 图谱页：首个阶段小结时绕道图谱断言一圈（入口 → 渲染 → 返回）
          if (!window.__relDone && document.querySelector(".screen-summary [data-relations-open]")) {
            window.__relDone = true;
            document.querySelector("[data-relations-open]").click();
            return "relations";
          }
          const card = document.querySelector(".screen-card .event-card[data-age-months]");
          const opt = document.querySelector("[data-option]:not([disabled])");
          if (card && opt) {
            window.__age = Number(card.dataset.ageMonths);
            window.__opts = document.querySelectorAll("[data-option]").length;
            window.__badge = document.querySelector("[data-year-badge]")?.textContent ?? "";
            window.__card = {
              critical: card.classList.contains("critical"),
              icon: !!card.querySelector(".ev-icon[data-icon]"),
            };
            opt.click();
            return "card";
          }
          const cont = document.querySelector("[data-continue]");
          if (cont) { cont.click(); return "next"; }
          const start = document.querySelector("[data-env-form] button[type=submit]");
          if (start) { start.click(); return "start"; }
          return "stuck:" + (document.querySelector(".screen")?.className ?? "no-screen");
        })()`);
        if (acted === "ending") {
          endingSeen = true;
          summarySeen = await cdp.evaluate("window.__sum ?? null");
          break;
        }
        if (acted === "relations") {
          const rel = await cdp.evaluate(`(() => ({
            screen: !!document.querySelector(".screen-relations"),
            nodes: document.querySelectorAll("[data-relations-chart] svg g").length,
            edges: document.querySelectorAll("[data-relations-chart] svg line").length,
            legend: document.querySelectorAll(".rel-legend-item").length,
          }))()`);
          if (!rel.screen) throw new Error(`${vp.width} 档：图谱页未渲染`);
          if (rel.nodes < 3) throw new Error(`${vp.width} 档：图谱节点 ${rel.nodes} < 3（中心 + 父母）`);
          if (rel.edges < 2) throw new Error(`${vp.width} 档：图谱连线 ${rel.edges} < 2（父母各一线）`);
          if (rel.legend !== 4) throw new Error(`${vp.width} 档：tag 图例非 4 项（实得 ${rel.legend}）`);
          await cdp.evaluate(`document.querySelector("[data-relations-back]").click()`);
          relationsChecked = true;
          continue;
        }
        if (acted === "card") {
          cardActions++;
          const sample = await cdp.evaluate(`(() => {
            const box = document.querySelector(".timeline")?.getBoundingClientRect();
            if (window.__railH === undefined && box) window.__railH = box.height;
            return {
              age: window.__age,
              opts: window.__opts,
              badge: window.__badge ?? "",
              card: window.__card,
              words: [...document.querySelectorAll(".statebar .res-word")].map((e) => e.textContent ?? ""),
              cnt0: Number(document.querySelectorAll(".timeline-segment")[0]?.dataset.count ?? 0),
              railH: box?.height ?? 0,
              railH0: window.__railH ?? 0,
              floats: !!document.querySelector(".float-layer"),
            };
          })()`);
          ageSeq.push(sample.age);
          const yearMatch = /^(19|20|21)\d{2} 年 · /.exec(sample.badge);
          if (!yearMatch) throw new Error(`${vp.width} 档：年份徽章格式非法「${sample.badge}」（v4/02 §一）`);
          yearSeq.push(Number(sample.badge.slice(0, 4)));
          minOptions = Math.min(minOptions, sample.opts);
          if (!sample.card.icon) throw new Error(`${vp.width} 档：第 ${cardActions} 张卡无图标位`);
          if (sample.card.critical) criticalSeen++;
          if (sample.floats) floatSeen = true;
          // v4-M2'''：状态条三词格式（五档词 ×2 + 换算元 ×1）
          if (sample.words.length !== 3) throw new Error(`${vp.width} 档：状态词条数 ${sample.words.length} ≠ 3`);
          if (!/^心境 · (萎靡|低落|平稳|良好|高涨)$/.test(sample.words[0] ?? "")) {
            throw new Error(`${vp.width} 档：心境五档词非法「${sample.words[0]}」`);
          }
          if (!/^¥[\d,]+$/.test(sample.words[1] ?? "")) {
            throw new Error(`${vp.width} 档：积蓄换算元非法「${sample.words[1]}」`);
          }
          if (!/^健康 · (萎靡|低落|平稳|良好|高涨)$/.test(sample.words[2] ?? "")) {
            throw new Error(`${vp.width} 档：健康五档词非法「${sample.words[2]}」`);
          }
          // D6=A：阶段级聚合——桌面计数徽标增长；移动阶段条高度恒定（选多少张卡都不长高）
          if (cardActions >= 2 && sample.cnt0 >= 1) countGrew = true;
          if (sample.railH0 > 0 && Math.abs(sample.railH - sample.railH0) > 1) railFixed = false;
        }
        if (String(acted).startsWith("stuck:")) throw new Error(`页面卡在未知屏：${acted}`);
      }
      if (!endingSeen) throw new Error(`${vp.width} 档：${MAX_STEPS} 步内未到终局`);
      if (minOptions < 3) throw new Error(`${vp.width} 档：出现选项数 ${minOptions} < 3 的卡片（v3 口径 ≥3）`);
      if (!floatSeen) throw new Error(`${vp.width} 档：全程未观察到后果浮动层（微反馈缺失）`);
      if (vp.width >= 768 && !countGrew) throw new Error(`${vp.width} 档：桌面阶段计数徽标未随抉择增长`);
      if (vp.width < 768 && !railFixed) throw new Error(`${vp.width} 档：移动阶段条高度发生变化（D6=A 固定口径）`);
      if (criticalSeen < 1) throw new Error(`${vp.width} 档：全程未出现 critical 分级卡`);
      // v4-M2''' 小结三观呈现（02 §七）：三轴各一行 = 区间词 + 箭头 + 独白；身家状态行 + 阶段跨度句
      if (!summarySeen) throw new Error(`${vp.width} 档：全程未采集到阶段小结三观说明`);
      if (summarySeen.notes.length !== 3) throw new Error(`${vp.width} 档：三观说明非 3 轴（实得 ${summarySeen.notes.length}）`);
      for (const n of summarySeen.notes) {
        if (!/ · /.test(n.band) || !n.band.trim()) throw new Error(`${vp.width} 档：区间词行非法「${n.band}」`);
        if (!/^[↑↓→]\d+$/.test(n.shift)) throw new Error(`${vp.width} 档：位移箭头非法「${n.shift}」`);
        if ((n.mono ?? "").length < 8) throw new Error(`${vp.width} 档：独白未接线（「${n.mono}」）`);
      }
      if (!/[0-9]{4}/.test(summarySeen.span)) throw new Error(`${vp.width} 档：小结主题头缺年代区间（「${summarySeen.span}」）`);
      if (summarySeen.resRow.length !== 3) throw new Error(`${vp.width} 档：身家状态非 3 项（实得 ${summarySeen.resRow.length}）`);
      if (!summarySeen.criticals) throw new Error(`${vp.width} 档：小结关键抉择回顾段缺失`);
      for (let i = 1; i < yearSeq.length; i++) {
        if (yearSeq[i] < yearSeq[i - 1]) {
          throw new Error(`${vp.width} 档：年份回退 ${yearSeq[i - 1]} → ${yearSeq[i]}（第 ${i} 张卡，v4/02 §一）`);
        }
      }
      // 时代卡出现观察量（每张时代卡至少占一轮询轮次；硬断言在 [4.7/5] 自定义段做）
      eraCards = await cdp.evaluate("window.__era ?? 0");
      for (let i = 1; i < ageSeq.length; i++) {
        if (ageSeq[i] < ageSeq[i - 1]) {
          throw new Error(`${vp.width} 档：年龄回退 ${ageSeq[i - 1]} → ${ageSeq[i]}（第 ${i} 张卡，v3 单调口径）`);
        }
      }

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

      // v3-M3'' 终局三断言：种子码形 / 图谱快照收录 / 点评位（离线 = 预设文案）
      const m3Ending = await cdp.evaluate(`(() => {
        const ending = document.querySelector(".screen-ending");
        return {
          seedCode: ending?.querySelector("[data-seed-code]")?.textContent?.trim() ?? "",
          snapshotNodes: ending?.querySelectorAll("[data-relations-snapshot] svg g").length ?? 0,
          commentary: ending?.querySelector("[data-llm-commentary]")?.textContent?.trim() ?? "",
        };
      })()`);
      if (!/^XL-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(m3Ending.seedCode)) {
        throw new Error(`${vp.width} 档：终局种子码非法「${m3Ending.seedCode}」（应 XL-XXXX-XXXX）`);
      }
      if (m3Ending.snapshotNodes < 4) {
        throw new Error(`${vp.width} 档：终局图谱快照节点 ${m3Ending.snapshotNodes} < 4（整局消费支线事件后应有父母以外的 NPC 入册）`);
      }
      if (m3Ending.commentary.length < 10) {
        throw new Error(`${vp.width} 档：终局点评位为空（离线应为预设文案）`);
      }

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

      // v3-M3'' 设置页：开局屏入口 → 页面渲染（开关默认关）→ 返回
      if (v === 0) {
        await cdp.evaluate(`document.querySelector("[data-settings-open]").click()`);
        const settingsSeen = await cdp.evaluate(`(() => ({
          screen: !!document.querySelector(".screen-settings"),
          enabled: document.querySelector(".settings-check input")?.checked ?? null,
          providers: document.querySelectorAll(".settings-form select[name=provider] option").length,
          themeChips: document.querySelectorAll("[data-theme-choice]").length,
        }))()`);
        if (!settingsSeen.screen) throw new Error(`${vp.width} 档：设置页未渲染`);
        if (settingsSeen.enabled !== false) throw new Error(`${vp.width} 档：旁路开关默认应为关`);
        if (settingsSeen.providers < 4) throw new Error(`${vp.width} 档：服务商预设 < 4`);
        if (settingsSeen.themeChips !== 4) throw new Error(`${vp.width} 档：主题 chips 非 4 款（实得 ${settingsSeen.themeChips}）`);
        // v4-M2''' 主题四款（02 §五）：切夜航即时生效（data-theme + 深底）+ 独立键落盘；切回米纸复原
        const themeSwitch = await cdp.evaluate(`(() => {
          const night = document.querySelector('[data-theme-choice][value="night"]');
          if (!night) return { ok: false };
          night.click();
          const nightAttr = document.documentElement.dataset.theme;
          const nightBg = getComputedStyle(document.body).backgroundColor;
          const saved = localStorage.getItem("xinlu.theme.v1");
          const paper = document.querySelector('[data-theme-choice][value="paper"]');
          if (paper) paper.click();
          return {
            ok: true,
            nightAttr,
            nightBg,
            saved,
            backAttr: document.documentElement.dataset.theme,
            backBg: getComputedStyle(document.body).backgroundColor,
          };
        })()`);
        if (!themeSwitch.ok) throw new Error(`${vp.width} 档：主题选项缺失`);
        if (themeSwitch.nightAttr !== "night") throw new Error(`${vp.width} 档：夜航未即时生效（${themeSwitch.nightAttr}）`);
        if (themeSwitch.saved !== "night") throw new Error(`${vp.width} 档：主题键未落盘（${themeSwitch.saved}）`);
        if (themeSwitch.nightBg === themeSwitch.backBg) {
          throw new Error(`${vp.width} 档：主题切换背景色未变（${themeSwitch.nightBg}）`);
        }
        if (themeSwitch.backAttr !== "paper") throw new Error(`${vp.width} 档：米纸未复原（${themeSwitch.backAttr}）`);
        await cdp.evaluate(`document.querySelector("[data-settings-back]").click()`);
        if (!(await cdp.evaluate("!!document.querySelector('.screen-start')"))) {
          throw new Error(`${vp.width} 档：设置返回未回开局屏`);
        }
      }

      results.push({ viewport: vp.width, title: verdict.title, letters: verdict.letters, share: verdict.share, cards: ageSeq.length, ageSpan: `${ageSeq[0]}–${ageSeq[ageSeq.length - 1]}`, eraPolls: eraCards });
      out(`      ✓ ${vp.width} 档通关：${verdict.title}（${verdict.letters}）分享卡 ${verdict.share}；卡片 ${ageSeq.length} 张年龄单调 ${ageSeq[0]}→${ageSeq[ageSeq.length - 1]} 月龄；年份徽章 ${yearSeq[0]}→${yearSeq[yearSeq.length - 1]} 单调；时代卡轮询 ${eraCards} 次`);
    }

    // ── v3-M2'' 768 中档（三档截图口径：375/768/1280）：桌面竖轨布局断言 + 截图留痕，不重复全量通关 ──
    out("[4.5/5] 768 中档截图 + 桌面竖轨断言 …");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 768,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.evaluate("localStorage.removeItem('xinlu.save.v3'); localStorage.removeItem('xinlu.save.v2'); localStorage.removeItem('xinlu.save.v1')");
    await cdp.send("Page.navigate", { url: pageUrl });
    await cdp.waitEvent("Page.loadEventFired");
    await cdp.evaluate(`document.querySelector("[data-env-form] button[type=submit]").click()`);
    for (let guard = 0; guard < 4; guard++) {
      const eraFirst = await cdp.evaluate(`!!document.querySelector("[data-era-card]")`);
      if (!eraFirst) break;
      await cdp.evaluate(`document.querySelector("[data-era-card] [data-continue]").click()`);
      await sleep(120);
    }
    const mid = await cdp.evaluate(`(() => {
      const rail = document.querySelector(".timeline");
      const railBox = rail?.getBoundingClientRect();
      const card = document.querySelector(".screen-card .event-card[data-age-months]");
      return {
        railW: railBox?.width ?? 0,
        railH: railBox?.height ?? 0,
        railVisible: !!rail?.offsetParent,
        countChip: !!rail?.querySelector(".tl-count"),
        card: !!card,
        icon: !!card?.querySelector(".ev-icon[data-icon]"),
        statebar: document.querySelectorAll(".statebar .res").length,
      };
    })()`);
    if (!mid.card) throw new Error("768 档：事件卡未渲染");
    if (!mid.icon) throw new Error("768 档：事件卡图标位缺失");
    if (mid.statebar !== 3) throw new Error(`768 档：状态条非 3 项（实得 ${mid.statebar}）`);
    if (!mid.railVisible || mid.railW < 200 || mid.railH <= mid.railW) {
      throw new Error(`768 档：桌面竖轨未生效（${mid.railW.toFixed(0)}×${mid.railH.toFixed(0)}px）`);
    }
    if (!mid.countChip) throw new Error("768 档：阶段计数徽标缺失（D6=A 桌面收敛口径）");
    await cdp.send("Page.captureScreenshot", { format: "png" });
    const shot768 = await cdp.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(ROOT, "docs", "assets", "e2e-smoke-768.png"), Buffer.from(shot768.data, "base64"));
    out(`      ✓ 768 档：桌面竖轨 ${mid.railW.toFixed(0)}px + 阶段计数徽标 + 图标 + 状态条，截图 e2e-smoke-768.png`);

    // ── v4-M1''' 自定义出生全流程：三页签切换 → 六因素表单 → 首屏时代卡 → 年份徽章 → 「我的家庭」图谱 ──
    out("[4.7/5] v4 自定义出生全流程（1956 · 南方 · 大城 · 双孩 · 教师医生 · 一般）…");
    await cdp.evaluate("localStorage.removeItem('xinlu.save.v3'); localStorage.removeItem('xinlu.save.v2'); localStorage.removeItem('xinlu.save.v1')");
    await cdp.send("Page.navigate", { url: pageUrl });
    await cdp.waitEvent("Page.loadEventFired");
    const tabSwitched = await cdp.evaluate(`(() => {
      document.querySelector("label[for='birth-tab-custom']").click();
      const panel = document.querySelector("[data-panel='custom']");
      return { visible: !!panel && panel.offsetParent !== null, form: !!document.querySelector("[data-custom-form]") };
    })()`);
    if (!tabSwitched.visible || !tabSwitched.form) throw new Error(`自定义页签切换失败（${JSON.stringify(tabSwitched)}）`);
    const customSet = await cdp.evaluate(`(() => {
      const form = document.querySelector("[data-custom-form]");
      const year = form.querySelector("select[name=birthYear]");
      year.value = "1956";
      const picks = { place: "大城", region: "南方", structure: "双孩", parentsJob: "教师医生", wealth: "一般" };
      let ok = true;
      for (const [name, value] of Object.entries(picks)) {
        const el = form.querySelector('input[name="' + name + '"][value="' + value + '"]');
        if (el) el.click(); else ok = false;
      }
      form.querySelector("button[type=submit]").click();
      return ok;
    })()`);
    if (!customSet) throw new Error("自定义六因素表单装配失败（枚举值缺项）");
    // 首屏 = 1956 时代卡（锚先于首事件注入）：无选项、年份徽章 1956 年 · 0 岁
    const eraFirst = await waitFor(async () => {
      const card = await cdp.evaluate(`(() => {
        const era = document.querySelector("[data-era-card]");
        if (!era) return null;
        return { badge: era.querySelector("[data-year-badge]")?.textContent ?? "", title: era.querySelector(".era-title")?.textContent ?? "", options: era.querySelectorAll("[data-option]").length };
      })()`);
      return card;
    }, "1956 时代卡首屏");
    if (!/^1956 年 · 0 岁$/.test(eraFirst.badge)) throw new Error(`时代卡徽章非法「${eraFirst.badge}」`);
    if (eraFirst.options !== 0) throw new Error("时代卡不应有选项（02 §二无选项口径）");
    await cdp.evaluate(`document.querySelector("[data-era-card] [data-continue]").click()`);
    // 首事件卡（infant-011 · 3 个月 → 1956 年）年份徽章
    const firstCard = await waitFor(async () => {
      const badge = await cdp.evaluate(`document.querySelector(".event-card[data-age-months] [data-year-badge]")?.textContent ?? ""`);
      return badge || null;
    }, "自定义局首事件卡");
    if (!/^1956 年 · /.test(firstCard)) throw new Error(`自定义局首卡徽章非法「${firstCard}」`);
    // 「我的家庭」入口 → 图谱节点 = 生成器输出（双孩：父母 2 + 同辈 ≥1，中心外 ≥3 节点）且家庭 NPC 有本局姓名
    await cdp.evaluate(`document.querySelector("[data-family-open]").click()`);
    const family = await waitFor(async () => {
      const rel = await cdp.evaluate(`(() => {
        const screen = document.querySelector(".screen-relations");
        if (!screen) return null;
        const labels = [...screen.querySelectorAll("[data-relations-chart] svg g text")].map((t) => t.textContent);
        return { screen: true, nodes: screen.querySelectorAll("[data-relations-chart] svg g").length, labels };
      })()`);
      return rel?.screen ? rel : null;
    }, "我的家庭图谱页");
    if (family.nodes < 4) throw new Error(`开局图谱节点 ${family.nodes} < 4（中心 + 父母 + 双孩同辈）`);
    const namedCount = family.labels.filter((t) => t.length >= 3 && t !== "你").length;
    if (namedCount < 3) throw new Error(`家庭 NPC 本局姓名未上图谱（≥3 字名实得 ${namedCount} 个：${family.labels.join(",")}）`);
    await cdp.evaluate(`document.querySelector("[data-relations-back]").click()`);
    const backToCard = await cdp.evaluate(`!!document.querySelector(".event-card[data-age-months]")`);
    if (!backToCard) throw new Error("家庭图谱返回未回事件卡");
    // 存档 v3 落盘形状（birthYear/profile 键在位）
    const savedShape = await cdp.evaluate(`(() => {
      const raw = JSON.parse(localStorage.getItem("xinlu.save.v3") ?? "{}");
      return { v: raw.v, birthYear: raw.birthYear, profile: raw.profile, eraCard: Array.isArray(raw.history) && raw.history.some((h) => h.kind === "era") };
    })()`);
    if (savedShape.v !== 3 || savedShape.birthYear !== 1956 || !savedShape.profile || savedShape.profile.structure !== "双孩" || !savedShape.eraCard) {
      throw new Error(`存档 v3 形状非法（${JSON.stringify(savedShape)}）`);
    }
    out("      ✓ 自定义六因素开局：1956 时代卡首屏 + 年份徽章 + 我的家庭图谱（本局姓名）+ 存档 v3 含 era 条目");

    out("[5/5] 断言汇总 …");
    out("=".repeat(56));
    for (const r of results) {
      out(`PASS  ${r.viewport}px  终局「${r.title}」 typeText=${r.letters} 雷达已渲染 mascot 已渲染 分享卡已落盘(${r.share}) 图鉴已断言 年龄全程单调(${r.ageSpan}) 年份徽章单调 选项≥3 图标全覆盖 critical分级/五档词状态条/阶段条聚合(D6=A)/浮动层/小结三观三轴/图谱页/种子码/自定义槽离线隐藏/主题四款切换已断言`);
    }
    out("PASS  v4 自定义出生全流程：三页签/六因素表单/1956 时代卡首屏/年份徽章/我的家庭图谱(本局姓名)/存档 v3 形状");
    out(`PASS  截图留痕 docs/assets/${VIEWPORTS.map((v) => `${v.shot} + ${v.fishCardShot} + ${v.fishEndingShot}`).join(" / ")}`);
    out("=".repeat(56));
    out("结论: e2e 冒烟全绿（375/1280 双端一键通关 + v4 自定义出生全流程）");
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
