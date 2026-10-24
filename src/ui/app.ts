// 四屏主控制器（vanilla TS，无 UI 框架）：路由 = start / card / aftermath / summary / ending / corrupt。
// 存档纪律（plan/02 §六）：createRun 与每次 applyChoice / advanceStage 后 save；
// 启动 load() 有档续局；load 为 null 但 key 在位 = 损坏 → 提示可重开，绝不静默清档。
import {
  advanceStage,
  applyChoice,
  birthEnvOptions,
  createRun,
  initialDimsOf,
  pickEvent,
  resolveEnding,
} from "../engine/engine";
import { STAGES, type BirthEnv, type Dims, type Ending, type RunState, type Stage } from "../engine/model";
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
import { exportShareCard } from "./share-card";
import portraits from "../data/portraits.json" with { type: "json" };
import * as S from "./screens";

type View = "start" | "card" | "aftermath" | "summary" | "ending" | "corrupt";

let root: HTMLElement;
let state: RunState | null = null;
let view: View = "start";
let pendingAftermath: { stage: Stage; ageHint: string; text: string } | null = null;
// choice 类表情反馈帧(02 §二):表现态,不进存档(schema v1 冻结,刷新续局回待机态)。
let choiceFeedback: string | null = null;

type Boot = { kind: "fresh" } | { kind: "resume"; state: RunState } | { kind: "corrupt" };

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
  switch (view) {
    case "start":
      renderStart();
      break;
    case "card":
      renderCard();
      break;
    case "aftermath":
      renderAftermath();
      break;
    case "summary":
      renderSummary();
      break;
    case "ending":
      renderEnding();
      break;
    case "corrupt":
      root.innerHTML = S.corruptScreen();
      bindRestart();
      break;
  }
}

function renderStart(error?: string): void {
  root.innerHTML = S.startScreen(birthEnvOptions(), error);
  const form = root.querySelector<HTMLFormElement>("[data-env-form]");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const env: BirthEnv = {
      era: String(data.get("era") ?? ""),
      place: String(data.get("place") ?? ""),
      mood: String(data.get("mood") ?? ""),
      style: String(data.get("style") ?? ""),
    };
    try {
      state = createRun(env, Date.now() % 2147483647);
    } catch {
      renderStart("出生环境无效，请重新选择后再开始。");
      return;
    }
    persist();
    view = "card";
    render();
  });
}

function renderCard(): void {
  if (!state) return;
  const event = pickEvent(state);
  if (!event) {
    toNext();
    return;
  }
  const stage = STAGES[state.stageIndex]!;
  root.innerHTML = S.cardAskScreen({
    stageIndex: state.stageIndex,
    stage,
    ageHint: event.ageHint,
    text: event.text,
    options: event.options.map((o) => o.text),
    fishRadius: createFishParams(state.dims).orderliness.radius,
    backdrop: sceneBackdrop(state.env),
  });
  hydrateFish(choiceFeedback ?? undefined);
  for (const btn of root.querySelectorAll<HTMLButtonElement>("[data-option]")) {
    btn.addEventListener("click", () => onChoose(Number(btn.dataset.option)));
  }
  bindRestart();
}

function onChoose(index: number): void {
  if (!state) return;
  const event = pickEvent(state);
  if (!event) {
    toNext();
    return;
  }
  // choice 表情反馈(02 §二):按本次 tf 偏移方向 + 选择前 mood 抽帧,同种子可复现
  const tfDelta = event.options[index]?.deltas.tf ?? 0;
  const dir: DeltaDir = tfDelta > 0 ? "pos" : tfDelta < 0 ? "neg" : "neutral";
  choiceFeedback = pickChoiceFrame(dir, createFishParams(state.dims).mood, state.seed + state.history.length);
  const aftermath = event.options[index]?.aftermath;
  state = applyChoice(state, index);
  persist();
  if (aftermath) {
    pendingAftermath = { stage: STAGES[state.stageIndex]!, ageHint: event.ageHint, text: aftermath };
    view = "aftermath";
    render();
  } else {
    toNext();
  }
}

function renderAftermath(): void {
  if (!state || !pendingAftermath) {
    toNext();
    return;
  }
  root.innerHTML = S.cardAftermathScreen({
    stageIndex: state.stageIndex,
    stage: pendingAftermath.stage,
    ageHint: pendingAftermath.ageHint,
    aftermath: pendingAftermath.text,
    backdrop: sceneBackdrop(state.env),
  });
  hydrateFish(choiceFeedback ?? undefined);
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
  view = state.stageIndex >= STAGES.length ? "ending" : "summary";
  render();
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
    fishRadius: createFishParams(state.dims).orderliness.radius,
    backdrop: sceneBackdrop(state.env),
  });
  hydrateFish(stageFrame(stage));
  hydrateRadar([dimsAtStageStart(state, stage)]);
  bindContinue();
  bindRestart();
}

function renderEnding(): void {
  if (!state) return;
  const ending = resolveEnding(state);
  root.innerHTML = S.endingScreen({
    title: ending.title,
    letters: endingLetters(ending, state),
    text: ending.text,
    retrospect: ending.retrospect,
    criticals: criticalChoices(state.history),
    seed: state.seed,
    fishRadius: createFishParams(state.dims).orderliness.radius,
    backdrop: sceneBackdrop(state.env),
  });
  hydrateFish(endingFrame(ending.id));
  hydrateRadar(STAGES.map((s) => dimsAtStageStart(state!, s)));
  const curveSlot = root.querySelector("[data-slot='curve']");
  if (curveSlot) renderCurve(state.history, curveSlot, initialDimsOf(state.env));
  bindShare(ending);
  bindRestart();
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
  choiceFeedback = null;
  view = "start";
  render();
}
