// LLM 旁路三用途（v3/02 §七，D2=a）：①自定义选项裁决 ②context 事件变体改写 ③终局人生点评。
// 纪律：LLM 只产叙事与建议标签；数值走本地规则表 + clampCustomDeltas 钳制后才入状态。
// 降级三路径（无 Key/超时/报错）：全部 catch 后返回 null，调用方回原文/预设文案——离线行为与 v2 完全一致。
import type { Deltas3, EventOption, GameEvent, ResourceDeltas } from "../engine/model";
import { clampCustomDeltas } from "../engine/values";
import { chatCompletion } from "./provider";
import type { LlmSettings } from "./config";
import { llmUsable } from "./config";

/** 归一后的自定义选项（EventOption 形状，flag 不开放——flags 驱动 pre/结局 cond，LLM 不可触达）。 */
export interface CustomOptionView {
  text: string;
  deltas3: Deltas3;
  resourceDeltas: ResourceDeltas;
}

/**
 * 本地标签规则表（02 §七「换算用本地规则表」的唯一实现）：
 * LLM 只从闭集选标签，本表决定数值——三观 ±2 / 资源 ±5，相抵对（如 耗财+进账）在钳制层清零。
 */
export const TAG_RULES: Readonly<Record<string, Partial<Deltas3 & ResourceDeltas>>> = {
  理性: { worldview: -2 },
  感应: { worldview: 2 },
  进取: { outlook: -2 },
  安然: { outlook: 2 },
  原则: { values: -2 },
  共情: { values: 2 },
  振奋: { mood: 5 },
  消沉: { mood: -5 },
  进账: { money: 5 },
  耗财: { money: -5 },
  养生: { health: 5 },
  劳损: { health: -5 },
};

const TAG_LIST = Object.keys(TAG_RULES).join("/");

/** 终局点评的预设文案（降级兜底，02 §七「点评用预设文案」）。 */
export const PRESET_COMMENTARY =
  "这一段人生已经完整收进图鉴。没有哪一次抉择是白费的——它们只是换了一种写法，留在你身上。";

function extractJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function applyTagRules(tags: unknown): { deltas3: Deltas3; resourceDeltas: ResourceDeltas } {
  const deltas3: Deltas3 = {};
  const resourceDeltas: ResourceDeltas = {};
  const list = Array.isArray(tags) ? tags : [];
  for (const t of list) {
    const rule = typeof t === "string" ? TAG_RULES[t] : undefined;
    if (!rule) continue;
    for (const [key, v] of Object.entries(rule)) {
      if (key === "worldview" || key === "outlook" || key === "values") {
        deltas3[key] = (deltas3[key] ?? 0) + (v ?? 0);
      } else {
        resourceDeltas[key as keyof ResourceDeltas] =
          (resourceDeltas[key as keyof ResourceDeltas] ?? 0) + (v ?? 0);
      }
    }
  }
  return { deltas3, resourceDeltas };
}

/**
 * 用途①自定义选项裁决：自由文本 → {叙事文案, 三观/资源增量}。
 * LLM 负责把行动改写成第二人称选项文案并打闭集标签；数值完全由本地规则表 + 钳制决定。
 * 任何失败（不可用/超时/报错/解析失败/叙事为空）→ null，调用方隐藏或回退，绝不入半截状态。
 */
export async function normalizeCustomOption(
  userText: string,
  event: GameEvent,
  settings: LlmSettings,
  fetchImpl?: typeof fetch,
): Promise<CustomOptionView | null> {
  if (!llmUsable(settings) || !userText.trim()) return null;
  try {
    const raw = await chatCompletion(
      settings,
      [
        {
          role: "system",
          content:
            `你是人生模拟游戏《心路》的旁白。玩家面对事件「${event.text}」，给出了自定义行动。` +
            `把该行动改写为一条第二人称开头的选项文案（≤40字，克制、生活化，不复述原事件），` +
            `并从闭集标签中选 0–4 个描述其后果方向。只输出 JSON：{"narrative":"...","tags":["..."]}。` +
            `可用标签：${TAG_LIST}。`,
        },
        { role: "user", content: userText.trim().slice(0, 120) },
      ],
      { fetchImpl },
    );
    const parsed = extractJson(raw);
    const narrative = parsed?.narrative;
    if (typeof narrative !== "string" || !narrative.trim()) return null;
    const { deltas3, resourceDeltas } = applyTagRules(parsed?.tags);
    const clamped = clampCustomDeltas(deltas3, resourceDeltas, event.type);
    return { text: narrative.trim().slice(0, 80), deltas3: clamped.deltas3, resourceDeltas: clamped.resourceDeltas };
  } catch {
    return null;
  }
}

/**
 * 用途②context 事件变体改写：语义保持，deltas 不变（只动文案，绝不触碰数值——02 §七）。
 * 失败 → null，调用方保持原文。
 */
export async function rewriteVariant(
  event: GameEvent,
  settings: LlmSettings,
  fetchImpl?: typeof fetch,
): Promise<string | null> {
  if (!llmUsable(settings) || event.type !== "context") return null;
  try {
    const raw = await chatCompletion(
      settings,
      [
        {
          role: "system",
          content:
            "把这段人生模拟游戏的第二人称事件文本换一种讲法：保持场景、情绪与所有具体细节，" +
            "只改叙述角度与用词（≤原长的1.4倍）。不要添加新事件、新人物、新数值。只输出改写后的正文。",
        },
        { role: "user", content: event.text },
      ],
      { fetchImpl },
    );
    const text = raw.trim();
    return text.length > 0 && text.length <= event.text.length * 2 + 80 ? text : null;
  } catch {
    return null;
  }
}

export interface CommentaryContext {
  title: string;
  letters: string;
  lineSummary: string;
}

/**
 * 用途③终局人生点评：终局信息 → 一段 60–120 字的第二人称点评。
 * 失败 → null，调用方用 PRESET_COMMENTARY。
 */
export async function endingCommentary(
  ctx: CommentaryContext,
  settings: LlmSettings,
  fetchImpl?: typeof fetch,
): Promise<string | null> {
  if (!llmUsable(settings)) return null;
  try {
    const raw = await chatCompletion(
      settings,
      [
        {
          role: "system",
          content:
            "为人生模拟游戏《心路》的终局写一段点评：60–120 字，第二人称，温柔而不评断，" +
            "不使用排比堆砌，不复述结局标题。只输出点评正文。",
        },
        {
          role: "user",
          content: `结局「${ctx.title}」（${ctx.letters}）。${ctx.lineSummary}`,
        },
      ],
      { fetchImpl },
    );
    const text = raw.trim();
    return text.length >= 20 && text.length <= 300 ? text : null;
  } catch {
    return null;
  }
}

/** 事件选项 → 归一视图（applyCustomChoice 的入参装配：flag 不开放给自定义槽）。 */
export function customOptionOf(view: CustomOptionView): EventOption {
  return {
    text: view.text,
    deltas3: view.deltas3,
    resourceDeltas: view.resourceDeltas,
  };
}
