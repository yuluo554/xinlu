// 屏幕装配（字符串模板）。v5 界面改造：档案页式排版（framed-sheet）。
// 骨架三段：① 顶栏（字标 + 八段进度点 + 一两个动作）；② 本局实况带（年份戳 / 阶段 / 六线档位 / 三项状态）；
// ③ 白页正文（事件卡 / 小结 / 终局 / 图鉴 / 设置）。
// 排版纪律：年份与结局字母走 40px 大字；正文 17px；关键信息靠字号与留白分层，不靠加框与描边胶囊。
// 动态文本一律经 esc() 转义；出生四要素枚举由 engine.birthEnvOptions() 传入渲染，UI 不内联枚举清单（plan/03 §4）。
import {
  DIM_KEYS,
  STAGES,
  type BirthEnv,
  type DimKey,
  type Dims,
  type LineKey,
  type LineProgress,
  type ResKey,
  type Resources,
  type Stage,
} from "../engine/model";
import type { SceneBackdrop } from "../viz/scene";
import { DIM_SHORT, STAGE_LABEL, VALUES_AXIS_LABEL, type ChoiceReview, type ValuesNote } from "./logic";
import { ENDING_META, GALLERY_TYPES, type GalleryData } from "./gallery";
import { LINE_META, RES_META, RES_KEYS, type Floater, type TimelineSegment } from "./timeline";
import { moneyDisplay, resTier, type MoneyBand } from "./resources";
import { LINE_BAR_CELLS, lineBars } from "./lines";
import { decadeBands, yearTicks } from "./years";
import { THEMES, type ThemeId } from "./theme";
import { iconStyle } from "./icons";
import { NPC_PROFILES, TAG_COLORS, relationsVM, renderRelations } from "./relations";
import { PROVIDERS, type LlmSettings } from "../llm/config";
import type { RunState } from "../engine/model";
// 16 型画像一句话（图鉴解锁格用；未解锁不渲染，不留假内容）
import portraits from "../data/portraits.json" with { type: "json" };
// 场景氛围素材 URL(vite 静态 import → dist hash 文件名;水面/云层 = CC-BY Open Ocean 组)
import waterUrl from "../../assets/web-ready/open-ocean/Other/WikndWakerWater_Background.webp";
import cloudsUrl from "../../assets/web-ready/open-ocean/Other/Clouds_Background.webp";
// 小结阶段场景图(v4-M3''':自产 CC0 单色剪影,fill 用 CSS 变量随四主题联动;逐张对文案 docs/v4-M3-icons.md)
import infantScene from "../../assets/web-ready/stage-scenes/infant.svg?raw";
import toddlerScene from "../../assets/web-ready/stage-scenes/toddler.svg?raw";
import childhoodScene from "../../assets/web-ready/stage-scenes/childhood.svg?raw";
import teenScene from "../../assets/web-ready/stage-scenes/teen.svg?raw";
import youthScene from "../../assets/web-ready/stage-scenes/youth.svg?raw";
import adultScene from "../../assets/web-ready/stage-scenes/adult.svg?raw";
import midlifeScene from "../../assets/web-ready/stage-scenes/midlife.svg?raw";
import elderScene from "../../assets/web-ready/stage-scenes/elder.svg?raw";

/** 阶段 → 场景插画单源（v4/02 §七.1：小结主题头场景图）。 */
const STAGE_SCENES: Record<Stage, string> = {
  infant: infantScene,
  toddler: toddlerScene,
  childhood: childhoodScene,
  teen: teenScene,
  youth: youthScene,
  adult: adultScene,
  midlife: midlifeScene,
  elder: elderScene,
};

/** 场景氛围层(v2-M3' 3.3):水面纹理 + 云层,出生环境经 sceneBackdrop 驱动;装饰性,aria-hidden。 */
function sceneLayer(backdrop: SceneBackdrop): string {
  return `
    <div class="scene" data-scene aria-hidden="true">
      <div class="scene-water" style="background-image:url('${waterUrl}');filter:${backdrop.filter}"></div>
      <div class="scene-clouds" style="background-image:url('${cloudsUrl}');opacity:${backdrop.cloudsOpacity.toFixed(2)}"></div>
    </div>`;
}

export function esc(text: string): string {
  const table: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (c) => table[c]!);
}

const ELEMENT_META: Array<{ key: keyof BirthEnv; label: string }> = [
  { key: "era", label: "年代" },
  { key: "place", label: "城乡" },
  { key: "mood", label: "家庭氛围" },
  { key: "style", label: "教养方式" },
];

/** 自定义页签六因素中非 env 的四因素（城乡 place 复用 env 枚举）。 */
const PROFILE_META: Array<{ key: "region" | "structure" | "parentsJob" | "wealth"; label: string }> = [
  { key: "region", label: "南北" },
  { key: "structure", label: "家庭结构" },
  { key: "parentsJob", label: "父母职业" },
  { key: "wealth", label: "家境" },
];

/** 「YYYY 年 · N 岁」拆成大字年份 + 小字岁数（年份戳是每页的锚）。
 *  纯字符串切分（不用正则捕获），格式不符时整串当年份、岁数留空。 */
function splitYearBadge(badge: string): { year: string; age: string } {
  const cut = badge.indexOf("·");
  if (cut === -1) return { year: badge.replace("年", "").trim(), age: "" };
  const yearPart = badge.slice(0, cut).replace("年", "").trim();
  const agePart = badge.slice(cut + 1).trim();
  const isYear = yearPart.length === 4 && Number(yearPart) > 0;
  return isYear ? { year: yearPart, age: agePart } : { year: badge, age: "" };
}

/** 五格档位条片段（on = 已点亮格数）。 */
function barCells(level: number): string {
  return Array.from({ length: LINE_BAR_CELLS }, (_, i) => `<i${i < level ? ' class="on"' : ""}></i>`).join("");
}

/** 六线档位条（fate 作主干一行；支线五格，按档位着色）。 */
function lineBarRows(lines: LineProgress): string {
  return lineBars(lines)
    .map(
      (b) => `<div class="line-row ${b.cls}" data-line="${b.line}" data-level="${b.level}" title="${esc(b.label)}">
        <span class="line-name">${esc(b.label)}</span>
        <span class="line-bar" aria-hidden="true">${barCells(b.level)}</span>
      </div>`,
    )
    .join("");
}

/** 三项状态（心境 / 积蓄 / 健康）：五档词 + 细色条；积蓄换算「元」（数字只在浮动层）。
 *  E2E 契约：.statebar .res[data-res] / .res-word / .res-tier-bar i 宽度 / data-tier。 */
function statebar(resources: Resources | null, bump: readonly ResKey[], band: MoneyBand): string {
  if (!resources) return "";
  const items = RES_KEYS.map((key) => {
    const meta = RES_META[key];
    const bumpCls = bump.includes(key) ? " bump" : "";
    if (key === "money") {
      // 积蓄只给换算后的金额：它是绝对量（元），不是五档里的位置，因此不带档色条（E2E 口径）
      return `<span class="res res-money${bumpCls}" data-res="money" title="${meta.label}">
        <span class="res-icon" data-res-icon="${meta.icon}" style="${esc(iconStyle(meta.icon))}" aria-hidden="true"></span>
        <span class="res-word" data-res-word>${esc(moneyDisplay(resources.money, band))}</span>
      </span>`;
    }
    const tier = resTier(resources[key]);
    return `<span class="res res-${key} tier-${tier.tier}${bumpCls}" data-res="${key}" data-tier="${tier.tier}" title="${meta.label}">
      <span class="res-icon" data-res-icon="${meta.icon}" style="${esc(iconStyle(meta.icon))}" aria-hidden="true"></span>
      <span class="res-word" data-res-word>${meta.label} · ${esc(tier.word)}</span>
      <span class="res-tier-bar" aria-hidden="true"><i style="width:${resources[key]}%"></i></span>
    </span>`;
  }).join("");
  return `<div class="statebar" role="status" aria-label="状态">${items}</div>`;
}

function topbar(stageIndex: number, family = false): string {
  const dots = STAGES.map((_, i) =>
    `<span class="dot${i < stageIndex ? " done" : i === stageIndex ? " now" : ""}"></span>`,
  ).join("");
  return `
    <header class="topbar">
      <span class="wordmark">心路</span>
      <div class="dots" aria-label="人生进度">${dots}</div>
      ${family ? `<button type="button" class="btn-ghost btn-family" data-family-open aria-label="查看我的家庭图谱"><span class="res-icon" style="${esc(iconStyle("family-tree"))}" aria-hidden="true"></span>我的家庭</button>` : ""}
      <div class="topbar-actions">
        <button type="button" class="btn-ghost" data-restart>重开</button>
      </div>
    </header>`;
}

/** 年份戳（页眉）：大字年份 + 岁数。data-year-badge 挂在这里——E2E 从事件卡内读「YYYY 年 · N 岁」。 */
function yearStamp(yearBadge: string): string {
  const { year, age } = splitYearBadge(yearBadge);
  return `<p class="year-stamp"><span data-year-badge><b class="year-figure">${esc(year)}</b><span class="year-unit"> 年${age ? ` · ${esc(age)}` : ""}</span></span></p>`;
}

/** 本局实况带：阶段 + 六线 + 三项状态（年份由正文页眉承担，此处不重复）。
 *  桌面在左栏（竖）；移动折叠成正文顶部一段（横排）——同一段 DOM，CSS 换排法。 */
function liveBand(opts: {
  yearBadge: string;
  stageLabel: string;
  stageSub?: string;
  lines: LineProgress;
  resources: Resources;
  band: MoneyBand;
  bump?: readonly ResKey[];
}): string {
  return `
    <aside class="live-band" aria-label="本局实况">
      <p class="live-caption">六条线</p>
      <div class="lines" aria-label="六条人生线">${lineBarRows(opts.lines)}</div>
      <p class="live-caption">三项状态</p>
      ${statebar(opts.resources, opts.bump ?? [], opts.band)}
    </aside>`;
}

/** 人生轨道（D6=A 阶段级聚合）：移动端 = 顶部固定八段阶段条（小点 ≤5 封顶）；
 *  桌面 = 左轨竖列每段计数徽标；两形态同 VM，CSS 按断点切换。 */
function timelineRail(segments: readonly TimelineSegment[]): string {
  const rows = segments
    .map((seg) => {
      const dots = Array.from({ length: seg.dots }, () => `<span class="tl-dot"></span>`).join("");
      const ring = seg.criticalCount > 0 ? " has-critical" : "";
      return `<div class="timeline-segment status-${seg.status}${ring}" data-stage="${seg.stage}" data-count="${seg.count}" data-critical="${seg.criticalCount}">
        <div class="tl-head"><span class="tl-node" aria-hidden="true"></span><span class="tl-label tl-full">${seg.label}</span><span class="tl-label tl-short" aria-hidden="true">${seg.short}</span></div>
        <div class="tl-dots"${seg.dots === 0 ? ' data-empty="1"' : ""}>${dots}</div>
        <span class="tl-count" aria-hidden="true">${seg.count}</span>
      </div>`;
    })
    .join("");
  return `<nav class="timeline" aria-label="人生时间轴">${rows}</nav>`;
}

/** 后果微反馈浮动层（非阻塞，渲染即自播自灭；pointer-events:none 不拦截操作）。 */
function floatLayer(floaters: readonly Floater[]): string {
  if (floaters.length === 0) return "";
  const items = floaters
    .map((f, i) => `<span class="floater ${f.cls}" style="--fd:${i * 120}ms">${esc(f.text)}</span>`)
    .join("");
  return `<div class="float-layer" aria-hidden="true">${items}</div>`;
}

/** 单选 chip 组（手选/自定义页签共用）。 */
function chipGroup(name: string, values: readonly string[], label: string): string {
  const chips = values
    .map(
      (value, i) =>
        `<label class="chip"><input type="radio" name="${name}" value="${esc(value)}"${i === 0 ? " checked" : ""}><span>${esc(value)}</span></label>`,
    )
    .join("");
  return `<fieldset class="env-group"><legend>${esc(label)}</legend><div class="chips">${chips}</div></fieldset>`;
}

export interface StartScreenVM {
  env: Record<keyof BirthEnv, string[]>;
  profile: Record<"region" | "structure" | "parentsJob" | "wealth", string[]>;
  years: number[];
  error?: string;
}

/** 年份尺（开局屏正文最重的一块内容）：76 年逐年一格，每格挂该年的时代锚名。
 *  可选出生年（1955–2015）是可点的格；2016 之后只有锚名——那是「你会走到的年份」，不是起点。 */
function yearRuler(years: readonly number[]): string {
  if (!years.length) return "";
  const ticks = yearTicks(years);
  const rows = ticks
    .map((t) => {
      const cls = ["year-tick", t.selectable ? "selectable" : "beyond", t.anchor ? "has-anchor" : ""]
        .filter(Boolean)
        .join(" ");
      const body = t.anchor
        ? `<b>${t.year}</b><span>${esc(t.anchor)}</span>`
        : `<b>${t.year}</b><span aria-hidden="true"></span>`;
      return t.selectable
        ? `<button type="button" class="${cls}" data-birth-year="${t.year}" aria-label="出生于 ${t.year} 年${t.anchor ? `（${esc(t.anchor)}）` : ""}">${body}</button>`
        : `<span class="${cls}" aria-hidden="true">${body}</span>`;
    })
    .join("");
  // 出生域终点：2015 是最后一个可出生的年份，之后只能走到、不能生在那里
  const boundary = years[years.length - 1];
  const boundaryNote = boundary
    ? `<p class="year-boundary">${boundary} 是最后一个可以出生的年份。再往后，是你会走到的日子。</p>`
    : "";
  const bands = decadeBands(ticks)
    .map(
      (b) =>
        `<span class="year-decade"><b>${b.label}</b><i>${b.anchors} 个年代锚</i></span>`,
    )
    .join("");
  return `
    <div class="year-ruler-wrap">
      <div class="year-ruler-head">
        <h2>七十六个年份，七十六件旧事</h2>
        <p>每一格是一个年份，格子里写的是那一年的事。带下划线的年份可以出生；点一格，就从那一年开始。</p>
      </div>
      <div class="year-ruler" aria-label="年份与年代锚">${rows}</div>
      ${boundaryNote}
      <div class="year-decades" aria-hidden="true">${bands}</div>
    </div>`;
}

/** 开局屏（档案封面：三页签 + 八段一览 + 年份跨度写进正文）。 */
export function startScreen(vm: StartScreenVM): string {
  const manualGroups = ELEMENT_META.map(({ key, label }) => chipGroup(key, vm.env[key], label)).join("");
  const customGroups = PROFILE_META.map(({ key, label }) => chipGroup(key, vm.profile[key], label)).join("");
  const yearOptions = vm.years
    .map((y, i) => `<option value="${y}"${i === Math.floor(vm.years.length / 2) ? " selected" : ""}>${y} 年</option>`)
    .join("");
  const stageStrip = STAGES.map((s) => `<span>${STAGE_LABEL[s]}</span>`).join("");
  const first = vm.years[0] ?? 1955;
  const last = vm.years[vm.years.length - 1] ?? 2015;
  return `
    <section class="screen screen-start screen-narrow">
      <div class="screen-head">
        <h1>心路</h1>
        <p class="lede">从 ${first} 到 ${last} 之间挑一个出生年，走完八个阶段。四维倾向值随着每一次抉择慢慢长成人格；同一种子码，重走同一段人生。</p>
      </div>
      <div class="start-tabs">
        <input type="radio" name="birthTab" id="birth-tab-random" class="birth-tab-input" checked>
        <input type="radio" name="birthTab" id="birth-tab-manual" class="birth-tab-input">
        <input type="radio" name="birthTab" id="birth-tab-custom" class="birth-tab-input">
        <div class="start-tablist" role="tablist" aria-label="出生方式">
          <label for="birth-tab-random">随机出生</label>
          <label for="birth-tab-manual">手选环境</label>
          <label for="birth-tab-custom">自定义六因素</label>
        </div>
        <section class="start-panel" data-panel="random">
          <p class="muted">出生年、家庭结构、父母职业、家境，全部交给种子决定。</p>
          <div class="seed-tools">
            <button type="button" class="btn btn-primary" data-random-birth>随机出生</button>
            <form class="seed-form" data-seed-form>
              <input class="seed-input" name="seedCode" placeholder="或输入种子码 XL-XXXX-XXXX" autocomplete="off" spellcheck="false" aria-label="种子码">
              <button type="submit" class="btn btn-ghost">以此码开局</button>
            </form>
          </div>
        </section>
        <section class="start-panel" data-panel="manual">
          <form class="env-form" data-env-form>
            ${manualGroups}
            <p class="fine-print">出生年与其余四项（南北 / 家庭结构 / 父母职业 / 家境）按年代概率派生。</p>
            <button type="submit" class="btn btn-primary btn-start">开始这一生</button>
          </form>
        </section>
        <section class="start-panel" data-panel="custom">
          <form class="env-form" data-custom-form>
            <fieldset class="env-group"><legend>出生年</legend>
              <select class="year-select" name="birthYear" aria-label="出生年">${yearOptions}</select>
            </fieldset>
            ${chipGroup("place", vm.env.place, "城乡")}
            ${customGroups}
            <button type="submit" class="btn btn-primary btn-start">以这副牌开始一生</button>
          </form>
        </section>
      </div>
      ${yearRuler(vm.years)}
      <div class="stage-strip" aria-label="人生八阶段">${stageStrip}</div>
      ${vm.error ? `<p class="form-error">${esc(vm.error)}</p>` : ""}
      <p class="fine-print">单机运行，进度存在本机浏览器，不需要网络与账号。</p>
      <p class="about-links">
        <button type="button" class="btn-ghost" data-gallery-open>人格图鉴</button>
        <button type="button" class="btn-ghost" data-settings-open>设置</button>
        <a href="./credits.md" target="_blank" rel="noopener">素材与许可说明</a>
      </p>
    </section>`;
}

export function cardAskScreen(vm: {
  stageIndex: number;
  stage: Stage;
  ageHint: string;
  ageMonths: number;
  /** v4 年份徽章「YYYY 年 · N 岁」（runYearOf 派生）。 */
  yearBadge: string;
  text: string;
  options: string[];
  locks: boolean[];
  line: LineKey;
  critical: boolean;
  iconName: string;
  backdrop: SceneBackdrop;
  timeline: readonly TimelineSegment[];
  resources: Resources;
  lines: LineProgress;
  bump: readonly ResKey[];
  floaters: readonly Floater[];
  /** AI 自定义第 4 槽（v3/02 §七）：仅旁路可用时渲染（离线隐藏口径）。 */
  custom: boolean;
  customError?: string;
  /** 积蓄换算档（v4/02 §四：按本卡运行年份归段）。 */
  band: MoneyBand;
}): string {
  const line = LINE_META[vm.line];
  // 卡片头只说「这是哪条线的什么事」；年份与岁数归实况带（一处事实只出现一次）
  const head = `
    <header class="card-head">
      ${vm.iconName ? `<span class="ev-icon ${line.cls}" data-icon="${esc(vm.iconName)}" style="${esc(iconStyle(vm.iconName))}" aria-hidden="true"></span>` : ""}
      <div class="card-meta">
        <span class="chip chip-line ${line.cls}">${line.label}</span>
        ${vm.critical ? '<span class="critical-badge">重大抉择</span>' : ""}
      </div>
    </header>`;
  return `
    <section class="screen screen-card">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex, true)}
      ${floatLayer(vm.floaters)}
      <div class="sheet-body">
        ${timelineRail(vm.timeline)}
        <div class="rail">
          ${liveBand({
            yearBadge: vm.yearBadge,
            stageLabel: STAGE_LABEL[vm.stage],
            lines: vm.lines,
            resources: vm.resources,
            band: vm.band,
            bump: vm.bump,
          })}
        </div>
        <div class="stage-main">
          <article class="card event-card${vm.critical ? " critical" : ""}" data-age-months="${vm.ageMonths}">
            ${yearStamp(vm.yearBadge)}
            ${head}
            <p class="event-text">${esc(vm.text)}</p>
            <div class="options">
              ${vm.options
                .map(
                  (o, i) =>
                    vm.locks[i]
                      ? `<button type="button" class="option" data-option="${i}">${esc(o)}</button>`
                      : `<button type="button" class="option option-locked" data-option="${i}" disabled title="资源不足，此路暂不可选">${esc(o)}</button>`,
                )
                .join("")}
            </div>
            ${
              vm.custom
                ? `<div class="custom-slot" data-custom-slot>
              <input class="custom-input" name="customAction" placeholder="都不合意？写下你的行动，请 AI 裁决" maxlength="120" aria-label="自定义行动">
              <button type="button" class="btn btn-ghost" data-custom-submit>问 AI</button>
            </div>
            ${vm.customError ? `<p class="form-error custom-error">${esc(vm.customError)}</p>` : ""}`
                : ""
            }
          </article>
        </div>
      </div>
    </section>`;
}

/** 时代卡屏：无选项、固定增量；「继续」回事件流。样式上与事件卡同页，但顶线标为插页。 */
export function eraCardScreen(vm: {
  stageIndex: number;
  stage: Stage;
  yearBadge: string;
  titleHint: string;
  text: string;
  backdrop: SceneBackdrop;
  timeline: readonly TimelineSegment[];
  resources: Resources;
  lines: LineProgress;
  band: MoneyBand;
}): string {
  return `
    <section class="screen screen-card" data-era-card="1">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex, true)}
      <div class="sheet-body">
        ${timelineRail(vm.timeline)}
        <div class="rail">
          ${liveBand({
            yearBadge: vm.yearBadge,
            stageLabel: STAGE_LABEL[vm.stage],
            stageSub: "时代",
            lines: vm.lines,
            resources: vm.resources,
            band: vm.band,
          })}
        </div>
        <div class="stage-main">
          <article class="card event-card era-card">
            ${yearStamp(vm.yearBadge)}
            <header class="card-head">
              <div class="card-meta">
                <span class="chip chip-line line-fate">时代</span>
              </div>
            </header>
            <h3 class="era-title">${esc(vm.titleHint)}</h3>
            <p class="event-text">${esc(vm.text)}</p>
            <div class="options-row">
              <button type="button" class="btn btn-primary" data-continue>继续</button>
            </div>
          </article>
        </div>
      </div>
    </section>`;
}

export function cardAftermathScreen(vm: {
  stageIndex: number;
  stage: Stage;
  ageHint: string;
  yearBadge: string;
  aftermath: string;
  backdrop: SceneBackdrop;
  timeline: readonly TimelineSegment[];
  resources: Resources;
  lines: LineProgress;
  bump: readonly ResKey[];
  floaters: readonly Floater[];
  band: MoneyBand;
}): string {
  return `
    <section class="screen screen-card">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex, true)}
      ${floatLayer(vm.floaters)}
      <div class="sheet-body">
        ${timelineRail(vm.timeline)}
        <div class="rail">
          ${liveBand({
            yearBadge: vm.yearBadge,
            stageLabel: STAGE_LABEL[vm.stage],
            lines: vm.lines,
            resources: vm.resources,
            band: vm.band,
            bump: vm.bump,
          })}
        </div>
        <div class="stage-main">
          <article class="card event-card">
            ${yearStamp(vm.yearBadge)}
            <div class="fish-slot" data-slot="fish"></div>
            <p class="aftermath">${esc(vm.aftermath)}</p>
            <div class="options-row">
              <button type="button" class="btn btn-primary" data-continue>继续</button>
            </div>
          </article>
        </div>
      </div>
    </section>`;
}

/** 阶段小结：① 跨度大字头 ② 阶段场景图 ③ 六线走到哪 ④ 三观标尺（区间词 + 位移 + 独白）
 *  ⑤ 四维雷达淡影对比 ⑥ 身家状态 ⑦ 关键抉择回顾。 */
export function summaryScreen(vm: {
  stageIndex: number;
  stage: Stage;
  count: number;
  deltas: Dims;
  resources: Resources;
  lines: LineProgress;
  fishRadius: number;
  backdrop: SceneBackdrop;
  band: MoneyBand;
  yearRange: string;
  ageRange: string;
  valuesNotes: readonly ValuesNote[];
  stageCriticals: ChoiceReview[];
}): string {
  const items = DIM_KEYS.map((d: DimKey) => {
    const v = vm.deltas[d];
    const cls = v > 0 ? "up" : v < 0 ? "down" : "flat";
    const sign = v > 0 ? "+" : "";
    return `<div class="delta"><span>${DIM_SHORT[d]}</span><b class="${cls}">${sign}${v}</b></div>`;
  }).join("");
  const notes = vm.valuesNotes
    .map((n) => {
      const shiftText = n.shift === 0 ? "→0" : `${n.arrow}${Math.abs(n.shift)}`;
      const shiftCls = n.shift > 0 ? "up" : n.shift < 0 ? "down" : "flat";
      // 「世界观 · 理感相济」：轴名小字，区间词大字——一行读完一条轴，下面接内心独白。
      // 分隔符「 · 」两侧留实空格并留在文本里（E2E 断言的区间词行格式），不交给 CSS 生成。
      return `<div class="values-note" data-values-note data-axis="${n.axis}">
        <span class="vn-band"><em>${esc(VALUES_AXIS_LABEL[n.axis])}</em> · ${esc(n.bandWord)}</span>
        <b class="vn-shift ${shiftCls}">${shiftText}</b>
        <span class="vn-monologue">${esc(n.monologue)}</span>
      </div>`;
    })
    .join("");
  const resItems = RES_KEYS.map((key) => {
    const meta = RES_META[key];
    if (key === "money") {
      return `<span class="sum-res sum-money"><span class="res-icon" data-res-icon="${meta.icon}" style="${esc(iconStyle(meta.icon))}" aria-hidden="true"></span>${meta.label} <b data-sum-money>${esc(moneyDisplay(vm.resources.money, vm.band))}</b></span>`;
    }
    const tier = resTier(vm.resources[key]);
    return `<span class="sum-res tier-${tier.tier}"><span class="res-icon" data-res-icon="${meta.icon}" style="${esc(iconStyle(meta.icon))}" aria-hidden="true"></span>${meta.label} <b>${esc(tier.word)}</b></span>`;
  }).join("");
  const criticals =
    vm.stageCriticals.length > 0
      ? vm.stageCriticals
          .map(
            (c) =>
              `<div class="critical-item"><p class="critical-q">${esc(c.event.text)}</p><p class="critical-a">你选择了：${esc(c.optionText)}</p></div>`,
          )
          .join("")
      : `<p class="muted">这个阶段没有触发重大抉择。</p>`;
  return `
    <section class="screen screen-summary">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex)}
      <div class="screen-head">
        <h2>${STAGE_LABEL[vm.stage]} · 小结</h2>
        <p class="sum-head"><span class="sum-span" data-stage-span>${vm.yearRange ? esc(vm.yearRange) : esc(STAGE_LABEL[vm.stage])}</span><span class="sum-age">${vm.ageRange ? esc(vm.ageRange) : ""}</span></p>
      </div>
      <div class="stage-scene" data-stage-scene role="img" aria-label="${STAGE_LABEL[vm.stage]}阶段场景插画">${STAGE_SCENES[vm.stage]}</div>
      <div class="fish-slot fish-slot-stage" data-slot="fish" style="border-radius:${vm.fishRadius.toFixed(1)}px"></div>
      <h3 class="sum-h">六条人生线走到这里</h3>
      <div class="lines lines-wide" aria-label="六条人生线">${lineBarRows(vm.lines)}</div>
      <h3 class="sum-h">三观刻度</h3>
      <div class="values-notes">${notes}</div>
      <div class="viz-row two">
        <div class="radar-slot" data-slot="radar"></div>
        <div class="deltas">${items}</div>
      </div>
      <h3 class="sum-h">身家状态</h3>
      <div class="sum-res-row">${resItems}</div>
      <p class="muted sum-count">本阶段经历了 ${vm.count} 次抉择。</p>
      <h3 class="sum-h">关键抉择回顾</h3>
      <div class="criticals sum-criticals">${criticals}</div>
      <div class="options-row">
        <button type="button" class="btn btn-primary" data-continue>继续人生</button>
        <button type="button" class="btn btn-ghost" data-relations-open>关系图谱</button>
      </div>
    </section>`;
}

export function endingScreen(vm: {
  title: string;
  letters: string;
  text: string;
  retrospect: string[];
  criticals: ChoiceReview[];
  seedCode: string;
  resources: Resources;
  lines: LineProgress;
  fishRadius: number;
  backdrop: SceneBackdrop;
  gallery: GalleryHint | null;
  relations: RunState["npcs"];
  /** v4 历法迁移局提示：一句，不抢戏。 */
  migrated: boolean;
  band: MoneyBand;
}): string {
  const criticals =
    vm.criticals.length > 0
      ? vm.criticals
          .map(
            (c) =>
              `<div class="critical-item"><p class="critical-q">${esc(c.event.text)}</p><p class="critical-a">你选择了：${esc(c.optionText)}</p></div>`,
          )
          .join("")
      : `<p class="muted">这一段人生没有触发重大抉择。</p>`;
  const lineStates = lineBars(vm.lines)
    .map(
      (b) => `<div class="line-state ${b.cls}" data-line="${b.line}" data-level="${b.level}">
        <span class="line-name">${esc(b.label)}</span>
        <span class="line-bar" aria-hidden="true">${barCells(b.level)}</span>
        <span class="line-word">${esc(b.word)}</span>
      </div>`,
    )
    .join("");
  return `
    <section class="screen screen-ending">
      ${sceneLayer(vm.backdrop)}
      ${topbar(STAGES.length)}
      <div class="ending-head">
        <h2>${esc(vm.title)}</h2>
        <p class="ending-type" aria-label="人格类型">${esc(vm.letters)}</p>
      </div>
      <div class="fish-slot fish-slot-ending" data-slot="fish" style="border-radius:${vm.fishRadius.toFixed(1)}px"></div>
      <p class="ending-text">${esc(vm.text)}</p>
      ${vm.migrated ? '<p class="fine-print migrated-note">这段人生由旧版存档迁移而来：出生年与家庭按现行口径补派生。</p>' : ""}
      <div class="ending-commentary" data-llm-commentary aria-live="polite"></div>
      <div class="viz-row two">
        <div class="radar-slot" data-slot="radar"></div>
        <div class="curve-slot" data-slot="curve"></div>
      </div>
      <h3>六条人生线</h3>
      <div class="line-states">${lineStates}</div>
      <h3>复盘</h3>
      <ul class="retrospect">${vm.retrospect.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      <h3>关键抉择</h3>
      <div class="criticals">${criticals}</div>
      <h3>同行的人</h3>
      <div class="relations-snapshot" data-relations-snapshot>${renderRelations(vm.relations)}</div>
      <p class="fine-print">本局种子码 <span data-seed-code>${esc(vm.seedCode)}</span>。同码同人生；想重走或分享，开局屏输入这个码即可。</p>
      ${galleryHintLine(vm.gallery)}
      <div class="ending-actions">
        <button type="button" class="btn btn-primary" data-share>保存分享卡</button>
        <button type="button" class="btn btn-ghost" data-restart>重开一局</button>
      </div>
      <p class="about-links"><a href="./credits.md" target="_blank" rel="noopener">素材与许可说明</a></p>
    </section>`;
}

/** 终局图鉴进度提示（v2/03 §4「未解锁型」提示）的视图模型；null = 存储不可用等降级场景不渲染。 */
export interface GalleryHint {
  unlocked: number;
  total: number;
  letters: string;
  isNew: boolean;
  runs: number;
}

function galleryHintLine(hint: GalleryHint | null): string {
  if (!hint) return "";
  const unlockedPart =
    hint.unlocked >= hint.total
      ? `${hint.unlocked}/${hint.total} 型，图鉴集齐`
      : `已解锁 ${hint.unlocked} / ${hint.total} 型，还有 ${hint.total - hint.unlocked} 型未解锁`;
  const newPart = hint.isNew ? `；本局新解锁「${hint.letters}」` : "";
  return `<p class="gallery-hint fine-print">人格图鉴：${unlockedPart}${newPart}。累计通关 ${hint.runs} 局。</p>`;
}

/** 图鉴屏：全部未解锁 = 先讲清 16 型由什么组成（首屏空态规则，app-screens §11），
 *  有解锁则回到 16 格网格（avatar 缩略 + 一行画像；未上锁只留位置与「未解锁」）。 */
export function galleryScreen(gallery: GalleryData): string {
  const unlockedCount = Object.keys(gallery.types).length;
  const cells = GALLERY_TYPES.map((t) => {
    const entry = gallery.types[t];
    if (!entry) {
      return `<li class="gallery-cell locked"><span class="gallery-letters">未解锁</span></li>`;
    }
    const day = new Date(entry.firstSeenAt).toISOString().slice(0, 10);
    const portrait = (portraits as Record<string, string>)[t] ?? "";
    return `<li class="gallery-cell unlocked" data-gallery-type="${t}">
      <div class="gallery-slot" data-slot="gallery-fish"></div>
      <span class="gallery-letters">${t}</span>
      <span class="gallery-meta">×${entry.count} · ${day} 首见</span>
      ${portrait ? `<p class="gallery-portrait">${esc(portrait)}</p>` : ""}
    </li>`;
  }).join("");
  const records = ENDING_META.map((e) => {
    const count = gallery.endings[e.id];
    if (!count) {
      return `<li class="gallery-record locked"><span class="gallery-unknown">？？？</span><span class="gallery-record-title">尚未抵达的结局</span></li>`;
    }
    return `<li class="gallery-record unlocked" data-gallery-ending="${e.id}">
      <div class="gallery-slot" data-slot="gallery-fish"></div>
      <span class="gallery-record-title">${esc(e.title)}</span>
      <span class="gallery-meta">×${count}</span>
    </li>`;
  }).join("");
  return `
    <section class="screen screen-gallery screen-narrow">
      <div class="screen-head">
        <h2>人格图鉴</h2>
        <p class="gallery-progress">累计通关 ${gallery.runs} 局 · 已解锁 ${unlockedCount} / ${GALLERY_TYPES.length} 型</p>
      </div>
      ${
        unlockedCount === 0
          ? `<div class="gallery-empty">
        <p>十六型由四对倾向拼成：<b>E</b> 外向 / <b>I</b> 内向，<b>S</b> 实感 / <b>N</b> 直觉，<b>T</b> 思考 / <b>F</b> 情感，<b>J</b> 判断 / <b>P</b> 感知。走完一局，你的四维倾向会定格在其中一型。</p>
        <ul class="gallery-axes">
          <li><b>E — I</b><span>力气往外交，还是往内收</span></li>
          <li><b>S — N</b><span>信眼前的具体，还是信背后的可能</span></li>
          <li><b>T — F</b><span>先讲道理，还是先顾人情</span></li>
          <li><b>J — P</b><span>先定下来，还是先留着</span></li>
        </ul>
        <p class="gallery-note">第一型会随第一局通关自动上锁在下面这十六格里。</p>
      </div>`
          : ""
      }
      <ul class="gallery-grid">${cells}</ul>
      <h3>结局记录</h3>
      <p class="gallery-note">九种结局按四维与关键抉择判定；抵达过的会在这里记下次数。</p>
      <ul class="gallery-endings">${records}</ul>
      <div class="options-row">
        <button type="button" class="btn btn-primary" data-gallery-back>返回</button>
      </div>
    </section>`;
}

export function corruptScreen(): string {
  return `
    <section class="screen screen-corrupt screen-narrow">
      <div class="screen-head">
        <h2>存档无法读取</h2>
        <p>本机的存档似乎损坏了。我们不会动它的内容——你可以现在重新开始一段新的人生。</p>
      </div>
      <button type="button" class="btn btn-primary" data-restart>重新开始</button>
    </section>`;
}

/** 关系图谱页：左环形图谱 + 右同行的人清单（名 / 身份 / 羁绊长度条）。
 *  返回目标由 app 层决定（小结或终局）。 */
export function relationsScreen(npcs: RunState["npcs"]): string {
  const legend = Object.entries(TAG_COLORS)
    .map(([tag, color]) => `<span class="rel-legend-item"><i style="background:${color}"></i>${tag}</span>`)
    .join("");
  const known = Object.values(NPC_PROFILES).filter((p) => p.line !== "fate").length;
  const vm = relationsVM(npcs);
  const rows = vm.nodes
    .filter((n) => n.ring !== -1)
    .map((n) => {
      const color = TAG_COLORS[n.tag];
      return `<div class="rel-row" data-npc="${esc(n.id)}">
        <span class="rel-name">${esc(n.name)}</span>
        <span class="rel-role">${esc(n.role)} · ${esc(n.tag)}</span>
        <span class="rel-bond" title="羁绊 ${n.bond}">
          <span class="rel-bond-bar" aria-hidden="true"><i style="width:${n.bond}%;background:${color}"></i></span>
          <span>${n.bond}</span>
        </span>
      </div>`;
    })
    .join("");
  return `
    <section class="screen screen-relations">
      <div class="screen-head">
        <h2>关系图谱</h2>
        <p>一圈同行的人。线越粗，羁绊越深；颜色是现在的关系。</p>
      </div>
      <div class="rel-wrap">
        <div>
          <div class="relations-slot" data-relations-chart></div>
          <div class="rel-legend" aria-hidden="true">${legend}</div>
        </div>
        <div>
          <div class="rel-list">${rows || '<p class="muted">还没有人在册。</p>'}</div>
          <p class="rel-note">横条是羁绊的深浅（0–100），跟在后面的数字就是它的读数。图谱会随你的人生长出新名字（本段人生可能遇见 ${known} 位路人与父母同行）。</p>
          <div class="options-row">
            <button type="button" class="btn btn-primary" data-relations-back>返回</button>
          </div>
        </div>
      </div>
    </section>`;
}

/** 设置页：标签列 + 面板两栏（framed-sheet settings-two-column）。
 *  主题四款即时切换（独立键 xinlu.theme.v1）；BYO Key 明文存本机；未启用时全部字段不生效。 */
export function settingsScreen(vm: { settings: LlmSettings; theme: ThemeId; error?: string }): string {
  const providerOptions = PROVIDERS.map(
    (p) => `<option value="${esc(p.id)}"${p.id === vm.settings.provider ? " selected" : ""}>${esc(p.label)}</option>`,
  ).join("");
  const themeChips = THEMES.map(
    (t) =>
      `<label class="chip"><input type="radio" name="theme" value="${t.id}" data-theme-choice${t.id === vm.theme ? " checked" : ""}><span>${esc(t.label)}<span class="theme-swatch" data-theme="${t.id}" aria-hidden="true"><i class="sw-ground"></i><i class="sw-surface"></i><i class="sw-accent"></i></span><i class="theme-note">${esc(t.note)}</i></span></label>`,
  ).join("");
  return `
    <section class="screen screen-settings">
      <div class="screen-head">
        <h2>设置</h2>
      </div>
      <div class="settings-section">
        <div class="settings-label">
          <h3>界面主题</h3>
          <p>即时生效，存在本机，不随存档走。</p>
        </div>
        <div class="settings-panel">
          <div class="chips theme-chips">${themeChips}</div>
        </div>
      </div>
      <form data-settings-form>
        <div class="settings-section">
          <div class="settings-label">
            <h3>AI 旁路</h3>
            <p>可选。不启用或离线时，游戏行为与纯本地版完全一致。</p>
          </div>
          <div class="settings-panel settings-form">
            <label class="settings-check">
              <input type="checkbox" name="enabled"${vm.settings.enabled ? " checked" : ""}>
              启用 AI 旁路
            </label>
            <label>服务商
              <select name="provider">${providerOptions}</select>
            </label>
            <label>接口地址（Base URL，OpenAI 兼容）
              <input name="baseUrl" value="${esc(vm.settings.baseUrl)}" spellcheck="false">
            </label>
            <label>API Key
              <input name="apiKey" type="password" value="${esc(vm.settings.apiKey)}" autocomplete="off" spellcheck="false">
            </label>
            <label>模型名
              <input name="model" value="${esc(vm.settings.model)}" placeholder="例如 deepseek-chat" spellcheck="false">
            </label>
            <p class="fine-print">Key 以明文保存在本机浏览器，仅在你启用旁路后，为自定义行动裁决、事件变体与终局点评向所配服务商发起请求。请勿在公共设备填写。判定核心（人生演化本身）永不过网。</p>
            ${vm.error ? `<p class="form-error">${esc(vm.error)}</p>` : ""}
            <div class="settings-actions">
              <button type="submit" class="btn btn-primary">保存</button>
              <button type="button" class="btn btn-ghost" data-settings-back>返回</button>
            </div>
          </div>
        </div>
      </form>
    </section>`;
}
