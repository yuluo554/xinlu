// LLM 旁路单测（v3-M3'' 3.3 · plan/v3/03 §5 验收：三路降级 / 本地规则表 / 钳制 / 提供商层）。
// 全部网络交互走注入的 fetchImpl——本文件本身零过网。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameEvent } from "../engine/model";
import { createRun, pickEvent } from "../engine/engine";
import {
  DEFAULT_LLM_SETTINGS,
  LLM_SETTINGS_KEY,
  llmUsable,
  loadLlmSettings,
  providerById,
  saveLlmSettings,
  type LlmSettings,
} from "./config";
import { chatCompletion } from "./provider";
import {
  PRESET_COMMENTARY,
  TAG_RULES,
  customOptionOf,
  endingCommentary,
  normalizeCustomOption,
  rewriteVariant,
} from "./bypass";

class MemoryStorage implements Storage {
  constructor(private readonly backing: Map<string, string>) {}
  get length(): number {
    return this.backing.size;
  }
  clear(): void {
    this.backing.clear();
  }
  getItem(key: string): string | null {
    return this.backing.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.backing.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.backing.delete(key);
  }
  setItem(key: string, value: string): void {
    this.backing.set(key, String(value));
  }
}

const USABLE: LlmSettings = {
  enabled: true,
  provider: "deepseek",
  baseUrl: "https://api.example.test/v1",
  apiKey: "sk-test",
  model: "test-model",
};

/** 自定义行动样例输入（裁决层的自由文本）。 */
const CUSTOM_TEXT = "我打算翻墙进去把球捡回来";

const okFetch = (body: unknown): typeof fetch =>
  (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof fetch;

const chatJson = (content: string) => ({
  choices: [{ message: { content } }],
});

/** 真实事件取自事件库（可应答事件），保证 GameEvent 形状真实。 */
function firstEvent(): GameEvent {
  const state = createRun({ era: "90s", place: "小城", mood: "和睦", style: "权威" }, 42);
  return pickEvent(state)!;
}

beforeEach(() => {
  vi.stubGlobal("localStorage", new MemoryStorage(new Map()));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("config（设置层）", () => {
  it("默认不可用（开关关 + 无 Key）——离线隐藏口径的根", () => {
    expect(loadLlmSettings()).toEqual(DEFAULT_LLM_SETTINGS);
    expect(llmUsable(loadLlmSettings())).toBe(false);
  });

  it("可用 = 开关 + Key + Base URL + Model 全齐", () => {
    expect(llmUsable(USABLE)).toBe(true);
    expect(llmUsable({ ...USABLE, enabled: false })).toBe(false);
    expect(llmUsable({ ...USABLE, apiKey: "" })).toBe(false);
    expect(llmUsable({ ...USABLE, baseUrl: " " })).toBe(false);
    expect(llmUsable({ ...USABLE, model: "" })).toBe(false);
  });

  it("保存/读取往返；未知键与非法 provider 被消毒", () => {
    saveLlmSettings(USABLE);
    expect(loadLlmSettings()).toEqual(USABLE);
    localStorage.setItem(
      LLM_SETTINGS_KEY,
      JSON.stringify({ ...USABLE, provider: "nope", evil: "x", enabled: true }),
    );
    const loaded = loadLlmSettings();
    expect(loaded.provider).toBe("openai");
    expect(Object.keys(loaded).sort()).toEqual(["apiKey", "baseUrl", "enabled", "model", "provider"]);
  });

  it("损坏 JSON → 默认设置（不抛错）", () => {
    localStorage.setItem(LLM_SETTINGS_KEY, "{oops");
    expect(loadLlmSettings()).toEqual(DEFAULT_LLM_SETTINGS);
  });

  it("服务商预设可查；custom 预设 Base URL 为空（手动填）", () => {
    expect(providerById("deepseek")?.baseUrl).toContain("deepseek");
    expect(providerById("custom")?.baseUrl).toBe("");
    expect(providerById("nope")).toBeNull();
  });
});

describe("provider（OpenAI 兼容层）", () => {
  const settings = { baseUrl: "https://api.example.test/v1/", apiKey: "k", model: "m" };

  it("200 + 合法体 → content；URL 去尾斜杠拼 /chat/completions", async () => {
    let captured = "";
    const f = (async (url: RequestInfo | URL) => {
      captured = String(url);
      return new Response(JSON.stringify(chatJson("好")), { status: 200 });
    }) as unknown as typeof fetch;
    await expect(chatCompletion(settings, [{ role: "user", content: "hi" }], { fetchImpl: f })).resolves.toBe("好");
    expect(captured).toBe("https://api.example.test/v1/chat/completions");
  });

  it("降级路径①报错：非 2xx 抛错", async () => {
    const f = (async () => new Response("no", { status: 401 })) as unknown as typeof fetch;
    await expect(
      chatCompletion(settings, [{ role: "user", content: "hi" }], { fetchImpl: f }),
    ).rejects.toThrow("LLM HTTP 401");
  });

  it("降级路径①报错：响应缺 content 抛错", async () => {
    const f = okFetch({ choices: [{ message: {} }] });
    await expect(
      chatCompletion(settings, [{ role: "user", content: "hi" }], { fetchImpl: f }),
    ).rejects.toThrow();
  });

  it("降级路径②超时：8s 口径（此处 20ms 演练）→ abort 拒绝", async () => {
    const f = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    }) as unknown as typeof fetch;
    await expect(
      chatCompletion(settings, [{ role: "user", content: "hi" }], { fetchImpl: f, timeoutMs: 20 }),
    ).rejects.toThrow();
  });
});

describe("normalizeCustomOption（用途①裁决 + 本地规则表 + 钳制）", () => {
  it("标签 → 本地规则表数值；叙事透传；context 口径钳制（资源 ≤10）", async () => {
    const raw = JSON.stringify({ narrative: "你翻出抽屉里那张旧地图。", tags: ["共情", "耗财", "进账"] });
    const out = await normalizeCustomOption(CUSTOM_TEXT, firstEvent(), USABLE, okFetch(chatJson(raw)));
    expect(out).not.toBeNull();
    expect(out!.text).toBe("你翻出抽屉里那张旧地图。");
    expect(out!.deltas3).toEqual({ values: 2 }); // 共情 +2（规则表），其余未标
    expect(out!.resourceDeltas).toEqual({}); // 耗财 −5 + 进账 +5 相抵清零
  });

  it("相抵与超口径双验证：消沉+振奋清零；四枚资源标签同向被钳在 ±10", async () => {
    const raw = JSON.stringify({ narrative: "你决定歇一歇。", tags: ["消沉", "振奋", "耗财", "耗财", "劳损", "劳损"] });
    const out = await normalizeCustomOption(CUSTOM_TEXT, firstEvent(), USABLE, okFetch(chatJson(raw)));
    expect(out!.deltas3).toEqual({});
    expect(out!.resourceDeltas).toEqual({ money: -10, health: -10 }); // 双标签叠加后钳到上限
  });

  it("LLM 给闭集外标签 → 忽略（不产生数值）", async () => {
    const raw = JSON.stringify({ narrative: "你把硬币抛了出去。", tags: ["中彩票", "暴富"] });
    const out = await normalizeCustomOption(CUSTOM_TEXT, firstEvent(), USABLE, okFetch(chatJson(raw)));
    expect(out!.text).toBe("你把硬币抛了出去。");
    expect(out!.deltas3).toEqual({});
    expect(out!.resourceDeltas).toEqual({});
  });

  it("降级三路径：不可用 / 报错 / 解析失败 → null，绝不入状态", async () => {
    expect(await normalizeCustomOption(CUSTOM_TEXT, firstEvent(), DEFAULT_LLM_SETTINGS)).toBeNull();
    const bad = (async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
    expect(await normalizeCustomOption(CUSTOM_TEXT, firstEvent(), USABLE, bad)).toBeNull();
    expect(
      await normalizeCustomOption(CUSTOM_TEXT, firstEvent(), USABLE, okFetch(chatJson("这不是JSON"))),
    ).toBeNull();
    expect(
      await normalizeCustomOption(CUSTOM_TEXT, firstEvent(), USABLE, okFetch(chatJson('{"tags":[]}'))),
    ).toBeNull(); // 缺 narrative
  });

  it("空输入直接 null（不发起请求）", async () => {
    let called = 0;
    const f = (async () => {
      called++;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    expect(await normalizeCustomOption("  ", firstEvent(), USABLE, f)).toBeNull();
    expect(called).toBe(0);
  });

  it("customOptionOf 不携带 flag（LLM 不可触达 flags）", () => {
    const opt = customOptionOf({ text: "t", deltas3: { values: 1 }, resourceDeltas: { mood: 2 } });
    expect("flag" in opt).toBe(false);
  });
});

describe("rewriteVariant（用途②变体改写：只动文案）", () => {
  it("成功 → 改写文本", async () => {
    const out = await rewriteVariant(firstEvent(), USABLE, okFetch(chatJson("换了一种讲法的事件正文。")));
    expect(out).toBe("换了一种讲法的事件正文。");
  });

  it("降级：不可用 / 报错 / 空响应 → null（调用方保持原文）", async () => {
    expect(await rewriteVariant(firstEvent(), DEFAULT_LLM_SETTINGS)).toBeNull();
    const bad = (async () => new Response("x", { status: 503 })) as unknown as typeof fetch;
    expect(await rewriteVariant(firstEvent(), USABLE, bad)).toBeNull();
    expect(await rewriteVariant(firstEvent(), USABLE, okFetch(chatJson(" ")))).toBeNull();
  });

  it("离线口径：改写只回文本，事件对象（含 deltas）原封不动", async () => {
    const event = firstEvent();
    const snapshot = JSON.stringify(event);
    await rewriteVariant(event, USABLE, okFetch(chatJson("哪怕模型在正文里幻觉出任何内容")));
    expect(JSON.stringify(event)).toBe(snapshot);
  });
});

describe("endingCommentary（用途③终局点评）", () => {
  const ctx = { title: "平凡而珍贵的一生", letters: "ISFJ", lineSummary: "学业平顺，情感圆满。" };

  it("成功 → 点评文本", async () => {
    const text = "你把普通的日子过出了自己的节奏，这条路是你自己一步步走出来的，走得很稳。";
    const out = await endingCommentary(ctx, USABLE, okFetch(chatJson(text)));
    expect(out).toBe(text);
  });

  it("降级：不可用 / 报错 → null（调用方用 PRESET_COMMENTARY）", async () => {
    expect(await endingCommentary(ctx, DEFAULT_LLM_SETTINGS)).toBeNull();
    const bad = (async () => new Response("x", { status: 500 })) as unknown as typeof fetch;
    expect(await endingCommentary(ctx, USABLE, bad)).toBeNull();
    expect(PRESET_COMMENTARY.length).toBeGreaterThan(10);
  });
});

describe("TAG_RULES（本地规则表契约）", () => {
  it("闭集 12 枚：6 三观方向 + 6 资源方向；数值在钳制前口径内", () => {
    expect(Object.keys(TAG_RULES).length).toBe(12);
    for (const [tag, rule] of Object.entries(TAG_RULES)) {
      const values = Object.values(rule);
      expect(values.length, tag).toBeGreaterThan(0);
      for (const v of values) {
        expect(Math.abs(v!), tag).toBeLessThanOrEqual(5);
      }
    }
  });
});
