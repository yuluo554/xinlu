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
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
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

      // v5 开局四步（plan/v5/02 §五）：step 1 只有三张玩法卡（其余一概不出现）+ 进度指示 1/4
      const step1 = await cdp.evaluate(`(() => ({
        modes: [...document.querySelectorAll("[data-mode]")].map((b) => b.dataset.mode),
        progress: !!document.querySelector("[data-start-progress]"),
        count: document.querySelector("[data-start-count]")?.textContent ?? "",
        stepAttr: document.querySelector(".screen-start")?.dataset.startStep ?? "",
        settings: !!document.querySelector("[data-settings-open]"),
        gallery: !!document.querySelector("[data-gallery-open]"),
        formsOnFirstScreen: document.querySelectorAll(".screen-start form, .screen-start .chip").length,
        cert: !!document.querySelector("[data-cert]"),
      }))()`);
      if (!step1.progress || step1.count !== "1/4" || step1.stepAttr !== "1") {
        throw new Error(`${vp.width} 档：开局进度指示非法（${JSON.stringify(step1)}）`);
      }
      if (JSON.stringify(step1.modes) !== JSON.stringify(["random", "manual", "custom"])) {
        throw new Error(`${vp.width} 档：step 1 玩法三选一缺失（${step1.modes.join(",")}）`);
      }
      // 一屏一个问题：首屏不得出现任何表单/chip/出生证明（治「首页元素太杂乱」，10 §四.1）
      if (step1.formsOnFirstScreen !== 0 || step1.cert) {
        throw new Error(`${vp.width} 档：step 1 混入了表单或出生证明（${step1.formsOnFirstScreen} 个节点）`);
      }
      if (!step1.settings) throw new Error(`${vp.width} 档：设置入口缺失`);
      // 开局四步截图留痕（plan/v5/02 §五/§六：step 1 只有三张玩法卡）
      if (v === 0) {
        await cdp.send("Page.captureScreenshot", { format: "png" });
        const s1 = await cdp.send("Page.captureScreenshot", { format: "png" });
        writeFileSync(join(ROOT, "docs", "assets", "v5-start-step1-375.png"), Buffer.from(s1.data, "base64"));
      }

      // 回退保值（plan/v5/02 §五 DoD）：手选路径填值 → 回退 → 重进，值仍在
      // 随后把选择恢复成本档要断言的出生环境（场景水色/云层断言仍按 vp.env 口径）
      const targetEnv = vp.env ?? { era: "60s", place: "大城", mood: "和睦", style: "权威" };
      const backKeep = await cdp.evaluate(`(() => {
        const q = (s) => document.querySelector(s);
        const pick = (set) => {
          for (const [k, v] of Object.entries(set)) {
            const el = q('input[name="' + k + '"][value="' + v + '"]');
            if (el) el.click();
          }
        };
        q('[data-mode="manual"]').click();
        pick({ era: "90s", place: "小城", mood: "紧张", style: "忽视" });
        q("[data-start-back]").click();
        q('[data-mode="manual"]').click();
        const got = {};
        for (const k of ["era", "place", "mood", "style"]) got[k] = q('input[name="' + k + '"]:checked')?.value ?? "";
        const count = q("[data-start-count]")?.textContent ?? "";
        pick(${JSON.stringify(targetEnv)});
        return { got, count, restored: window.__restored ?? true };
      })()`);
      const WANT = { era: "90s", place: "小城", mood: "紧张", style: "忽视" };
      if (JSON.stringify(backKeep.got) !== JSON.stringify(WANT) || backKeep.count !== "2/4") {
        throw new Error(`${vp.width} 档：回退后重进已填值丢失（${JSON.stringify(backKeep)}）`);
      }
      // 开局四步截图留痕：step 2（填要素）
      if (v === 0) {
        await cdp.send("Page.captureScreenshot", { format: "png" });
        const s2 = await cdp.send("Page.captureScreenshot", { format: "png" });
        writeFileSync(join(ROOT, "docs", "assets", "v5-start-step2-375.png"), Buffer.from(s2.data, "base64"));
      }

      // 出生证明（step 3）：八因素全显性 + 家庭成员 + 种子码；「再来一次」确实改变结果
      const certInfo = await cdp.evaluate(`(() => {
        const q = (s) => document.querySelector(s);
        q("[data-env-form] button[type=submit]").click();
        const read = () => {
          const factors = {};
          for (const row of document.querySelectorAll("[data-cert-factor]")) {
            factors[row.dataset.certFactor] = row.querySelector("dd")?.textContent?.trim() ?? "";
          }
          return {
            factors,
            count: q("[data-start-count]")?.textContent ?? "",
            seed: q("[data-cert-seed]")?.textContent?.trim() ?? "",
            members: [...document.querySelectorAll("[data-cert-member]")].map((m) => m.dataset.certMember),
            reroll: !!q("[data-cert-reroll]"),
            use: !!q("[data-cert-use]"),
          };
        };
        const first = read();
        q("[data-cert-reroll]").click();
        const second = read();
        // 回到第一张证的口径：手选路径下 env 由玩家填，重掷只换年/画像——env 三格必须不变
        return { first, second };
      })()`);
      const CERT_KEYS = ["birthYear", "region", "place", "structure", "parentsJob", "wealth", "family", "seed"];
      for (const key of CERT_KEYS) {
        if (!(certInfo.first.factors[key] ?? "").trim()) {
          throw new Error(`${vp.width} 档：出生证明缺因素「${key}」（${JSON.stringify(certInfo.first.factors)}）`);
        }
      }
      if (certInfo.first.count !== "3/4") throw new Error(`${vp.width} 档：出生证明步进度非 3/4（${certInfo.first.count}）`);
      if (!/^XL-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(certInfo.first.seed)) {
        throw new Error(`${vp.width} 档：出生证明种子码非法「${certInfo.first.seed}」`);
      }
      if (certInfo.first.members.length < 1) throw new Error(`${vp.width} 档：出生证明家庭成员为空（应至少父母）`);
      if (!certInfo.first.reroll || !certInfo.first.use) {
        throw new Error(`${vp.width} 档：出生证明缺「再来一次」/「用这个」按钮`);
      }
      // 「再来一次」＝换种子重派：种子码必变，八因素里至少出生年/家境类某几项随之变（随机态）
      if (certInfo.second.seed === certInfo.first.seed) {
        throw new Error(`${vp.width} 档：出生证明「再来一次」未改变种子（${certInfo.first.seed}）`);
      }
      const changedCount = CERT_KEYS.filter((k) => certInfo.first.factors[k] !== certInfo.second.factors[k]).length;
      if (changedCount < 1) {
        throw new Error(`${vp.width} 档：「再来一次」未改变任何因素（${JSON.stringify(certInfo.first.factors)}）`);
      }
      // 出生证明卡截图留痕（此时仍在 step 3：八因素一屏读完 + 用这个/再来一次）
      if (v === 0) {
        await cdp.send("Page.captureScreenshot", { format: "png" });
        const certShot = await cdp.send("Page.captureScreenshot", { format: "png" });
        writeFileSync(join(ROOT, "docs", "assets", "v5-start-step3-cert-375.png"), Buffer.from(certShot.data, "base64"));
      }

      // 入场（step 4）：开场白 + 开始按钮；点开始时进度应停在 4/4
      const step4 = await cdp.evaluate(`(() => {
        const q = (s) => document.querySelector(s);
        q("[data-cert-use]").click();
        return {
          count: q("[data-start-count]")?.textContent ?? "",
          opening: q("[data-start-opening]")?.textContent?.trim() ?? "",
          enter: !!q("[data-start-enter]"),
          certAway: !q("[data-cert-use]"),
        };
      })()`);
      if (step4.count !== "4/4" || !step4.enter || !step4.opening) {
        throw new Error(`${vp.width} 档：入场步（4/4）未渲染开场与开始按钮（${JSON.stringify(step4)}）`);
      }
      await cdp.evaluate(`document.querySelector("[data-start-enter]").click()`);

      // v3-M2' 时间轴画卷断言:进入首卡——图标位/状态条/八段轨道在位,mascot 已按 08 §四降级(卡上无鱼)
      // v4-M1''':出生年命中锚年时首屏是时代卡（锚先于首事件注入），先穿过再断言事件卡
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

      // v5 卡片三层（plan/v5/02 §六）：L3 状态条默认折叠为一条细线 + L1 行宽 ≤34 字 + 细看展开对账
      const layer3 = await cdp.evaluate(`(() => {        const fold = document.querySelector("[data-statebar-fold]");
        const main = document.querySelector(".event-card .event-text");
        const card = document.querySelector(".event-card");
        const detail = card?.querySelector("[data-detail]");
        const lineEm = main ? getComputedStyle(main).maxWidth : "";
        // 行宽换算成「一行几个字」：正文 font-size × max-width（em）→ 汉字数
        const fs = main ? parseFloat(getComputedStyle(main).fontSize) : 0;
        const maxPx = main ? parseFloat(getComputedStyle(main).maxWidth) : 0;
        const chars = fs > 0 ? Math.round(maxPx / fs) : 0;
        const mainText = main?.textContent ?? "";
        let opened = null;
        if (detail) {
          detail.open = true;
          const el = detail.querySelector(".ev-detail-text");
          opened = {
            text: el?.textContent ?? "",
            prefix: (el?.textContent ?? "").startsWith(mainText.slice(0, 12)),
            visible: !!el && el.getBoundingClientRect().height > 0,
          };
          detail.open = false;
        }
        return {
          foldPresent: !!fold,
          foldOpen: fold?.open ?? null,
          dots: fold ? fold.querySelectorAll(".sb-dot").length : 0,
          rows: fold ? fold.querySelectorAll(".statebar .res").length : 0,
          maxWidth: lineEm,
          chars,
          mainLen: [...mainText].length,
          detail: opened,
        };
      })()`);
      if (!layer3.foldPresent) throw new Error(`${vp.width} 档：状态条缺折叠壳（L3 默认折叠，02 §六）`);
      if (layer3.foldOpen !== false) throw new Error(`${vp.width} 档：状态条默认应为折叠态（实得 open=${layer3.foldOpen}）`);
      if (layer3.dots !== 3) throw new Error(`${vp.width} 档：折叠摘要档位点非 3 个（实得 ${layer3.dots}）`);
      if (layer3.rows !== 3) throw new Error(`${vp.width} 档：折叠层内状态项非 3（实得 ${layer3.rows}）`);
      if (!(layer3.chars >= 1 && layer3.chars <= 34)) {
        throw new Error(`${vp.width} 档：正文行宽 ${layer3.chars} 字超出 ≤34 字口径（max-width ${layer3.maxWidth}）`);
      }
      if (layer3.detail) {
        if (!layer3.detail.visible) throw new Error(`${vp.width} 档：细看层展开后无可见正文`);
        if (!layer3.detail.prefix) throw new Error(`${vp.width} 档：细看层正文不以主句开头（内容零损失口径，02 §四）`);
        if ([...layer3.detail.text].length < layer3.mainLen) {
          throw new Error(`${vp.width} 档：细看层正文短于主句（${layer3.detail.text.length} < ${layer3.mainLen}）`);
        }
      }
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
      // v3-M1'':全程采集 data-age-months 序列与选项数（年龄不回退 + 选项数断言）
      // v3-M2'':增采状态条值域 / 图标覆盖 / critical 分级 / 浮动层
      // v4-M1''':增采年份徽章（YYYY 年 · N 岁，格式 + 年份随月龄单调）与时代卡出现计数
      // v4-M2''':增采五档词格式 / 阶段计数徽标增长（桌面）/ 阶段条高度恒定（移动 D6=A）/ 小结三观三轴
      // v5-M1'''':增采 单屏可见字数（≤160，02 §四）/ 节奏变体控件（02 §三）/ 细看折叠层 / 图谱逐位 role
      const ageSeq = [];
      const yearSeq = [];
      const singleScreen = [];
      const variantsSeen = new Set();
      let minOptions = Infinity;
      let maxOptions = 0;
      let endingSeen = false;
      let cardActions = 0;
      let criticalSeen = 0;
      let floatSeen = false;
      let detailCards = 0;
      let roleLabels = [];
      let optionsLockedSeen = false;
      // v4-M3''' 3.1：无图标卡 = objectKey 显式豁免（icon-map objectKey:null，v4/02 §六宁缺毋滥 ≤10%）；
      // 豁免总数 node 侧从对照表算（页面 DOM 无事件 id，精确对账归 validate I 区 + vitest）
      const exemptTotal = Object.values(JSON.parse(readFileSync(join(ROOT, "src", "data", "icon-map.json"), "utf8"))).filter(
        (v) => v && typeof v === "object" && v.objectKey === null,
      ).length;
      let noIconCards = 0;
      let countGrew = false;
      let railFixed = true;
      let relationsChecked = false;
      // v5 线索卡（plan/v5/02 §十）：本轮见过的线索数 + 首条线索的内容快照
      let clueCount = 0;
      let clueSeen = null;
      // v5 配图（plan/v5/02 §九）：见过配图的卡数 + 见过的场景图文件名集合 + 豁免卡数
      let sceneCards = 0;
      const sceneFiles = new Set();
      // v5.0.2 具象配图：<img> 解码失败计数（naturalWidth===0 = 资源 404 / 格式不支持）
      let sceneImgBroken = 0;
      // v5.0.2：至少一张配图必须真解码到 800×280（证明 AVIF 路径与格式在浏览器侧可用）
      let sceneImgOk = 0;
      let eraCards = 0;
      let summarySeen = null;
      // v5/02 §三 L2「触控 ≥44px」机检（v5-M6 补）：口径此前只有 CSS token（`.option` 56 / `.option-quick` 48 / `.btn` 44）
      // 与 docs/M3-手动清单 的目检项，**无自动断言**——CSS 一改就静默破口径。这里把全程事件卡内
      // `[data-option]` / `[data-continue]` 的最小边长记下来双端判红（判据面见 plan/v5/02 §三）。
      let touchMin = Infinity;
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
              scene: !!document.querySelector(".screen-summary [data-stage-scene] svg"),
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
            // v5：单屏可见量 = 主句 + 全部选项（02 §四 单屏 ≤160）；变体与细看入口
            const eventText = card.querySelector(".event-text")?.textContent ?? "";
            const optTexts = [...card.querySelectorAll("[data-option]")].map((b) => b.textContent ?? "");
            window.__screen = [...eventText].length + optTexts.reduce((a, t) => a + [...t].length, 0);
            window.__variant = card.dataset.variant ?? "";
            window.__kind = card.dataset.kind ?? "";
            window.__detail = !!card.querySelector("[data-detail]");
            window.__card = {
              critical: card.classList.contains("critical"),
              icon: !!card.querySelector(".ev-icon[data-icon]"),
            };
            opt.click();
            return "card";
          }
          // v5 read 变体（偶遇/过场无选项）：走「继续」——同一轮询里也算一次出牌
          const cont = document.querySelector("[data-continue]");
          if (cont) {
            const card2 = document.querySelector(".screen-card .event-card[data-age-months]");
            if (card2) {
              window.__screen = [...(card2.querySelector(".event-text")?.textContent ?? "")].length +
                [...card2.querySelectorAll("[data-option]")].reduce((a, b) => a + [...(b.textContent ?? "")].length, 0);
              window.__variant = card2.dataset.variant ?? "";
              window.__kind = card2.dataset.kind ?? "";
              window.__detail = !!card2.querySelector("[data-detail]");
            }
            cont.click();
            return card2 ? "card" : "next";
          }
          // v5 轻量线索卡（plan/v5/02 §十 D10）：2–3 条观察 + 2 个解读。
          // 采集一次（首见即记）后按下标点击继续；线索只写 flag，不产生后果屏。
          const clue = document.querySelector(".screen-clue[data-clue]");
          if (clue) {
            if (!window.__clueDone) {
              window.__clueDone = true;
              window.__clue = {
                prompts: [...clue.querySelectorAll("[data-clue-prompt]")].map((e) => e.textContent ?? ""),
                choices: [...clue.querySelectorAll("[data-clue-choice]")].map((e) => e.textContent ?? ""),
                // 线索卡不得带三观增量读数（它只写 flag，不改判定核）
                deltas: clue.querySelectorAll(".deltas").length,
              };
            }
            const btn = clue.querySelector("[data-clue-choice]");
            if (btn) {
              btn.click();
              return "clue";
            }
          }
          // 回到开局屏（重开之后）：四步一键走通（随机 → 出生证明 → 用这个 → 开始）
          if (document.querySelector("[data-mode]")) {
            document.querySelector("[data-mode='random']").click();
            document.querySelector("[data-random-birth]").click();
            document.querySelector("[data-cert-use]").click();
            document.querySelector("[data-start-enter]").click();
            return "start";
          }
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
            roles: [...document.querySelectorAll(".rel-list .rel-role")].map((e) => e.textContent ?? ""),
          }))()`);
          if (!rel.screen) throw new Error(`${vp.width} 档：图谱页未渲染`);
          if (rel.nodes < 3) throw new Error(`${vp.width} 档：图谱节点 ${rel.nodes} < 3（中心 + 父母）`);
          if (rel.edges < 2) throw new Error(`${vp.width} 档：图谱连线 ${rel.edges} < 2（父母各一线）`);
          if (rel.legend !== 4) throw new Error(`${vp.width} 档：tag 图例非 4 项（实得 ${rel.legend}）`);
          // v5/02 §八：双视图（tree 默认 / ring 切换）+ 节点详情。
          // 树视图层级：祖辈 y < 父母 y < 玩家 y；节点带 data-rel-node（详情入口）。
          const tree = await cdp.evaluate(`(() => {
            const gs = [...document.querySelectorAll("[data-relations-chart] [data-rel-node]")];
            const box = (id) => { const n = gs.find((g) => g.dataset.relNode === id); return n ? n.getBoundingClientRect().top : null; };
            return {
              mode: document.querySelector(".screen-relations")?.dataset.relViewMode ?? "",
              viewChips: document.querySelectorAll("[data-rel-view]").length,
              treeChecked: document.querySelector("[data-rel-view='tree']")?.checked ?? false,
              father: box("father"),
              mother: box("mother"),
              grandma: box("grandma"),
              you: box("__you__"),
            };
          })()`);
          if (tree.mode !== "tree") throw new Error(`${vp.width} 档：图谱默认视图不是 tree（实得「${tree.mode}」，v5/02 §八）`);
          if (tree.viewChips !== 2) throw new Error(`${vp.width} 档：视图切换控件 ${tree.viewChips} 个 ≠ 2（家谱树/关系网）`);
          if (!tree.treeChecked) throw new Error(`${vp.width} 档：默认未选中家谱树`);
          if (tree.you === null) throw new Error(`${vp.width} 档：树视图缺玩家节点`);
          // 层级 y 序：祖辈在父母之上，父母在玩家之上（缺该成员时跳过该条）
          if (tree.grandma !== null && tree.father !== null && !(tree.grandma < tree.father)) {
            throw new Error(`${vp.width} 档：树视图层级错（祖辈 y=${tree.grandma} 未在父母 y=${tree.father} 之上）`);
          }
          if (tree.father !== null && !(tree.father < tree.you)) {
            throw new Error(`${vp.width} 档：树视图层级错（父母 y=${tree.father} 未在玩家 y=${tree.you} 之上）`);
          }
          // 切到关系网：产物要换（连线用曲线 path）、切回树
          const ring = await cdp.evaluate(`(() => {
            const input = document.querySelector("[data-rel-view='ring']");
            input.checked = true;
            input.dispatchEvent(new Event("change", { bubbles: true }));
            const svg = document.querySelector("[data-relations-chart] svg");
            return {
              mode: document.querySelector(".screen-relations")?.dataset.relViewMode ?? "",
              paths: svg?.querySelectorAll("path").length ?? 0,
              label: svg?.getAttribute("aria-label") ?? "",
              nodes: svg?.querySelectorAll("[data-rel-node]").length ?? 0,
            };
          })()`);
          if (ring.mode !== "ring") throw new Error(`${vp.width} 档：切到关系网未生效（mode=${ring.mode}）`);
          if (ring.label !== "关系图谱") throw new Error(`${vp.width} 档：关系网 aria-label 非法「${ring.label}」`);
          if (ring.nodes < 3) throw new Error(`${vp.width} 档：关系网节点 ${ring.nodes} < 3`);
          // 节点详情：点右列清单行 → 面板出现（关系值 + 变化记录/「还没变过」）
          const detail = await cdp.evaluate(`(() => {
            const row = document.querySelector(".rel-list [data-npc]");
            if (!row) return { ok: false };
            row.click();
            const box = document.querySelector("[data-rel-detail]");
            return {
              ok: true,
              hidden: box?.hasAttribute("hidden") ?? true,
              name: box?.querySelector(".rel-detail-name")?.textContent ?? "",
              bond: box?.querySelector(".rel-detail-bond b")?.textContent ?? "",
              hasRecords: (box?.querySelectorAll(".rel-detail-list li").length ?? 0) > 0,
              empty: !!box?.querySelector(".rel-detail-empty"),
            };
          })()`);
          if (!detail.ok) throw new Error(`${vp.width} 档：图谱页无人物清单行（节点详情无从点开）`);
          if (detail.hidden) throw new Error(`${vp.width} 档：点清单行后详情面板仍隐藏（节点详情未接线）`);
          if (!detail.name) throw new Error(`${vp.width} 档：详情面板缺姓名`);
          if (!/^\d+$/.test(detail.bond ?? "")) throw new Error(`${vp.width} 档：详情面板关系值非法「${detail.bond}」`);
          if (!detail.hasRecords && !detail.empty) {
            throw new Error(`${vp.width} 档：详情面板既无变化记录也无「还没变过」提示（留了空白区）`);
          }
          // v5/02 §一：图谱标签逐位命名（父亲/母亲/祖父/…），禁「父母/祖辈/同辈」泛称
          roleLabels = rel.roles;
          // 截图留痕（v5/02 §八 双视图）：切回树视图后各拍一张。
          // 必须等换屏淡入动画走完，否则截到的是半透明帧（本轮踩过：整页发白）。
          await cdp.evaluate(`(() => {
            const t = document.querySelector("[data-rel-view='tree']");
            t.checked = true;
            t.dispatchEvent(new Event("change", { bubbles: true }));
          })()`);
          await sleep(700);
          const treeShot = await cdp.send("Page.captureScreenshot", { format: "png" });
          writeFileSync(join(ROOT, "docs", "assets", `v5-relations-tree-${vp.width}.png`), Buffer.from(treeShot.data, "base64"));
          await cdp.evaluate(`(() => {
            const r = document.querySelector("[data-rel-view='ring']");
            r.checked = true;
            r.dispatchEvent(new Event("change", { bubbles: true }));
          })()`);
          await sleep(500);
          const ringShot = await cdp.send("Page.captureScreenshot", { format: "png" });
          writeFileSync(join(ROOT, "docs", "assets", `v5-relations-ring-${vp.width}.png`), Buffer.from(ringShot.data, "base64"));
          await cdp.evaluate(`document.querySelector("[data-relations-back]").click()`);
          relationsChecked = true;
          continue;
        }
        if (acted === "clue") {
          // 线索卡首轮即断言：2–3 条观察 + 恰好 2 个解读 + 不带三观增量读数
          clueCount++;
          const info = await cdp.evaluate("window.__clue ?? null");
          if (info) {
            if (info.prompts.length < 2 || info.prompts.length > 3) {
              throw new Error(`${vp.width} 档：线索观察 ${info.prompts.length} 条不在 2–3（v5/02 §十）`);
            }
            if (info.prompts.some((p) => !p.trim())) throw new Error(`${vp.width} 档：线索观察有空文案`);
            if (info.choices.length !== 2) throw new Error(`${vp.width} 档：线索解读 ${info.choices.length} 个 ≠ 2`);
            if (info.deltas !== 0) throw new Error(`${vp.width} 档：线索卡不应出现三观增量读数（只写 flag）`);
            clueSeen = info;
          }
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
              screen: window.__screen ?? 0,
              variant: window.__variant ?? "",
              kind: window.__kind ?? "",
              detail: !!window.__detail,
              scene: document.querySelector(".event-card [data-ev-scene]")?.dataset.evScene ?? "",
              // v5.0.2：配图是 <img>（AVIF）而非内联 SVG——记解码结果与 src
              sceneImg: (() => {
                const im = document.querySelector(".event-card [data-ev-scene] img");
                if (!im) return null;
                return { src: im.getAttribute("src") ?? "", w: im.naturalWidth, h: im.naturalHeight, done: im.complete };
              })(),
              // v5/02 §三 L2：事件卡内的触控目标（选项按钮 / 「继续」按钮）边长实测
              ctrls: (() => {
                const bs = [...document.querySelectorAll(".event-card [data-option], .event-card [data-continue]")];
                const rects = bs.map((b) => b.getBoundingClientRect());
                const round = (n) => Math.round(n * 10) / 10;
                return {
                  n: bs.length,
                  minH: rects.length ? round(Math.min(...rects.map((r) => r.height))) : 0,
                  minW: rects.length ? round(Math.min(...rects.map((r) => r.width))) : 0,
                };
              })(),
            };
          })()`);
          ageSeq.push(sample.age);
          // v5 语义配图（plan/v5/02 §九）：有配图的卡记文件名；无配图 = 显式豁免（不渲染空框）
          if (sample.scene) {
            sceneCards++;
            sceneFiles.add(sample.scene);
            // v5.0.2：<img> 必须真解码（AVIF 路径失效 / 404 时 complete 且 naturalWidth 恒 0）
            // 只判「已结束但宽为 0」——采样时仍在解码中的不算错，避免误报。
            const si = sample.sceneImg;
            if (!si) sceneImgBroken++;
            else if (si.done && si.w === 0) sceneImgBroken++;
            else if (si.w === 800 && si.h === 280) sceneImgOk++;
            else if (si.w !== 0 && (si.w !== 800 || si.h !== 280)) {
              throw new Error(`${vp.width} 档：场景图「${sample.scene}」解码尺寸 ${si.w}×${si.h} ≠ 800×280`);
            }
          }
          const yearMatch = /^(19|20|21)\d{2} 年 · /.exec(sample.badge);
          if (!yearMatch) throw new Error(`${vp.width} 档：年份徽章格式非法「${sample.badge}」（v4/02 §一）`);
          yearSeq.push(Number(sample.badge.slice(0, 4)));
          // v5：节奏变体（02 §三）与单屏可见量（02 §四）
          variantsSeen.add(sample.variant);
          if (!["choice", "draw", "odds", "read", "quick"].includes(sample.variant)) {
            throw new Error(`${vp.width} 档：未知节奏变体「${sample.variant}」（02 §三 五档枚举）`);
          }
          if (sample.screen > 160) {
            throw new Error(`${vp.width} 档：单屏可见 ${sample.screen} 字 > 160（02 §四；卡 ${sample.age} 月龄）`);
          }
          singleScreen.push(sample.screen);
          // v5/02 §三 L2「触控 ≥44px」：逐卡实测事件卡内控件边长（口径机检补齐，v5-M6）
          if (sample.ctrls.n > 0) {
            touchMin = Math.min(touchMin, sample.ctrls.minH, sample.ctrls.minW);
            if (sample.ctrls.minH < 44 || sample.ctrls.minW < 44) {
              throw new Error(
                `${vp.width} 档：触控目标 <44px（实测 ${sample.ctrls.minH}×${sample.ctrls.minW}；卡 ${sample.age} 月龄 / 变体 ${sample.variant}；` +
                  `v5/02 §三 L2 触控 ≥44px——CSS 里 .option / .option-quick / .btn 的最小高度别改小）`,
              );
            }
          }
          if (sample.detail) detailCards++;
          if (sample.opts > 0) {
            // v5/02 §二：偶遇卡允许单选项「就这样走过去」；此处只统计主线/支线的选项数下限
            //（偶遇的 1 选项合法性由 validate E.OPTIONS 与单测守，E2E 不重复判）
            if (sample.kind !== "encounter") minOptions = Math.min(minOptions, sample.opts);
            maxOptions = Math.max(maxOptions, sample.opts);
          }
          if (!sample.card.icon) noIconCards++; // 豁免卡无图标位是预期（v4/02 §六）；超豁免总数即接线回归，verdict 区拦
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
      // v5/02 §四：每题 2–3 选项（v3 的「≥3」口径已废止；quick 固定 2，read 变体 0 选项不计）
      if (minOptions < 2) throw new Error(`${vp.width} 档：出现选项数 ${minOptions} < 2 的卡片（v5/02 §四 每题 2–3）`);
      if (maxOptions > 3) throw new Error(`${vp.width} 档：出现选项数 ${maxOptions} > 3 的卡片（v5/02 §四 上限 3）`);
      // v5/02 §三：全程至少出现 2 种节奏变体（同一呈现方式不给「节奏变体」这个名字）
      if (variantsSeen.size < 2) {
        throw new Error(`${vp.width} 档：全程只出现 ${variantsSeen.size} 种节奏变体（${[...variantsSeen].join(",")}）`);
      }
      // v5/02 §一：图谱标签逐位命名——必须出现父母槽的逐位 role，且不得出现泛称
      if (!relationsChecked) throw new Error(`${vp.width} 档：未走到图谱页（v3 起既有断言，勿删）`);
      const rolesJoined = roleLabels.join(" ");
      if (roleLabels.length === 0) throw new Error(`${vp.width} 档：图谱人物清单为空`);
      if (!/父亲|母亲/.test(rolesJoined)) {
        throw new Error(`${vp.width} 档：图谱未出现「父亲/母亲」逐位标签（v5/02 §一）：${rolesJoined}`);
      }
      for (const generic of ["父母", "祖辈", "同辈"]) {
        if (rolesJoined.includes(generic)) {
          throw new Error(`${vp.width} 档：图谱仍显示泛称「${generic}」（v5/02 §一 禁显示泛称）`);
        }
      }
      if (!floatSeen) throw new Error(`${vp.width} 档：全程未观察到后果浮动层（微反馈缺失）`);
      // v5 语义配图（plan/v5/02 §九）：一局跑下来要有配图，且配图不止一张（变体轮换生效）；
      // 文件名必须形如 <tag>-<variant>.avif（v5.0.2 具象配图层：AVIF 分发，见 docs/v5-M9-scene-webp.md）
      if (sceneCards < 10) throw new Error(`${vp.width} 档：全局带配图的卡仅 ${sceneCards} 张（配图接线疑似回归）`);
      if (sceneFiles.size < 6) {
        throw new Error(`${vp.width} 档：只用过 ${sceneFiles.size} 张不同的场景图（变体轮换疑似失效）`);
      }
      for (const f of sceneFiles) {
        if (!/^[a-z][a-z0-9-]*\.avif$/.test(f)) throw new Error(`${vp.width} 档：场景图文件名非法「${f}」`);
      }
      if (sceneImgBroken > 0) {
        throw new Error(`${vp.width} 档：${sceneImgBroken} 张场景配图的 <img> 解码失败（naturalWidth=0，资源路径或格式失效）`);
      }
      if (sceneImgOk < 1) {
        throw new Error(`${vp.width} 档：全程没有一张场景配图解码到 800×280（AVIF 解码路径疑似未生效）`);
      }
      // v5 轻量线索（plan/v5/02 §十）：非线索局允许 0 处；出现时必须合口径（上面 acted==="clue" 已逐项断言）
      // v5 轻量线索（plan/v5/02 §十）：一局走完必须真的遇到线索卡——
      // 「出现时才断言」会漏掉「永远不出现」这种回归，故这里要求 ≥1 次实证
      //（36 局 × 3 环境的引擎实证见 src/engine/clues.test.ts；E2E 只钉浏览器侧接线）。
      if (clueCount < 1) throw new Error(`${vp.width} 档：全程未遇到线索卡（v5/02 §十 线索未接线）`);
      if (clueSeen && clueSeen.choices.length !== 2) {
        throw new Error(`${vp.width} 档：线索解读数 ${clueSeen.choices.length} ≠ 2`);
      }
      if (noIconCards > exemptTotal) {
        throw new Error(`${vp.width} 档：无图标卡 ${noIconCards} 张 > 豁免总数 ${exemptTotal}（图标接线回归）`);
      }
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
      if (!summarySeen.scene) throw new Error(`${vp.width} 档：小结场景配图缺失（v4-M3''' 3.2）`);
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

      // v3-M3'' 设置页：开局屏入口 → 页面渲染（开关默认关）→ v5 补全（字号/动效/清档）→ 返回
      if (v === 0) {
        await cdp.evaluate(`document.querySelector("[data-settings-open]").click()`);
        const settingsSeen = await cdp.evaluate(`(() => ({
          screen: !!document.querySelector(".screen-settings"),
          enabled: document.querySelector(".settings-check input")?.checked ?? null,
          providers: document.querySelectorAll(".settings-form select[name=provider] option").length,
          themeChips: document.querySelectorAll("[data-theme-choice]").length,
          fontChips: document.querySelectorAll("[data-font-choice]").length,
          motionChips: document.querySelectorAll("[data-motion-choice]").length,
          clearBtn: !!document.querySelector("[data-clear-save]"),
          font: document.documentElement.dataset.font ?? "(none)",
          motion: document.documentElement.dataset.motion ?? "(none)",
          texWash: getComputedStyle(document.documentElement).getPropertyValue("--tex-wash").trim(),
          bodyBgImage: getComputedStyle(document.body, "::before").backgroundImage,
        }))()`);
        if (!settingsSeen.screen) throw new Error(`${vp.width} 档：设置页未渲染`);
        if (settingsSeen.enabled !== false) throw new Error(`${vp.width} 档：旁路开关默认应为关`);
        if (settingsSeen.providers < 4) throw new Error(`${vp.width} 档：服务商预设 < 4`);
        if (settingsSeen.themeChips !== 4) throw new Error(`${vp.width} 档：主题 chips 非 4 款（实得 ${settingsSeen.themeChips}）`);
        // v5/02 §七 素纸（D8）：纹理层已删——--tex-wash: 0 且 body::before 不再挂背景图
        if (settingsSeen.texWash !== "0") throw new Error(`${vp.width} 档：素纸 --tex-wash 非 0（实得「${settingsSeen.texWash}」）`);
        if (settingsSeen.bodyBgImage !== "none") {
          throw new Error(`${vp.width} 档：纹理层仍在（body::before background-image=${settingsSeen.bodyBgImage}）`);
        }
        // v5 设置页补全：字号两档 + 动效两档 + 清档按钮
        if (settingsSeen.fontChips !== 2) throw new Error(`${vp.width} 档：字号 chips 非 2 档（实得 ${settingsSeen.fontChips}）`);
        if (settingsSeen.motionChips !== 2) throw new Error(`${vp.width} 档：动效 chips 非 2 档（实得 ${settingsSeen.motionChips}）`);
        if (!settingsSeen.clearBtn) throw new Error(`${vp.width} 档：设置页缺「清除存档」按钮`);
        if (settingsSeen.font !== "normal" || settingsSeen.motion !== "full") {
          throw new Error(`${vp.width} 档：默认阅读偏好非法（${settingsSeen.font}/${settingsSeen.motion}）`);
        }
        // 阅读偏好即时生效 + 独立键落盘
        const prefSwitch = await cdp.evaluate(`(() => {
          const large = document.querySelector('[data-font-choice][value="large"]');
          const reduced = document.querySelector('[data-motion-choice][value="reduced"]');
          large.click();
          const largeBody = getComputedStyle(document.querySelector(".settings-label p")).fontSize;
          reduced.click();
          const reducedAnim = getComputedStyle(document.querySelector(".screen-settings")).animationName;
          const raw = JSON.parse(localStorage.getItem("xinlu.prefs.v1") ?? "{}");
          document.querySelector('[data-font-choice][value="normal"]').click();
          document.querySelector('[data-motion-choice][value="full"]').click();
          return { largeBody, reducedAnim, raw, back: document.documentElement.dataset.font };
        })()`);
        if (prefSwitch.largeBody === "15px") throw new Error(`${vp.width} 档：字号切换未生效（正文仍 ${prefSwitch.largeBody}）`);
        if (prefSwitch.reducedAnim !== "none") throw new Error(`${vp.width} 档：减弱动效未关掉换屏动画（${prefSwitch.reducedAnim}）`);
        if (prefSwitch.raw.font !== "large" || prefSwitch.raw.motion !== "reduced") {
          throw new Error(`${vp.width} 档：阅读偏好未落盘（${JSON.stringify(prefSwitch.raw)}）`);
        }
        if (prefSwitch.back !== "normal") throw new Error(`${vp.width} 档：字号未复原（${prefSwitch.back}）`);
        // 清档：两步确认；只清存档键，主题与偏好保留。
        // 说明：此处刚重开过（存档键已清），故先放一个哨兵键把按钮点亮——本段只验「清档按钮 →
        // 两步确认 → 键消失 → 设置不连带被清」这条路；真实存档的写入/续局由上面的整局通关覆盖。
        const cleared = await cdp.evaluate(`(() => {
          localStorage.setItem("xinlu.save.v3", "{}");
          document.querySelector("[data-settings-back]").click();
          document.querySelector("[data-settings-open]").click();
          const btn = document.querySelector("[data-clear-save]");
          const before = localStorage.getItem("xinlu.save.v3") !== null;
          const enabled = !btn.disabled;
          btn.click();
          const armed = btn.textContent;
          btn.click();
          return {
            before,
            enabled,
            armed,
            after: localStorage.getItem("xinlu.save.v3") !== null,
            theme: localStorage.getItem("xinlu.theme.v1"),
            prefs: localStorage.getItem("xinlu.prefs.v1") !== null,
          };
        })()`);
        if (!cleared.before || !cleared.enabled) throw new Error(`${vp.width} 档：清档按钮未按存档在位/缺位切换`);
        if (!cleared.armed.includes("确认")) throw new Error(`${vp.width} 档：清档无两步确认（${cleared.armed}）`);
        if (cleared.after) throw new Error(`${vp.width} 档：清档后存档键仍在`);
        if (!cleared.prefs) throw new Error(`${vp.width} 档：清档误删阅读偏好（应只清存档键）`);
        // v4-M2''' 主题四款（02 §五）：切夜航即时生效（data-theme + 深底）+ 独立键落盘；切回米纸复原
        // v4-M3''' 3.3 追加：夜航下内联 SVG 的 var(--surface/--ink) 解析为夜航值（图谱/场景图同机制，防米纸 fallback 死色）
        const themeSwitch = await cdp.evaluate(`(() => {
          const night = document.querySelector('[data-theme-choice][value="night"]');
          if (!night) return { ok: false };
          night.click();
          const nightAttr = document.documentElement.dataset.theme;
          const nightBg = getComputedStyle(document.body).backgroundColor;
          const probe = document.createElement("div");
          probe.innerHTML = '<svg viewBox="0 0 10 10"><circle r="5" fill="var(--surface,#f7f1e3)"></circle><text fill="var(--ink,#3d3428)">测</text></svg>';
          document.body.appendChild(probe);
          const svgNode = getComputedStyle(probe.querySelector("circle")).fill;
          const svgText = getComputedStyle(probe.querySelector("text")).fill;
          probe.remove();
          const saved = localStorage.getItem("xinlu.theme.v1");
          const paper = document.querySelector('[data-theme-choice][value="paper"]');
          if (paper) paper.click();
          return {
            ok: true,
            nightAttr,
            nightBg,
            svgNode,
            svgText,
            saved,
            backAttr: document.documentElement.dataset.theme,
            backBg: getComputedStyle(document.body).backgroundColor,
          };
        })()`);
        if (!themeSwitch.ok) throw new Error(`${vp.width} 档：主题选项缺失`);
        if (themeSwitch.nightAttr !== "night") throw new Error(`${vp.width} 档：夜航未即时生效（${themeSwitch.nightAttr}）`);
        if (themeSwitch.svgNode === "rgb(247, 241, 227)" || themeSwitch.svgText === "rgb(61, 52, 40)") {
          throw new Error(`${vp.width} 档：夜航下内联 SVG 仍解析米纸 fallback（node ${themeSwitch.svgNode} / text ${themeSwitch.svgText}）`);
        }
        if (themeSwitch.saved !== "night") throw new Error(`${vp.width} 档：主题键未落盘（${themeSwitch.saved}）`);
        if (themeSwitch.nightBg === themeSwitch.backBg) {
          throw new Error(`${vp.width} 档：主题切换背景色未变（${themeSwitch.nightBg}）`);
        }
        if (themeSwitch.backAttr !== "paper") throw new Error(`${vp.width} 档：米纸未复原（${themeSwitch.backAttr}）`);
        // v5/02 §七：四主题截图留痕（素纸四款各一张，同一设置页同一点位）
        for (const themeId of ["paper", "moon", "night", "celadon"]) {
          await cdp.evaluate(`document.querySelector('[data-theme-choice][value="${themeId}"]').click()`);
          await cdp.evaluate("window.scrollTo(0, 0)");
          await cdp.send("Page.captureScreenshot", { format: "png" });
          const themeShot = await cdp.send("Page.captureScreenshot", { format: "png" });
          writeFileSync(join(ROOT, "docs", "assets", `v5-theme-${themeId}-375.png`), Buffer.from(themeShot.data, "base64"));
        }
        await cdp.evaluate(`document.querySelector('[data-theme-choice][value="paper"]').click()`);
        await cdp.evaluate(`document.querySelector("[data-settings-back]").click()`);
        if (!(await cdp.evaluate("!!document.querySelector('.screen-start')"))) {
          throw new Error(`${vp.width} 档：设置返回未回开局屏`);
        }
      }

      results.push({ viewport: vp.width, title: verdict.title, letters: verdict.letters, share: verdict.share, cards: ageSeq.length, ageSpan: `${ageSeq[0]}–${ageSeq[ageSeq.length - 1]}`, eraPolls: eraCards, variants: [...variantsSeen], maxScreen: Math.max(...singleScreen), touchMin });
      out(`      ✓ ${vp.width} 档通关：${verdict.title}（${verdict.letters}）分享卡 ${verdict.share}；卡片 ${ageSeq.length} 张年龄单调 ${ageSeq[0]}→${ageSeq[ageSeq.length - 1]} 月龄；年份徽章 ${yearSeq[0]}→${yearSeq[yearSeq.length - 1]} 单调；时代卡轮询 ${eraCards} 次；节奏变体 ${[...variantsSeen].join("+")}；单屏最长 ${Math.max(...singleScreen)} 字；细看层卡 ${detailCards} 张`);
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
    await cdp.evaluate(`(() => {
      document.querySelector("[data-mode='manual']").click();
      document.querySelector("[data-env-form] button[type=submit]").click();
      document.querySelector("[data-cert-use]").click();
      document.querySelector("[data-start-enter]").click();
    })()`);
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

    // ── v4-M1''' 自定义出生全流程（v5 起走开局四步：选玩法 → 八因素 → 出生证明 → 入场）──
    out("[4.7/5] v5 自定义出生全流程（1956 · 南方 · 大城 · 双孩 · 教师医生 · 一般）…");
    await cdp.evaluate("localStorage.removeItem('xinlu.save.v3'); localStorage.removeItem('xinlu.save.v2'); localStorage.removeItem('xinlu.save.v1')");
    await cdp.send("Page.navigate", { url: pageUrl });
    await cdp.waitEvent("Page.loadEventFired");
    const tabSwitched = await cdp.evaluate(`(() => {
      document.querySelector("[data-mode='custom']").click();
      return {
        step: document.querySelector(".screen-start")?.dataset.startStep ?? "",
        form: !!document.querySelector("[data-custom-form]"),
        yearSelect: !!document.querySelector("[data-custom-form] select[name=birthYear]"),
      };
    })()`);
    if (tabSwitched.step !== "2" || !tabSwitched.form || !tabSwitched.yearSelect) {
      throw new Error(`自定义八因素表单未渲染（${JSON.stringify(tabSwitched)}）`);
    }
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
      // 自定义态的证：八因素由玩家填定，只有家庭与种子码是派生的
      const factors = {};
      for (const row of document.querySelectorAll("[data-cert-factor]")) {
        factors[row.dataset.certFactor] = row.querySelector("dd")?.textContent?.trim() ?? "";
      }
      return { ok, factors, reroll: !!document.querySelector("[data-cert-reroll]") };
    })()`);
    if (!customSet.ok) throw new Error("自定义八因素表单装配失败（枚举值缺项）");
    // 自定义路径的出生证明：八因素与玩家填的一字不差；成员姓名与 generateFamily 同源（图谱页对账）
    const CUSTOM_WANT = { birthYear: "1956 年", region: "南方", place: "大城", structure: "双孩", parentsJob: "教师医生", wealth: "一般" };
    for (const [k, want] of Object.entries(CUSTOM_WANT)) {
      if (customSet.factors[k] !== want) {
        throw new Error(`自定义出生证明因素「${k}」不符（预期「${want}」，实得「${customSet.factors[k]}」）`);
      }
    }
    if (!customSet.factors.family || !customSet.factors.seed) throw new Error("自定义出生证明缺家庭成员/种子码");
    if (customSet.reroll) throw new Error("自定义态不应出现「再来一次」（因素由玩家填定，重掷无意义）");
    // step 3 → 4 → 入场：首屏 = 1956 时代卡（锚先于首事件注入），无选项
    await cdp.evaluate(`document.querySelector("[data-cert-use]").click(); document.querySelector("[data-start-enter]").click()`);
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
      out(`PASS  ${r.viewport}px  终局「${r.title}」 typeText=${r.letters} 雷达已渲染 mascot 已渲染 分享卡已落盘(${r.share}) 图鉴已断言 年龄全程单调(${r.ageSpan}) 年份徽章单调 选项2–3 单屏≤160(最长${r.maxScreen}) 触控≥44px(最小${r.touchMin}) 节奏变体(${r.variants.join("+")}) 图谱逐位role 图标(无图标卡≤豁免) critical分级/五档词状态条/阶段条聚合(D6=A)/浮动层/小结三观三轴/小结场景图/图谱页/种子码/自定义槽离线隐藏/主题四款切换+夜航SVG联动已断言`);
    }
    out("PASS  v5 自定义出生全流程：四步开局（step 2 八因素表单）/ 出生证明八因素逐项对账 / 1956 时代卡首屏 / 年份徽章 / 我的家庭图谱(本局姓名) / 存档 v3 形状");
    out(`PASS  截图留痕 docs/assets/${VIEWPORTS.map((v) => `${v.shot} + ${v.fishCardShot} + ${v.fishEndingShot}`).join(" / ")} + v5-start-step{1,2,3}-375 / v5-theme-{paper,moon,night,celadon}-375`);
    out("=".repeat(56));
    out("结论: e2e 冒烟全绿（375/1280 双端一键通关 + v5 开局四步与自定义出生全流程）");
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
