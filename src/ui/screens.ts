// 屏幕装配（字符串模板，v3-M2'' D4=B 时间轴画卷重设计）。
// 布局口径：桌面双栏（左八段轨道含线别色点 + 右事件卡），移动单列竖向时间轴（08 §四）；
// mascot 沿 08 §四降级为三类出场（抉择反馈表情=aftermath / 阶段转场彩蛋=summary / 终局庆祝=ending），事件卡以图标承担叙事。
// 动态文本一律经 esc() 转义；出生四要素枚举由 engine.birthEnvOptions() 传入渲染，UI 不内联枚举清单（plan/03 §4）。
import {
  DIM_KEYS,
  STAGES,
  type BirthEnv,
  type DimKey,
  type Dims,
  type LineKey,
  type ResKey,
  type Resources,
  type Stage,
} from "../engine/model";
import type { SceneBackdrop } from "../viz/scene";
import { DIM_SHORT, STAGE_LABEL, type ChoiceReview, type ValuesNote } from "./logic";
import { ENDING_META, GALLERY_TYPES, type GalleryData } from "./gallery";
import { LINE_META, RES_META, RES_KEYS, type Floater, type TimelineSegment } from "./timeline";
import { moneyDisplay, resTier, type MoneyBand } from "./resources";
import { THEMES, type ThemeId } from "./theme";
import { iconStyle } from "./icons";
import { NPC_PROFILES, TAG_COLORS, renderRelations } from "./relations";
import { PROVIDERS, type LlmSettings } from "../llm/config";
import type { RunState } from "../engine/model";
// 场景氛围素材 URL(vite 静态 import → dist hash 文件名;水面/云层 = CC-BY Open Ocean 组,图标 = Simple Worlds 提取件)
import waterUrl from "../../assets/web-ready/open-ocean/Other/WikndWakerWater_Background.webp";
import cloudsUrl from "../../assets/web-ready/open-ocean/Other/Clouds_Background.webp";
import jellyfishSvg from "../../assets/cc-by/simple-worlds-ocean-animals/jellyfish.svg";

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

/** 常驻状态条（v4/02 §四 ▸ M2''' 增补）：mood/health 五档词 + 细色条（数值只在浮动层出现），
 *  money 换算「元」口语；bump = 本步有增损的资源键，渲染即触发词弹跳。 */
function statebar(resources: Resources | null, bump: readonly ResKey[], band: MoneyBand): string {
  if (!resources) return "";
  const items = RES_KEYS.map((key) => {
    const meta = RES_META[key];
    const bumpCls = bump.includes(key) ? " bump" : "";
    if (key === "money") {
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

function topbar(
  stageIndex: number,
  resources: Resources | null = null,
  bump: readonly ResKey[] = [],
  family = false,
  band: MoneyBand = "90s",
): string {
  const dots = STAGES.map((_, i) =>
    `<span class="dot${i < stageIndex ? " done" : i === stageIndex ? " now" : ""}"></span>`,
  ).join("");
  return `
    <header class="topbar">
      <span class="wordmark">心路</span>
      <div class="dots" aria-label="人生进度">${dots}</div>
      ${statebar(resources, bump, band)}
      ${family ? '<button type="button" class="btn-ghost btn-family" data-family-open>我的家庭</button>' : ""}
      <button type="button" class="btn-ghost" data-restart>重开</button>
    </header>`;
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

/** 开局屏（v4 三页签：随机 / 手选 / 自定义六因素；plan/v4/02 §三 ▸ M1''' 增补）。 */
export function startScreen(vm: StartScreenVM): string {
  const manualGroups = ELEMENT_META.map(({ key, label }) => chipGroup(key, vm.env[key], label)).join("");
  const customGroups = PROFILE_META.map(({ key, label }) => chipGroup(key, vm.profile[key], label)).join("");
  const yearOptions = vm.years
    .map((y, i) => `<option value="${y}"${i === Math.floor(vm.years.length / 2) ? " selected" : ""}>${y} 年</option>`)
    .join("");
  return `
    <section class="screen screen-start">
      <h1>心路</h1>
      <p class="lede">从一段出生出发，做出一路选择，看着 E-I / S-N / T-F / J-P 四维倾向值慢慢长成人格。</p>
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
          <p class="muted">出生年、家境、家庭结构……全部交给种子：同一种子码，重走同一段人生。</p>
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
            <p class="fine-print">其余因素（出生年/南北/家庭结构/父母职业/家境）按年代概率自动派生。</p>
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
      ${vm.error ? `<p class="form-error">${esc(vm.error)}</p>` : ""}
      <p class="fine-print">单机运行，进度保存在本机浏览器，无需网络与账号。</p>
      <p class="fine-print about-links">
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
  /** v4 年份徽章「YYYY 年 · N 岁」（runYearOf 派生，02 §一 ▸ M1''' 增补）。 */
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
  bump: readonly ResKey[];
  floaters: readonly Floater[];
  /** AI 自定义第 4 槽（v3/02 §七）：仅旁路可用时渲染（离线隐藏口径）。 */
  custom: boolean;
  customError?: string;
  /** 积蓄换算档（v4/02 §四：按本卡运行年份归段）。 */
  band: MoneyBand;
}): string {
  const line = LINE_META[vm.line];
  const head = `
    <header class="card-head">
      ${vm.iconName ? `<span class="ev-icon ${line.cls}" data-icon="${esc(vm.iconName)}" style="${esc(iconStyle(vm.iconName))}" aria-hidden="true"></span>` : ""}
      <div class="card-meta">
        <span class="chip chip-line ${line.cls}">${line.label}</span>
        <span class="chip chip-age" data-year-badge>${esc(vm.yearBadge)}</span>
        ${vm.critical ? '<span class="critical-badge">重大抉择</span>' : ""}
      </div>
    </header>`;
  return `
    <section class="screen screen-card layout-timeline">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex, vm.resources, vm.bump, true, vm.band)}
      ${floatLayer(vm.floaters)}
      <div class="timeline-body">
        ${timelineRail(vm.timeline)}
        <div class="stage-main">
          <article class="card event-card${vm.critical ? " critical" : ""}" data-age-months="${vm.ageMonths}">
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

/** 时代卡屏（plan/v4/02 §二 ▸ M1''' 增补）：无选项、固定增量；「继续」回事件流。 */
export function eraCardScreen(vm: {
  stageIndex: number;
  stage: Stage;
  yearBadge: string;
  titleHint: string;
  text: string;
  backdrop: SceneBackdrop;
  timeline: readonly TimelineSegment[];
  resources: Resources;
  band: MoneyBand;
}): string {
  return `
    <section class="screen screen-card layout-timeline" data-era-card="1">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex, vm.resources, [], true, vm.band)}
      <div class="timeline-body">
        ${timelineRail(vm.timeline)}
        <div class="stage-main">
          <article class="card event-card era-card">
            <header class="card-head">
              <div class="card-meta">
                <span class="chip chip-line line-fate">时代</span>
                <span class="chip chip-age" data-year-badge>${esc(vm.yearBadge)}</span>
              </div>
            </header>
            <h3 class="era-title">${esc(vm.titleHint)}</h3>
            <p class="event-text">${esc(vm.text)}</p>
            <div class="options">
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
  bump: readonly ResKey[];
  floaters: readonly Floater[];
  band: MoneyBand;
}): string {
  return `
    <section class="screen screen-card layout-timeline">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex, vm.resources, vm.bump, true, vm.band)}
      ${floatLayer(vm.floaters)}
      <div class="timeline-body">
        ${timelineRail(vm.timeline)}
        <div class="stage-main">
          <article class="card event-card">
            <p class="stage-tag">${STAGE_LABEL[vm.stage]} · <span data-year-badge>${esc(vm.yearBadge)}</span></p>
            <div class="fish-slot" data-slot="fish"></div>
            <p class="aftermath">${esc(vm.aftermath)}</p>
            <div class="options">
              <button type="button" class="btn btn-primary" data-continue>继续</button>
            </div>
          </article>
        </div>
      </div>
    </section>`;
}

/** 阶段小结（v4/02 §七五段结构 + ▸ M2''' 增补）：主题头（年代区间+年龄段）/ 三观三轴说明（区间词+位移箭头+独白）/
 *  四维雷达淡影对比（沿 v3，四维增量并排小字）/ 资源五档状态 / 关键抉择回顾。配图位留 v4-M3''' 3.2。 */
export function summaryScreen(vm: {
  stageIndex: number;
  stage: Stage;
  count: number;
  deltas: Dims;
  resources: Resources;
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
      return `<div class="values-note" data-values-note data-axis="${n.axis}">
        <span class="vn-band">${esc(n.label)} · ${esc(n.bandWord)}</span>
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
      ${topbar(vm.stageIndex, vm.resources, [], false, vm.band)}
      <h2>${STAGE_LABEL[vm.stage]} · 小结<img class="stage-icon" src="${jellyfishSvg}" alt="" aria-hidden="true"></h2>
      <p class="sum-theme muted" data-stage-span>${vm.yearRange ? `${esc(vm.yearRange)} · ${esc(vm.ageRange)}` : STAGE_LABEL[vm.stage]}</p>
      <div class="fish-slot fish-slot-stage" data-slot="fish" style="border-radius:${vm.fishRadius.toFixed(1)}px"></div>
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
      <div class="options options-row">
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
  fishRadius: number;
  backdrop: SceneBackdrop;
  gallery: GalleryHint | null;
  relations: RunState["npcs"];
  /** v4 历法迁移局提示（plan/v4/02 §九 ▸ M1''' 增补）：一句，不抢戏。 */
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
  return `
    <section class="screen screen-ending">
      ${sceneLayer(vm.backdrop)}
      ${topbar(STAGES.length, vm.resources, [], false, vm.band)}
      <h2>${esc(vm.title)}</h2>
      <p class="ending-type">${esc(vm.letters)}</p>
      <div class="fish-slot fish-slot-ending" data-slot="fish" style="border-radius:${vm.fishRadius.toFixed(1)}px"></div>
      <p class="ending-text">${esc(vm.text)}</p>
      ${vm.migrated ? '<p class="fine-print migrated-note">这段人生由旧版存档迁移而来（历法迁移）：出生年与家庭按现行口径补派生。</p>' : ""}
      <div class="ending-commentary" data-llm-commentary aria-live="polite"></div>
      <div class="viz-row two">
        <div class="radar-slot" data-slot="radar"></div>
        <div class="curve-slot" data-slot="curve"></div>
      </div>
      <h3>复盘</h3>
      <ul class="retrospect">${vm.retrospect.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      <h3>关键抉择</h3>
      <div class="criticals">${criticals}</div>
      <h3>同行的人</h3>
      <div class="relations-snapshot" data-relations-snapshot>${renderRelations(vm.relations)}</div>
      <p class="fine-print">本局种子码 <span data-seed-code>${esc(vm.seedCode)}</span>——同码同人生；想重走或分享，开局屏输入这个码即可。</p>
      ${galleryHintLine(vm.gallery)}
      <p class="fine-print about-links"><a href="./credits.md" target="_blank" rel="noopener">素材与许可说明</a></p>
      <button type="button" class="btn btn-primary" data-share>保存分享卡</button>
      <button type="button" class="btn btn-ghost" data-restart>重开一局</button>
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
      ? `${hint.unlocked}/${hint.total} 型——图鉴集齐！`
      : `已解锁 ${hint.unlocked} / ${hint.total} 型，还有 ${hint.total - hint.unlocked} 型未解锁`;
  const newPart = hint.isNew ? `——本局新解锁「${hint.letters}」` : "";
  return `<p class="gallery-hint fine-print">人格图鉴：${unlockedPart}${newPart}；累计通关 ${hint.runs} 局。</p>`;
}

/** 图鉴屏（v2/03 §4）：16 型格（解锁印 avatar 缩略 / 未上锁印？？？）+ 结局记录（解锁印 ending 锁表帧）。 */
export function galleryScreen(gallery: GalleryData): string {
  const cells = GALLERY_TYPES.map((t) => {
    const entry = gallery.types[t];
    if (!entry) {
      return `<li class="gallery-cell locked"><span class="gallery-unknown">？？？</span><span class="gallery-letters">未解锁</span></li>`;
    }
    const day = new Date(entry.firstSeenAt).toISOString().slice(0, 10);
    return `<li class="gallery-cell unlocked" data-gallery-type="${t}">
      <div class="gallery-slot" data-slot="gallery-fish"></div>
      <span class="gallery-letters">${t}</span>
      <span class="gallery-meta">×${entry.count} · ${day} 首见</span>
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
    <section class="screen screen-gallery">
      <h2>人格图鉴</h2>
      <p class="muted gallery-progress">累计通关 ${gallery.runs} 局 · 已解锁 ${Object.keys(gallery.types).length} / ${GALLERY_TYPES.length} 型</p>
      <ul class="gallery-grid">${cells}</ul>
      <h3>结局记录</h3>
      <ul class="gallery-endings">${records}</ul>
      <button type="button" class="btn btn-primary" data-gallery-back>返回</button>
    </section>`;
}

export function corruptScreen(): string {
  return `
    <section class="screen screen-corrupt">
      <h2>存档无法读取</h2>
      <p class="muted">本机的存档似乎损坏了。我们不会动它的内容——你可以现在重新开始一段新的人生。</p>
      <button type="button" class="btn btn-primary" data-restart>重新开始</button>
    </section>`;
}

/** 关系图谱页（v3/03 §4）：环形图谱 + tag 图例；返回目标由 app 层决定（小结或终局）。 */
export function relationsScreen(): string {
  const legend = Object.entries(TAG_COLORS)
    .map(([tag, color]) => `<span class="rel-legend-item"><i style="background:${color}"></i>${tag}</span>`)
    .join("");
  const known = Object.values(NPC_PROFILES).filter((p) => p.line !== "fate").length;
  return `
    <section class="screen screen-relations">
      <h2>关系图谱</h2>
      <p class="muted">一圈同行的人。线越粗，羁绊越深；颜色是现在的关系。</p>
      <div class="relations-slot" data-relations-chart></div>
      <div class="rel-legend" aria-hidden="true">${legend}</div>
      <p class="fine-print">图谱会随你的人生长出新名字（本段人生可能遇见 ${known} 位路人与父母同行）。</p>
      <button type="button" class="btn btn-primary" data-relations-back>返回</button>
    </section>`;
}

/** 设置页（v3/02 §七 D2=a + v4/02 §五）：界面主题四款（即时切换，独立键 xinlu.theme.v1）；
 *  BYO Key 明文存本机；未启用时全部字段不生效（离线口径）。 */
export function settingsScreen(vm: { settings: LlmSettings; theme: ThemeId; error?: string }): string {
  const providerOptions = PROVIDERS.map(
    (p) => `<option value="${esc(p.id)}"${p.id === vm.settings.provider ? " selected" : ""}>${esc(p.label)}</option>`,
  ).join("");
  const themeChips = THEMES.map(
    (t) =>
      `<label class="chip"><input type="radio" name="theme" value="${t.id}" data-theme-choice${t.id === vm.theme ? " checked" : ""}><span>${esc(t.label)}<i class="theme-note">${esc(t.note)}</i></span></label>`,
  ).join("");
  return `
    <section class="screen screen-settings">
      <h2>设置</h2>
      <fieldset class="env-group theme-group">
        <legend>界面主题</legend>
        <div class="chips theme-chips">${themeChips}</div>
      </fieldset>
      <form class="settings-form" data-settings-form>
        <label class="settings-check">
          <input type="checkbox" name="enabled"${vm.settings.enabled ? " checked" : ""}>
          启用 AI 旁路（可选；不启用或离线时，游戏行为与 v2 完全一致）
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
        <p class="fine-print">Key 以明文保存在本机浏览器，仅在你启用旁路后，为自定义行动裁决、事件变体与终局点评向所配服务商发起请求。请勿在公共设备填写；判定核心（人生演化本身）永不过网。</p>
        ${vm.error ? `<p class="form-error">${esc(vm.error)}</p>` : ""}
        <div class="options-row">
          <button type="submit" class="btn btn-primary">保存</button>
          <button type="button" class="btn btn-ghost" data-settings-back>返回</button>
        </div>
      </form>
    </section>`;
}
