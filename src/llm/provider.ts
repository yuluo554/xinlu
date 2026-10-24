// OpenAI 兼容协议调用层（v3/02 §七）：单函数 chatCompletion，8s 超时，错误全部上抛由旁路层降级。
// fetchImpl 注入用于单测；生产路径用全局 fetch（本文件是全仓唯一的网络调用点，过网隔离 grep 守护）。

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export interface ChatOpts {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

function joinUrl(baseUrl: string, path: string): string {
  return baseUrl.replace(/\/+$/, "") + path;
}

export async function chatCompletion(
  settings: { baseUrl: string; apiKey: string; model: string },
  messages: readonly ChatMessage[],
  opts: ChatOpts = {},
): Promise<string> {
  const doFetch = opts.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);
  try {
    const resp = await doFetch(joinUrl(settings.baseUrl, "/chat/completions"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature: 0.8,
        max_tokens: 400,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`LLM HTTP ${resp.status}`);
    const data: unknown = await resp.json();
    const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]
      ?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("LLM 响应缺 content");
    return content;
  } finally {
    clearTimeout(timer);
  }
}
