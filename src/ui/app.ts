// 主控制器（vanilla TS，无 UI 框架）：路由 = start / card / aftermath / summary / ending / corrupt / gallery。
// v3-M2''：D4=B 时间轴画卷（卡屏 = 左八段轨道 + 右事件卡）；状态条常驻；后果微反馈为一次性非阻塞浮动层。
// 存档纪律（plan/02 §六）：createRun 与每次 applyChoice / advanceStage 后 save；
// 启动 load() 有档续局；load 为 null 但 key 在位 = 损坏 → 提示可重开，绝不静默清档。
import {
  advanceStage,
  applyChoice,
  applyCustomChoice,
  applyEncounterChoice,
  applyEraCard,
  birthEnvOptions,
  createRun,
  encounterFor,
  eraEventById,
  eraEventFor,
  eventById,
  initialDimsOf,
  optionDimsDelta,
  optionLocks,
  pickEvent,
  profileOptions,
  resolveEnding,
} from "../engine/engine";
import { runYearOf } from "../engine/year";
import { stageVariantSequence, variantOf } from "../engine/rhythm";
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
import { STAGES, type BirthEnv, type BirthProfile, type Dims, type Ending, type GameEvent, type LineKey, type ResKey, type RhythmVariant, type RunState, type Stage } from "../engine/model";
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
  stageCriticals,
  stageDeltas,
  stageEntries,
  stageSpan,
  valuesNotes,
} from "./logic";
import { timelineVM, choiceFloats, RES_KEYS, LINE_META } from "./timeline";
import { moneyBandOf, type MoneyBand } from "./resources";
import { applyTheme, loadTheme, saveTheme, type ThemeId } from "./theme";
import { applyPrefs, loadPrefs, savePrefs, type FontScale, type MotionPref } from "./prefs";
import {
  back,
  chooseMode,
  initialDraft,
  preview,
  previewYear,
  reroll,
  startInput,
  useCert,
  withCustomBirth,
  withManualEnv,
  type StartDraft,
  type StartMode,
} from "./start-flow";
import { objectKeyOf } from "./icons";
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
// 开局四步草稿（plan/v5/02 §五）：一步一屏；回退保值靠它，不靠 DOM 残留。
let startDraft: StartDraft = initialDraft();
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
  // 主题与阅读偏好先于首屏（v4/02 §五：默认米纸；v5/02 §七 素纸；键独立于存档）
  applyTheme(loadTheme());
  applyPrefs(loadPrefs());
  const started = boot();
  if (started.kind === "resume") {
    state = started.state;
    view = state.stageIndex >= STAGES.length ? "ending" : "card";
  } else {
    view = started.kind === "corrupt" ? "corrupt" : "start";
  }
  render();
}

/** 换算档（v4/02 §四 ▸ M2''' 增补）：按运行年份归段——卡片流取本卡年份，小结/终局取最近一张卡的年份。 */
function bandForYear(year: number): MoneyBand {
  return moneyBandOf(year);
}

function bandOfState(s: RunState): MoneyBand {
  const last = s.history[s.history.length - 1];
  if (!last) return moneyBandOf(s.birthYear);
  if (last.kind === "era") {
    const year = eraEventById(last.eventId)?.year ?? s.birthYear;
    return moneyBandOf(year);
  }
  const months = eventById(last.eventId)?.ageMonths ?? 0;
  return moneyBandOf(runYearOf(s.birthYear, months));
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

/** 开局四步渲染（plan/v5/02 §五）：一屏一个问题；draft 是唯一状态，回退不丢值靠它。 */
function renderStart(error?: string): void {
  const years: number[] = [];
  for (let y = 1955; y <= 2015; y++) years.push(y);
  root.innerHTML = S.startScreen({ draft: startDraft, env: birthEnvOptions(), profile: profileOptions(), years, error });
  // 入场：用出生证明里的 seed/env/年/画像建局（createRun 入参同构，判定核零改动）
  const begin = (): void => {
    const input = startInput(startDraft);
    state = createRun(input.env, input.seed, { birthYear: input.birthYear, profile: input.profile });
    startDraft = initialDraft();
    persist();
    view = "card";
    render();
  };
  const fail = (message: string): void => {
    renderStart(message);
  };
  // step 1 → 2：选玩法（已填值保留，来回切换不丢）
  for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode as StartMode | undefined;
      if (!mode) return;
      startDraft = chooseMode(startDraft, mode);
      render();
    });
  }
  // 回退一步（step 1 原地不动）：先把当前表单的已填值抄进 draft，再回退——
  // 「回退不丢值」的真实语义是「离开这一步时已经填的都算数」，不是「提交过的才算数」。
  for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-start-back]")) {
    btn.addEventListener("click", () => {
      startDraft = syncStartForm(startDraft);
      startDraft = back(startDraft);
      render();
    });
  }
  // step 2 手选：记下四要素 → 派生出生证明（回退重进按 manualEnv 回填选中态）
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
      startDraft = preview(withManualEnv(startDraft, env), randomSeed());
      render();
    } catch {
      fail("出生环境无效，请重新选择后再试试。");
    }
  });
  // step 2 自定义八因素（v4/02 §三 ▸ M1''' 增补）：玩家填的因素直接成证（mood/style 由派生表定）
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
      startDraft = preview(withCustomBirth(startDraft, { birthYear, place, profile }), randomSeed());
      render();
    } catch {
      fail("出生八因素无效，请重新选择后再试试。");
    }
  });
  // step 2 随机：掷一次 → 出生证明（seed 派生全部八因素，同码必同人生）
  root.querySelector<HTMLButtonElement>("[data-random-birth]")?.addEventListener("click", () => {
    try {
      startDraft = preview(startDraft, randomSeed());
      render();
    } catch {
      fail("这一把没掷出来，请再点一次。");
    }
  });
  // step 2 种子码：输入码 → 还原 seed → 同一出生（八因素与家庭全部可复现）
  const seedForm = root.querySelector<HTMLFormElement>("[data-seed-form]");
  seedForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = String(new FormData(seedForm).get("seedCode") ?? "");
    const seed = seedFromCode(code);
    if (seed === null) {
      fail("种子码没认出来——格式应为 XL-XXXX-XXXX（不含 0、1、O、I）。");
      return;
    }
    try {
      startDraft = preview(startDraft, seed);
      render();
    } catch {
      fail("这个码派不出人生，请换一个再试。");
    }
  });
  // step 2 年份尺点选：锁定该年 + 随机派生 → 直接出出生证明（同一年 + 同一种子 = 同一副牌）
  for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-birth-year]")) {
    btn.addEventListener("click", () => {
      const birthYear = Number(btn.dataset.birthYear);
      if (!Number.isInteger(birthYear)) return;
      try {
        startDraft = previewYear(startDraft, randomSeed(), birthYear);
        render();
      } catch {
        fail("这一年的牌没有派出来，请再点一次。");
      }
    });
  }
  // step 3 再来一次（随机态可用）：换种子重派，年份尺锁定的年份不变
  root.querySelector<HTMLButtonElement>("[data-cert-reroll]")?.addEventListener("click", () => {
    try {
      startDraft = reroll(startDraft, randomSeed());
      render();
    } catch {
      fail("这一把没掷出来，请再点一次。");
    }
  });
  // step 3 → 4：用这份出生证明
  root.querySelector<HTMLButtonElement>("[data-cert-use]")?.addEventListener("click", () => {
    startDraft = useCert(startDraft);
    render();
  });
  // step 4：开始这一生
  root.querySelector<HTMLButtonElement>("[data-start-enter]")?.addEventListener("click", () => {
    try {
      begin();
    } catch {
      fail("这局人生没能开局，请回出生证明再试。");
    }
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

/** 把当前 step 2 表单的已选值抄进 draft（回退/离开这一步前调用）。
 *  这是「回退不丢值」的落地点：玩家改过但没提交的选择，回退再进来必须还在。
 *  表单不在位（step 1/3/4 或玩法不匹配）时原样返回。 */
function syncStartForm(draft: StartDraft): StartDraft {
  const envForm = root.querySelector<HTMLFormElement>("[data-env-form]");
  if (envForm) {
    const data = new FormData(envForm);
    return withManualEnv(draft, {
      era: String(data.get("era") ?? ""),
      place: String(data.get("place") ?? ""),
      mood: String(data.get("mood") ?? ""),
      style: String(data.get("style") ?? ""),
    });
  }
  const customForm = root.querySelector<HTMLFormElement>("[data-custom-form]");
  if (customForm) {
    const data = new FormData(customForm);
    const birthYear = Number(data.get("birthYear"));
    if (!Number.isInteger(birthYear)) return draft;
    const profile = {
      region: String(data.get("region") ?? ""),
      structure: String(data.get("structure") ?? ""),
      parentsJob: String(data.get("parentsJob") ?? ""),
      wealth: String(data.get("wealth") ?? ""),
    } as BirthProfile;
    return withCustomBirth(draft, { birthYear, place: String(data.get("place") ?? ""), profile });
  }
  return draft;
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
    lines: state.lines,
    band: bandForYear(event.year),
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
  // v5 偶遇层：优先级次于时代卡、先于主线（plan/v5/02 §二；注入在 pickEvent 之外）
  const encounter = encounterFor(state);
  if (encounter) {
    renderEventCard(encounter, feedback);
    return;
  }
  const event = pickEvent(state);
  if (!event) {
    toNext();
    return;
  }
  renderEventCard(event, feedback);
}

/** 事件卡渲染（主线/支线/偶遇共用；变体只改呈现密度，选项与判定同一条通道）。 */
function renderEventCard(event: GameEvent, feedback: typeof pendingFeedback): void {
  if (!state) return;
  const stage = STAGES[state.stageIndex]!;
  const customError = customSlotError;
  customSlotError = null;
  const llm = loadLlmSettings();
  const streak = currentStageVariants();
  const variant = variantOf(event, streak);
  // 偶遇卡不给 AI 自定义槽（02 §二：偶遇是氛围，不是主抉择；也让 applyCustomChoice 不与
  // 主线 pickEvent 错配）
  const isEncounter = event.type === "encounter";
  root.innerHTML = S.cardAskScreen({
    stageIndex: state.stageIndex,
    stage,
    ageHint: event.ageHint,
    ageMonths: event.ageMonths,
    yearBadge: `${runYearOf(state.birthYear, event.ageMonths)} 年 · ${event.ageHint}`,
    text: event.text,
    detail: event.detail,
    options: event.options.map((o) => o.text),
    optionDetails: event.options.map((o) => o.detail),
    locks: optionLocks(state, event),
    line: event.line,
    critical: event.type === "critical",
    iconName: objectKeyOf(event.id),
    backdrop: sceneBackdrop(state.env),
    timeline: timelineVM(state),
    resources: state.resources,
    lines: state.lines,
    bump: feedback?.bump ?? [],
    floaters: feedback?.floaters ?? [],
    custom: llmUsable(llm) && !isEncounter,
    customError: customError ?? undefined,
    band: bandForYear(runYearOf(state.birthYear, event.ageMonths)),
    variant,
    kind: event.type,
  });
  for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-option]")) {
    btn.addEventListener("click", () => onChoose(Number(btn.dataset.option)));
  }
  // read 变体（偶遇/过场无选项）：一个「继续」= 走第一个选项（引擎侧同一条通道）
  root.querySelector<HTMLButtonElement>("[data-continue]")?.addEventListener("click", () => {
    if (!state) return;
    if (encounterFor(state)) {
      state = applyEncounterChoice(state, 0);
      persist();
      view = "card";
      render();
      return;
    }
    onChoose(0);
  });
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

/** 本阶段已出变体序列（app 侧派生，供 variantOf 的防单调 relay；纯读 history）。 */
function currentStageVariants(): RhythmVariant[] {
  if (!state) return [];
  const stage = STAGES[state.stageIndex];
  if (!stage) return [];
  return stageVariantSequence(state.history, stage, eventById);
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
  // 自定义行动的反馈浮动与常规选项同链路（换算档按本卡年份）
  pendingFeedback = {
    floaters: choiceFloats(option.deltas3 ?? {}, option.resourceDeltas ?? {}, bandForYear(runYearOf(capturedState.birthYear, event.ageMonths))),
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
  // v5 偶遇卡（02 §二）：与常规卡同一条反馈链，只是入账走 applyEncounterChoice（不推 line）
  const encounter = encounterFor(state);
  const event = encounter ?? pickEvent(state);
  if (!event) {
    toNext();
    return;
  }
  // 后果微反馈(v3/02 §三 浮动 + dogfooding 结论 1):按所选选项的三观/资源增量装配,下一屏消费
  // (积蓄浮动按本卡年份换算档走「元」口径,v4/02 §四)
  const option = event.options[index];
  pendingFeedback = {
    floaters: choiceFloats(option?.deltas3 ?? {}, option?.resourceDeltas ?? {}, bandForYear(runYearOf(state.birthYear, event.ageMonths))),
    bump: RES_KEYS.filter((k) => (option?.resourceDeltas[k] ?? 0) !== 0),
  };
  // choice 表情反馈(02 §二):按本次派生 tf 偏移方向 + 选择前 mood 抽帧,同种子可复现
  const tfDelta = optionDimsDelta(event, index).tf ?? 0;
  const dir: DeltaDir = tfDelta > 0 ? "pos" : tfDelta < 0 ? "neg" : "neutral";
  choiceFeedback = pickChoiceFrame(dir, createFishParams(state.dims).mood, state.seed + state.history.length);
  const aftermath = option?.aftermath;
  state = encounter ? applyEncounterChoice(state, index) : applyChoice(state, index);
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
    lines: state.lines,
    bump: feedback?.bump ?? [],
    floaters: feedback?.floaters ?? [],
    band: bandForYear(runYearOf(state.birthYear, pendingAftermath.ageMonths)),
  });
  hydrateFish(choiceFeedback ?? undefined);
  bindFamilyOpen();
  bindContinue();
  bindRestart();
}

/** 应答后的推进：还有事件（含 v5 偶遇卡）→ 下一张卡；取尽 → advanceStage（终局或阶段小结）。 */
function toNext(): void {
  if (!state) return;
  pendingAftermath = null;
  if (pickEvent(state) || encounterFor(state)) {
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
  const span = stageSpan(state, stage);
  root.innerHTML = S.summaryScreen({
    stageIndex: state.stageIndex,
    stage,
    count: stageEntries(state.history, stage).length,
    deltas: stageDeltas(state, stage),
    resources: state.resources,
    lines: state.lines,
    fishRadius: createFishParams(state.dims).orderliness.radius,
    backdrop: sceneBackdrop(state.env),
    band: bandOfState(state),
    yearRange: span.yearRange,
    ageRange: span.ageRange,
    valuesNotes: valuesNotes(state, stage),
    stageCriticals: stageCriticals(state, stage),
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
  root.innerHTML = S.relationsScreen(state.npcs);
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
    lines: state.lines,
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
    band: bandOfState(state),
  });
  hydrateFish(endingFrame(ending.id));
  // 终局雷达只留一条淡影：出生时的四维（「那时 vs 现在」）。八条历史叠影读不出东西。
  hydrateRadar([initialDimsOf(state)]);
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

/** 设置页（v3/02 §七 + v4/02 §五 + v5/02 §七）：主题四款 / 阅读偏好（字号·动效）/ 清档 / AI 旁路。
 *  即时项（主题、字号、动效）各自走独立键并当场生效，不随表单提交；保存只提交旁路配置。 */
function renderSettings(error?: string): void {
  const settings = loadLlmSettings();
  const prefs = loadPrefs();
  let hasSave = false;
  try {
    hasSave = hasSaveKey();
  } catch {
    hasSave = false;
  }
  root.innerHTML = S.settingsScreen({ settings, theme: loadTheme(), prefs, hasSave, error });
  // 主题即时切换（02 §五「设置页即时切换」）：CSS variables 全局接管，无需重渲染
  for (const input of root.querySelectorAll<HTMLInputElement>("[data-theme-choice]")) {
    input.addEventListener("change", () => {
      const id = input.value as ThemeId;
      applyTheme(id);
      saveTheme(id);
    });
  }
  // 阅读偏好即时切换（v5/02 §七 ▸ 设置页补全）：<html data-font / data-motion> 接管字号与动画
  for (const input of root.querySelectorAll<HTMLInputElement>("[data-font-choice]")) {
    input.addEventListener("change", () => {
      const next = { ...loadPrefs(), font: input.value as FontScale };
      applyPrefs(next);
      savePrefs(next);
    });
  }
  for (const input of root.querySelectorAll<HTMLInputElement>("[data-motion-choice]")) {
    input.addEventListener("change", () => {
      const next = { ...loadPrefs(), motion: input.value as MotionPref };
      applyPrefs(next);
      savePrefs(next);
    });
  }
  // 清档（设置页就地清，不跳开局屏）：只清存档键，图鉴与设置保留
  root.querySelector<HTMLButtonElement>("[data-clear-save]")?.addEventListener("click", (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    if (btn.dataset.armed !== "1") {
      btn.dataset.armed = "1";
      btn.textContent = "确认清除？";
      return;
    }
    try {
      clear();
    } catch {
      // 存储不可用：无档可清
    }
    delete btn.dataset.armed;
    btn.textContent = "已清除";
    btn.disabled = true;
  });
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
        btn.textContent = "已保存";
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
  startDraft = initialDraft();
  pendingAftermath = null;
  pendingFeedback = null;
  choiceFeedback = null;
  galleryJustUnlocked = false;
  customSlotError = null;
  variantCache.clear();
  view = "start";
  render();
}
