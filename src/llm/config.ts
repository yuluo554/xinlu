// LLM 旁路配置层（v3/02 §七，D2=a 拍板）：设置持久化 + 服务商预设 + 可用性判定。
// 本层是唯一的设置事实源；Key 以明文存本机 localStorage（UI 明示风险，02 §七口径）。
// 注意：本目录是全仓唯一允许出现网络调用的 UI 侧单层（判定核心 engine/ 禁网，grep 测试守护）。

export interface LlmSettings {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const LLM_SETTINGS_KEY = "xinlu.llm.v1";

/** OpenAI 兼容协议服务商预设（Base URL 可配，02 §七）。 */
export const PROVIDERS: ReadonlyArray<{ id: string; label: string; baseUrl: string }> = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com" },
  { id: "moonshot", label: "月之暗面 Kimi", baseUrl: "https://api.moonshot.cn/v1" },
  { id: "zhipu", label: "智谱 GLM", baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
  { id: "custom", label: "自定义（OpenAI 兼容）", baseUrl: "" },
];

export const DEFAULT_LLM_SETTINGS: LlmSettings = {
  enabled: false,
  provider: "openai",
  baseUrl: PROVIDERS[0]!.baseUrl,
  apiKey: "",
  model: "",
};

export function providerById(id: string): { label: string; baseUrl: string } | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

function sanitize(raw: unknown): LlmSettings {
  const base = { ...DEFAULT_LLM_SETTINGS };
  if (typeof raw !== "object" || raw === null) return base;
  const r = raw as Record<string, unknown>;
  if (typeof r.enabled === "boolean") base.enabled = r.enabled;
  if (typeof r.provider === "string" && providerById(r.provider)) base.provider = r.provider;
  if (typeof r.baseUrl === "string") base.baseUrl = r.baseUrl.trim();
  if (typeof r.apiKey === "string") base.apiKey = r.apiKey.trim();
  if (typeof r.model === "string") base.model = r.model.trim();
  return base;
}

export function loadLlmSettings(): LlmSettings {
  try {
    const raw = globalThis.localStorage?.getItem(LLM_SETTINGS_KEY);
    return raw ? sanitize(JSON.parse(raw)) : { ...DEFAULT_LLM_SETTINGS };
  } catch {
    // 解析失败 = 未配置（不抛错，离线路径不受影响）
    return { ...DEFAULT_LLM_SETTINGS };
  }
}

export function saveLlmSettings(settings: LlmSettings): void {
  const s = globalThis.localStorage;
  if (!s) throw new Error("localStorage 不可用");
  s.setItem(LLM_SETTINGS_KEY, JSON.stringify(sanitize(settings)));
}

/** 旁路可用 = 开关开启 + Key/Base URL/Model 齐。判定 UI 是否渲染第 4 槽与旁路入口（离线隐藏口径）。 */
export function llmUsable(s: LlmSettings): boolean {
  return s.enabled && s.apiKey.length > 0 && s.baseUrl.trim().length > 0 && s.model.trim().length > 0;
}
