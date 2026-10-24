// 四屏 HTML 装配（字符串模板）。动态文本一律经 esc() 转义；
// 出生四要素枚举由 engine.birthEnvOptions() 传入渲染，UI 不内联枚举清单（plan/03 §4）。
import {
  DIM_KEYS,
  STAGES,
  type BirthEnv,
  type DimKey,
  type Dims,
  type Stage,
} from "../engine/model";
import type { SceneBackdrop } from "../viz/scene";
import { DIM_SHORT, STAGE_LABEL, type ChoiceReview } from "./logic";
import { ENDING_META, GALLERY_TYPES, type GalleryData } from "./gallery";
// 场景氛围素材 URL(vite 静态 import → dist hash 文件名;水面/云层 = CC-BY Open Ocean 组,图标 = Simple Worlds 提取件)
import waterUrl from "../../assets/web-ready/open-ocean/Other/WikndWakerWater_Background.webp";
import cloudsUrl from "../../assets/web-ready/open-ocean/Other/Clouds_Background.webp";
import jellyfishSvg from "../../assets/cc-by/simple-worlds-ocean-animals/jellyfish.svg";

/** 场景氛围层(3.3):水面纹理 + 云层,出生环境经 sceneBackdrop 驱动;装饰性,aria-hidden。 */
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

function topbar(stageIndex: number): string {
  const dots = STAGES.map((_, i) =>
    `<span class="dot${i < stageIndex ? " done" : i === stageIndex ? " now" : ""}"></span>`,
  ).join("");
  return `
    <header class="topbar">
      <span class="wordmark">心路</span>
      <div class="dots" aria-label="人生进度">${dots}</div>
      <button type="button" class="btn-ghost" data-restart>重开</button>
    </header>`;
}

export function startScreen(options: Record<keyof BirthEnv, string[]>, error?: string): string {
  const groups = ELEMENT_META.map(({ key, label }) => {
    const chips = options[key]
      .map(
        (value, i) =>
          `<label class="chip"><input type="radio" name="${key}" value="${esc(value)}"${i === 0 ? " checked" : ""}><span>${esc(value)}</span></label>`,
      )
      .join("");
    return `<fieldset class="env-group"><legend>${label}</legend><div class="chips">${chips}</div></fieldset>`;
  }).join("");
  return `
    <section class="screen screen-start">
      <h1>心路</h1>
      <p class="lede">从一段出生环境出发，做出一路选择，看着 E-I / S-N / T-F / J-P 四维倾向值慢慢长成人格。</p>
      <form class="env-form" data-env-form>
        ${groups}
        ${error ? `<p class="form-error">${esc(error)}</p>` : ""}
        <button type="submit" class="btn btn-primary btn-start">开始这一生</button>
      </form>
      <p class="fine-print">单机运行，进度保存在本机浏览器，无需网络与账号。</p>
      <p class="fine-print about-links">
        <button type="button" class="btn-ghost" data-gallery-open>人格图鉴</button>
        <a href="./credits.md" target="_blank" rel="noopener">素材与许可说明</a>
      </p>
    </section>`;
}

export function cardAskScreen(vm: {
  stageIndex: number;
  stage: Stage;
  ageHint: string;
  ageMonths: number;
  text: string;
  options: string[];
  locks: boolean[];
  fishRadius: number;
  backdrop: SceneBackdrop;
}): string {
  return `
    <section class="screen screen-card">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex)}
      <article class="card event-card" data-age-months="${vm.ageMonths}">
        <p class="stage-tag">${STAGE_LABEL[vm.stage]} · ${esc(vm.ageHint)}</p>
        <div class="fish-slot" data-slot="fish" style="border-radius:${vm.fishRadius.toFixed(1)}px"></div>
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
      </article>
    </section>`;
}

export function cardAftermathScreen(vm: {
  stageIndex: number;
  stage: Stage;
  ageHint: string;
  aftermath: string;
  backdrop: SceneBackdrop;
}): string {
  return `
    <section class="screen screen-card">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex)}
      <article class="card event-card">
        <p class="stage-tag">${STAGE_LABEL[vm.stage]} · ${esc(vm.ageHint)}</p>
        <p class="aftermath">${esc(vm.aftermath)}</p>
        <div class="options">
          <button type="button" class="btn btn-primary" data-continue>继续</button>
        </div>
      </article>
    </section>`;
}

export function summaryScreen(vm: {
  stageIndex: number;
  stage: Stage;
  count: number;
  deltas: Dims;
  fishRadius: number;
  backdrop: SceneBackdrop;
}): string {
  const items = DIM_KEYS.map((d: DimKey) => {
    const v = vm.deltas[d];
    const cls = v > 0 ? "up" : v < 0 ? "down" : "flat";
    const sign = v > 0 ? "+" : "";
    return `<div class="delta"><span>${DIM_SHORT[d]}</span><b class="${cls}">${sign}${v}</b></div>`;
  }).join("");
  return `
    <section class="screen screen-summary">
      ${sceneLayer(vm.backdrop)}
      ${topbar(vm.stageIndex)}
      <h2>${STAGE_LABEL[vm.stage]} · 小结<img class="stage-icon" src="${jellyfishSvg}" alt="" aria-hidden="true"></h2>
      <p class="muted">本阶段经历了 ${vm.count} 次抉择，四维悄然挪动：</p>
      <div class="fish-slot fish-slot-stage" data-slot="fish" style="border-radius:${vm.fishRadius.toFixed(1)}px"></div>
      <div class="viz-row two">
        <div class="radar-slot" data-slot="radar"></div>
        <div class="deltas">${items}</div>
      </div>
      <button type="button" class="btn btn-primary" data-continue>继续人生</button>
    </section>`;
}

export function endingScreen(vm: {
  title: string;
  letters: string;
  text: string;
  retrospect: string[];
  criticals: ChoiceReview[];
  seed: number;
  fishRadius: number;
  backdrop: SceneBackdrop;
  gallery: GalleryHint | null;
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
      ${topbar(STAGES.length)}
      <h2>${esc(vm.title)}</h2>
      <p class="ending-type">${esc(vm.letters)}</p>
      <div class="fish-slot fish-slot-ending" data-slot="fish" style="border-radius:${vm.fishRadius.toFixed(1)}px"></div>
      <p class="ending-text">${esc(vm.text)}</p>
      <div class="viz-row two">
        <div class="radar-slot" data-slot="radar"></div>
        <div class="curve-slot" data-slot="curve"></div>
      </div>
      <h3>复盘</h3>
      <ul class="retrospect">${vm.retrospect.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
      <h3>关键抉择</h3>
      <div class="criticals">${criticals}</div>
      <p class="fine-print">本局种子 ${vm.seed}——同种子同选择，结果可复现。</p>
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
