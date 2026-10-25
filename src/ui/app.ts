// 主控制器（vanilla TS，无 UI 框架）：路由 = start / card / aftermath / summary / ending / corrupt / gallery。
// v3-M2''：D4=B 时间轴画卷（卡屏 = 左八段轨道 + 右事件卡）；状态条常驻；后果微反馈为一次性非阻塞浮动层。
// 存档纪律（plan/02 §六）：createRun 与每次 applyChoice / advanceStage 后 save；
// 启动 load() 有档续局；load 为 null 但 key 在位 = 损坏 → 提示可重开，绝不静默清档。
import {
  advanceStage,
  applyChoice,
  applyCustomChoice,
  applyEraCard,
  birthEnvOptions,
  createRun,
  envFromBirth,
  eraEventFor,
  initialDimsOf,
  optionDimsDelta,
  optionLocks,
  pickEvent,
  profileOptions,
  randomBirth,
  resolveEnding,
} from "../engine/engine";
import { runYearOf } from "../engine/year";
import { SEED_MAX, seedCodeOf, seedFromCode } from "../engine/seedcode";
import {
  DEFAULT_LLM_SETTINGS,
  llmUsable,
  loadLlmSettings,
  providerById,
  saveLlmSettings,
} from "../llm/config";
import {
  PRESET_COMMENTARY,
  customOptionOf,
  endingCommentary,
  normalizeCustomOption,
  rewriteVariant,
} from "../llm/bypass";
import type { LlmSettings } from "../llm/config";
import { STAGES, type BirthEnv, type BirthProfile, type Dims, type Ending, type LineKey, type ResKey, type RunState, type Stage } from "../engine/model";
import { deriveEndingV3 } from "../engine/values";
import { clear, hasSaveKey, load, save } from "../storage/storage";
import { createFishParams, endingFrame, pickChoiceFrame, renderFish, stageFrame, type DeltaDir } from "../viz/fish";
import { sceneBackdrop } from "../viz/scene";
import { renderCurve } from "../viz/curve";
import { renderRadar } from "../viz/radar";
import {
  criticalChoices,
  dimsAtStageStart,
  endingLetters,
  stageDeltas,
  stageEntries,
} from "./logic";
import { timelineVM, choiceFloats, RES_KEYS, LINE_META } from "./timeline";
import { EVENT_ICONS } from "./icons";
import { renderRelations } from "./relations";
import { exportShareCard } from "./share-card";
import { GALLERY_TYPES, loadGallery, recordRun, representativeDims } from "./gallery";
import portraits from "../data/portraits.json" with { type: "json" };
import * as S from "./screens";

type View =
  | "start"
  | "card"
  | "aftermath"
  | "summary"
  | "ending"
  | "corrupt"
  | "gallery"
  | "relations"
  | "settings";

let root: HTMLElement;
let state: RunState | null = null;
let view: View = "start";
// 图谱页的返回目标（小结或终局进入时各记一笔）。
let relationsReturn: View = "summary";
// 自定义槽错误（渲染时消费一次即清）。
let customSlotError: string | null = null;
// context 变体改写缓存（eventId → 改写文本；表现态，重开即弃）。
const variantCache = new Map<string, string>();
let pendingAftermath: { stage: Stage; ageHint: string; ageMonths: number; text: string } | null = null;
// choice 类表情反馈帧(02 §二):表现态,不进存档(schema v1 冻结,刷新续局回待机态)。
let choiceFeedback: string | null = null;
// 后果微反馈(一次性):onChoose 时装配,下一次 card/aftermath 渲染消费并清空。
let pendingFeedback: { floaters: ReturnType<typeof choiceFloats>; bump: ResKey[] } | null = null;
// 本局刚解锁新型(图鉴提示用表现态;刷新续局到终局不重复喊「新解锁」)。
let galleryJustUnlocked = false;
// 图鉴格结局记录的 avatar 渲染参数(锁定帧已定,四维取中位代表值)。
const NEUTRAL_DIMS = { ei: 50, sn: 50, tf: 50, jp: 50 };

type Boot = { kind: "fresh" } | { kind: "resume"; state: RunState } | { kind: "corrupt" };

/** 新局种子 [0, 2^31)：crypto 源无偏右移取值；不可用环境回退 Math.random（游戏种子，非加密用途）。 */
function randomSeed(): number {
  const buf = new Uint32Array(1);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(buf);
    return buf[0]! >>> 1;
  }
  return Math.floor(Math.random() * SEED_MAX);
}

function boot(): Boot {
  try {
    const saved = load();
    if (saved) return { kind: "resume", state: saved };
    if (hasSaveKey()) return { kind: "corrupt" };
  } catch {
    // localStorage 不可用：降级为无存档可玩，不白屏
  }
  return { kind: "fresh" };
}

function persist(): void {
  if (!state) return;
  try {
    save(state);
  } catch {
    // 存储不可用：本局内存续玩
  }
}

export function mountApp(el: HTMLElement): void {
  root = el;
  const started = boot();
  if (started.kind === "resume") {
    state = started.state;
    view = state.stageIndex >= STAGES.length ? "ending" : "card";
  } else {
    view = started.kind === "corrupt" ? "corrupt" : "start";
  }
  render();
}

function render(): void {
  // 换屏一律回到页首：小结/终局是长页面，innerHTML 替换不会自动复位滚动
  window.scrollTo(0, 0);
  const feedback = pendingFeedback;
  pendingFeedback = null;
  switch (view) {
    case "start":
      renderStart();
      break;
    case "card":
      renderCard(feedback);
      break;
    case "aftermath":
      renderAftermath(feedback);
      break;
    case "summary":
      renderSummary();
      break;
    case "ending":
      renderEnding();
      break;
    case "gallery":
      renderGallery();
      break;
    case "relations":
      renderRelationsView();
      break;
    case "settings":
      renderSettings();
      break;
    case "corrupt":
      root.innerHTML = S.corruptScreen();
      bindRestart();
      break;
  }
}

function renderStart(error?: string): void {
  const years: number[] = [];
  for (let y = 1955; y <= 2015; y++) years.push(y);
  root.innerHTML = S.startScreen({ env: birthEnvOptions(), profile: profileOptions(), years, error });
  const begin = (env: BirthEnv, seed: number, birth?: { birthYear: number; profile: BirthProfile }): void => {
    state = createRun(env, seed, birth);
    persist();
    view = "card";
    render();
  };
  // 手选出生（v3/02 §六：手选路径不改；v4 其余因素按年代概率派生并随种子可复现）
  const form = root.querySelector<HTMLFormElement>("[data-env-form]");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const env: BirthEnv = {
      era: String(data.get("era") ?? ""),
      place: String(data.get("place") ?? ""),
      mood: String(data.get("mood") ?? ""),
      style: String(data.get("style") ?? ""),
    };
    try {
      begin(env, randomSeed());
    } catch {
      renderStart("出生环境无效，请重新选择后再开始。");
    }
  });
  // 自定义六因素（v4/02 §三 ▸ M1''' 增补）：六因素全选 → env 由派生表定（mood/style 不再直接选）
  const customForm = root.querySelector<HTMLFormElement>("[data-custom-form]");
  customForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(customForm);
    const birthYear = Number(data.get("birthYear"));
    // 枚举合法性由引擎兜底校验（birth-map 查表越界即抛错 → catch 走错误提示），此处只做类型归位。
    const profile = {
      region: String(data.get("region") ?? ""),
      structure: String(data.get("structure") ?? ""),
      parentsJob: String(data.get("parentsJob") ?? ""),
      wealth: String(data.get("wealth") ?? ""),
    } as BirthProfile;
    const place = String(data.get("place") ?? "");
    try {
      begin(envFromBirth(birthYear, profile, place), randomSeed(), { birthYear, profile });
    } catch {
      renderStart("出生六因素无效，请重新选择后再开始。");
    }
  });
  // 随机出生（v4/02 §一 ▸ M1''' 增补）：seed 派生全部六因素 + 四要素，同码必同人生
  root.querySelector<HTMLButtonElement>("[data-random-birth]")?.addEventListener("click", () => {
    const seed = randomSeed();
    const born = randomBirth(seed);
    begin(born.env, seed, { birthYear: born.birthYear, profile: born.profile });
  });
  // 种子码开局：输入码 → 还原 seed → 派生同一出生（v4 起含出生年/画像/家庭）
  const seedForm = root.querySelector<HTMLFormElement>("[data-seed-form]");
  seedForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = String(new FormData(seedForm).get("seedCode") ?? "");
    const seed = seedFromCode(code);
    if (seed === null) {
      renderStart("种子码没认出来——格式应为 XL-XXXX-XXXX（不含 0、1、O、I）。");
      return;
    }
    const born = randomBirth(seed);
    begin(born.env, seed, { birthYear: born.birthYear, profile: born.profile });
  });
  root.querySelector<HTMLButtonElement>("[data-gallery-open]")?.addEventListener("click", () => {
    view = "gallery";
    render();
  });
  root.querySelector<HTMLButtonElement>("[data-settings-open]")?.addEventListener("click", () => {
    view = "settings";
    render();
  });
}

/** 时代卡渲染与「我的家庭」入口绑定（card/era/aftermath 三屏共用）。 */
function bindFamilyOpen(): void {
  root.querySelector<HTMLButtonElement>("[data-family-open]")?.addEventListener("click", () => {
    relationsReturn = "card";
    view = "relations";
    render();
  });
}

function renderEraCard(): void {
  if (!state) return;
  const event = eraEventFor(state);
  if (!event) {
    renderCard(null);
    return;
  }
  root.innerHTML = S.eraCardScreen({
    stageIndex: state.stageIndex,
    stage: STAGES[state.stageIndex]!,
    yearBadge: `${event.year} 年 · ${event.year - state.birthYear} 岁`,
    titleHint: event.titleHint,
    text: event.text,
    backdrop: sceneBackdrop(state.env),
    timeline: timelineVM(state),
    resources: state.resources,
  });
  bindFamilyOpen();
  root.querySelector<HTMLButtonElement>("[data-continue]")?.addEventListener("click", () => {
    if (!state) return;
    state = applyEraCard(state);
    persist();
    view = "card";
    render();
  });
  bindRestart();
}

function renderCard(feedback: typeof pendingFeedback): void {
  if (!state) return;
  // 时代卡优先于事件卡（plan/v4/02 §二 ▸ M1''' 增补：注入在 pickEvent 之外，判定核零改动）
  if (eraEventFor(state)) {
    renderEraCard();
    return;
  }
  const event = pickEvent(state);
  if (!event) {
    toNext();
    return;
  }
  const stage = STAGES[state.stageIndex]!;
  const customError = customSlotError;
  customSlotError = null;
  const llm = loadLlmSettings();
  root.innerHTML = S.cardAskScreen({
    stageIndex: state.stageIndex,
    stage,
    ageHint: event.ageHint,
    ageMonths: event.ageMonths,
    yearBadge: `${runYearOf(state.birthYear, event.ageMonths)} 年 · ${event.ageHint}`,
    text: event.text,
    options: event.options.map((o) => o.text),
    locks: optionLocks(state, event),
    line: event.line,
    critical: event.type === "critical",
    iconName: EVENT_ICONS[event.id] ?? "",
    backdrop: sceneBackdrop(state.env),
    timeline: timelineVM(state),
    resources: state.resources,
    bump: feedback?.bump ?? [],
    floaters: feedback?.floaters ?? [],
    custom: llmUsable(llm),
    customError: customError ?? undefined,
  });
  for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-option]")) {
    btn.addEventListener("click", () => onChoose(Number(btn.dataset.option)));
  }
  bindFamilyOpen();
  root.querySelector<HTMLButtonElement>("[data-custom-submit]")?.addEventListener("click", () => {
    const input = root.querySelector<HTMLInputElement>("[data-custom-slot] .custom-input");
    void onCustom(input?.value ?? "");
  });
  // 用途②变体改写（v3/02 §七）：仅 context 事件、旁路可用；非阻塞——原文先渲染，改写到达后原位替换
  if (llmUsable(llm) && event.type === "context") {
    void maybeSwapVariant(event.id);
  }
  bindRestart();
}

/** 变体改写异步落位：缓存命中直接换，否则请求；事件已翻页则丢弃。 */
async function maybeSwapVariant(eventId: string): Promise<void> {
  if (!state) return;
  const cached = variantCache.get(eventId);
  if (cached) {
    swapEventText(eventId, cached);
    return;
  }
  const settings = loadLlmSettings();
  const event = pickEvent(state);
  if (!event || event.id !== eventId) return;
  const text = await rewriteVariant(event, settings);
  if (!text) return; // 降级：保持原文（静默）
  variantCache.set(eventId, text);
  swapEventText(eventId, text);
}

function swapEventText(eventId: string, text: string): void {
  if (!state || view !== "card") return;
  if (pickEvent(state)?.id !== eventId) return;
  const el = root.querySelector(".event-text");
  if (el) el.textContent = text;
}

/** 用途①自定义槽：LLM 归一 → applyCustomChoice；失败置错误提示重渲染（原文卡仍在）。 */
async function onCustom(userText: string): Promise<void> {
  if (!state || !userText.trim()) return;
  const event = pickEvent(state);
  if (!event) return;
  const capturedState = state;
  const btn = root.querySelector<HTMLButtonElement>("[data-custom-submit]");
  const input = root.querySelector<HTMLInputElement>("[data-custom-slot] .custom-input");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "AI 裁决中…";
  }
  if (input) input.readOnly = true;
  const settings = loadLlmSettings();
  const optionView = await normalizeCustomOption(userText, event, settings);
  // 等待期间玩家可能点了常规选项/重开：状态已推进则丢弃本次裁决
  if (!optionView || state !== capturedState || view !== "card") {
    if (state === capturedState && view === "card") {
      customSlotError = "AI 暂时没答上来——请重试，或先选一个现有选项。";
      render();
    }
    return;
  }
  const option = customOptionOf(optionView);
  // 自定义行动的反馈浮动与常规选项同链路
  pendingFeedback = {
    floaters: choiceFloats(option.deltas3 ?? {}, option.resourceDeltas ?? {}),
    bump: RES_KEYS.filter((k) => (option.resourceDeltas[k] ?? 0) !== 0),
  };
  choiceFeedback = pickChoiceFrame("neutral", createFishParams(capturedState.dims).mood, capturedState.seed + capturedState.history.length);
  state = applyCustomChoice(capturedState, option);
  persist();
  view = "card";
  render();
}

function onChoose(index: number): void {
  if (!state) return;
  const event = pickEvent(state);
  if (!event) {
    toNext();
    return;
  }
  // 后果微反馈(v3/02 §三 浮动 + dogfooding 结论 1):按所选选项的三观/资源增量装配,下一屏消费
  const option = event.options[index];
  pendingFeedback = {
    floaters: choiceFloats(option?.deltas3 ?? {}, option?.resourceDeltas ?? {}),
    bump: RES_KEYS.filter((k) => (option?.resourceDeltas[k] ?? 0) !== 0),
  };
  // choice 表情反馈(02 §二):按本次派生 tf 偏移方向 + 选择前 mood 抽帧,同种子可复现
  const tfDelta = optionDimsDelta(event, index).tf ?? 0;
  const dir: DeltaDir = tfDelta > 0 ? "pos" : tfDelta < 0 ? "neg" : "neutral";
  choiceFeedback = pickChoiceFrame(dir, createFishParams(state.dims).mood, state.seed + state.history.length);
  const aftermath = option?.aftermath;
  state = applyChoice(state, index);
  persist();
  if (aftermath) {
    pendingAftermath = { stage: STAGES[state.stageIndex]!, ageHint: event.ageHint, ageMonths: event.ageMonths, text: aftermath };
    view = "aftermath";
    render();
  } else {
    toNext();
  }
}

function renderAftermath(feedback: typeof pendingFeedback): void {
  if (!state || !pendingAftermath) {
    toNext();
    return;
  }
  root.innerHTML = S.cardAftermathScreen({
    stageIndex: state.stageIndex,
    stage: pendingAftermath.stage,
    ageHint: pendingAftermath.ageHint,
    yearBadge: `${runYearOf(state.birthYear, pendingAftermath.ageMonths)} 年 · ${pendingAftermath.ageHint}`,
    aftermath: pendingAftermath.text,
    backdrop: sceneBackdrop(state.env),
    timeline: timelineVM(state),
    resources: state.resources,
    bump: feedback?.bump ?? [],
    floaters: feedback?.floaters ?? [],
  });
  hydrateFish(choiceFeedback ?? undefined);
  bindFamilyOpen();
  bindContinue();
  bindRestart();
}

/** 应答后的推进：还有事件 → 下一张卡；取尽 → advanceStage（终局或阶段小结）。 */
function toNext(): void {
  if (!state) return;
  pendingAftermath = null;
  if (pickEvent(state)) {
    view = "card";
    render();
    return;
  }
  state = advanceStage(state);
  persist();
  if (state.stageIndex >= STAGES.length) recordGallery();
  view = state.stageIndex >= STAGES.length ? "ending" : "summary";
  render();
}

/** 通关记一笔图鉴（02 §三独立 key）：恰在推进至终局的一次性迁移点调用；续局到终局不重记。
 *  存储不可用降级为「本局不入册」，不影响复盘。 */
function recordGallery(): void {
  if (!state) return;
  const ending = resolveEnding(state);
  const letters = endingLetters(ending, state);
  try {
    const before = loadGallery();
    recordRun({ letters, endingId: ending.id, now: Date.now() });
    galleryJustUnlocked = !before.types[letters];
  } catch {
    galleryJustUnlocked = false;
  }
}

function renderSummary(): void {
  if (!state) return;
  if (state.stageIndex >= STAGES.length) {
    view = "ending";
    render();
    return;
  }
  const stage = STAGES[state.stageIndex - 1]!;
  root.innerHTML = S.summaryScreen({
    stageIndex: state.stageIndex,
    stage,
    count: stageEntries(state.history, stage).length,
    deltas: stageDeltas(state, stage),
    resources: state.resources,
    fishRadius: createFishParams(state.dims).orderliness.radius,
    backdrop: sceneBackdrop(state.env),
  });
  hydrateFish(stageFrame(stage));
  hydrateRadar([dimsAtStageStart(state, stage)]);
  root.querySelector<HTMLButtonElement>("[data-relations-open]")?.addEventListener("click", () => {
    relationsReturn = "summary";
    view = "relations";
    render();
  });
  bindContinue();
  bindRestart();
}

/** 图谱页：SVG 水合进图表槽（与鱼像/雷达同一水合纪律）；返回到进入时的屏幕。 */
function renderRelationsView(): void {
  if (!state) return;
  root.innerHTML = S.relationsScreen();
  const slot = root.querySelector("[data-relations-chart]");
  if (slot) slot.innerHTML = renderRelations(state.npcs);
  root.querySelector<HTMLButtonElement>("[data-relations-back]")?.addEventListener("click", () => {
    view = relationsReturn;
    render();
  });
}

function renderEnding(): void {
  if (!state) return;
  const ending = resolveEnding(state);
  const letters = endingLetters(ending, state);
  const gallery = loadGallery();
  root.innerHTML = S.endingScreen({
    title: ending.title,
    letters,
    text: ending.text,
    retrospect: ending.retrospect,
    criticals: criticalChoices(state.history),
    seedCode: seedCodeOf(state.seed),
    resources: state.resources,
    fishRadius: createFishParams(state.dims).orderliness.radius,
    backdrop: sceneBackdrop(state.env),
    migrated: state.migrated === true,
    gallery: {
      unlocked: Object.keys(gallery.types).length,
      total: GALLERY_TYPES.length,
      letters,
      isNew: galleryJustUnlocked,
      runs: gallery.runs,
    },
    relations: state.npcs,
  });
  hydrateFish(endingFrame(ending.id));
  hydrateRadar(STAGES.map((s) => dimsAtStageStart(state!, s)));
  const curveSlot = root.querySelector("[data-slot='curve']");
  if (curveSlot) renderCurve(state.history, curveSlot, initialDimsOf(state));
  hydrateCommentary(ending);
  bindShare(ending);
  bindRestart();
}

/** 用途③终局点评（v3/02 §七）：可用 → 异步请求（先占位）；不可用/失败 → 预设文案。 */
function hydrateCommentary(ending: Ending): void {
  const slot = root.querySelector("[data-llm-commentary]");
  if (!slot || !state) return;
  const settings = loadLlmSettings();
  if (!llmUsable(settings)) {
    slot.textContent = PRESET_COMMENTARY;
    return;
  }
  slot.textContent = "点评生成中…";
  const lineSummary = (Object.entries(deriveEndingV3(state, resolveEnding).lineStates) as Array<[string, string]>)
    .map(([line, st]) => `${LINE_META[line as LineKey].label}${st}`)
    .join("，");
  const captured = state;
  void endingCommentary(
    { title: ending.title, letters: endingLetters(ending, captured), lineSummary },
    settings,
  ).then((text) => {
    if (!slot.isConnected) return;
    slot.textContent = text ?? PRESET_COMMENTARY;
  });
}

/** 设置页（v3/02 §七）：服务商预选自动填 Base URL；保存回开局屏。 */
function renderSettings(error?: string): void {
  const settings = loadLlmSettings();
  root.innerHTML = S.settingsScreen({ settings, error });
  const form = root.querySelector<HTMLFormElement>("[data-settings-form]");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const next: LlmSettings = {
      enabled: data.get("enabled") === "on",
      provider: String(data.get("provider") ?? "openai"),
      baseUrl: String(data.get("baseUrl") ?? "").trim(),
      apiKey: String(data.get("apiKey") ?? "").trim(),
      model: String(data.get("model") ?? "").trim(),
    };
    if (!providerById(next.provider)) {
      renderSettings("服务商预设不认识，请重新选择。");
      return;
    }
    try {
      saveLlmSettings(next);
    } catch {
      renderSettings("本机存储不可用，设置没有保存。");
      return;
    }
    view = "start";
    render();
  });
  form?.querySelector<HTMLSelectElement>('select[name="provider"]')?.addEventListener("change", (e) => {
    const preset = providerById((e.target as HTMLSelectElement).value);
    const baseInput = form.querySelector<HTMLInputElement>('input[name="baseUrl"]');
    if (preset && baseInput && preset.baseUrl) baseInput.value = preset.baseUrl;
  });
  root.querySelector<HTMLButtonElement>("[data-settings-back]")?.addEventListener("click", () => {
    view = "start";
    render();
  });
}

/** 「保存分享卡」(v2/03 §3):终局屏导出 1080×1440 PNG,纯客户端零上传;失败原地提示,不打断复盘。 */
function bindShare(ending: Ending): void {
  const btn = root.querySelector<HTMLButtonElement>("[data-share]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!state) return;
    const letters = endingLetters(ending, state);
    const input = {
      title: ending.title,
      letters,
      dims: state.dims,
      portrait: (portraits as Record<string, string>)[letters] ?? "",
      criticals: criticalChoices(state.history)
        .slice(0, 3)
        .map((c) => ({ q: c.event.text, a: c.optionText })),
      frame: endingFrame(ending.id),
      date: new Date(),
    };
    btn.disabled = true;
    btn.textContent = "正在生成…";
    exportShareCard(input)
      .then(() => {
        btn.textContent = "已保存 ✓";
        btn.disabled = false;
      })
      .catch(() => {
        btn.textContent = "生成失败，请重试";
        btn.disabled = false;
      });
  });
}

/** 图鉴屏（v2/03 §4）：16 型格与结局记录的 avatar 缩略在此水合——型格按代表四维待机像，
 *  结局记录印 ending 锁表帧（取图走 endingFrame，零新映射）。 */
function renderGallery(): void {
  root.innerHTML = S.galleryScreen(loadGallery());
  for (const cell of root.querySelectorAll<HTMLElement>("[data-gallery-type]")) {
    const slot = cell.querySelector("[data-slot='gallery-fish']");
    if (slot) renderFish(createFishParams(representativeDims(cell.dataset.galleryType!)), slot);
  }
  for (const record of root.querySelectorAll<HTMLElement>("[data-gallery-ending]")) {
    const slot = record.querySelector("[data-slot='gallery-fish']");
    if (slot) renderFish(createFishParams(NEUTRAL_DIMS), slot, endingFrame(record.dataset.galleryEnding!));
  }
  root.querySelector<HTMLButtonElement>("[data-gallery-back]")?.addEventListener("click", () => {
    view = "start";
    render();
  });
}

function hydrateRadar(past: readonly Dims[]): void {
  if (!state) return;
  const slot = root.querySelector("[data-slot='radar']");
  if (slot) renderRadar(state.dims, slot, past);
}

function hydrateFish(frame?: string): void {
  if (!state) return;
  const slot = root.querySelector("[data-slot='fish']");
  if (slot) renderFish(createFishParams(state.dims), slot, frame);
}

function bindContinue(): void {
  const btn = root.querySelector<HTMLButtonElement>("[data-continue]");
  btn?.addEventListener("click", () => {
    pendingAftermath = null;
    view = "card";
    render();
  });
}

/** 重开 = 显式 clear() 回开局屏。卡流中的重开做两步确认，防误触；确认态不驻留——
 *  移开指针/焦点即复位，否则首次误触过后，之后的任何一次单击都会不经确认直接清档。 */
function bindRestart(): void {
  for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-restart]")) {
    btn.addEventListener("click", () => {
      if (view === "card" || view === "aftermath" || view === "summary") {
        if (btn.dataset.armed !== "1") {
          btn.dataset.armed = "1";
          btn.textContent = "确认重开？";
          return;
        }
      }
      restart();
    });
    const disarm = () => {
      if (btn.dataset.armed !== "1") return;
      delete btn.dataset.armed;
      btn.textContent = "重开";
    };
    btn.addEventListener("pointerleave", disarm);
    btn.addEventListener("blur", disarm);
  }
}

function restart(): void {
  try {
    clear();
  } catch {
    // 存储不可用也照样回开局屏
  }
  state = null;
  pendingAftermath = null;
  pendingFeedback = null;
  choiceFeedback = null;
  galleryJustUnlocked = false;
  customSlotError = null;
  variantCache.clear();
  view = "start";
  render();
}
