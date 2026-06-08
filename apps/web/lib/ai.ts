export type AIProvider = "openai" | "anthropic" | "openrouter";

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const PROVIDER_DEFAULTS: Record<AIProvider, { label: string; model: string; placeholder: string }> = {
  openai: { label: "OpenAI", model: "gpt-4o-mini", placeholder: "sk-..." },
  anthropic: { label: "Anthropic (Claude)", model: "claude-haiku-4-5-20251001", placeholder: "sk-ant-..." },
  openrouter: { label: "OpenRouter", model: "openai/gpt-4o-mini", placeholder: "sk-or-..." },
};

const SETTINGS_KEY = "ai_settings";

export function getAISettings(): AISettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as AISettings) : null;
  } catch {
    return null;
  }
}

export function saveAISettings(s: AISettings): void {
  sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function clearAISettings(): void {
  sessionStorage.removeItem(SETTINGS_KEY);
}

export async function* streamCompletion(
  messages: AIMessage[],
  settings: AISettings,
  signal?: AbortSignal
): AsyncGenerator<string> {
  if (settings.provider === "anthropic") {
    yield* _streamAnthropic(messages, settings, signal);
  } else {
    yield* _streamOpenAICompat(messages, settings, signal);
  }
}

async function* _streamOpenAICompat(
  messages: AIMessage[],
  settings: AISettings,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const endpoint =
    settings.provider === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${settings.apiKey}`,
  };
  if (settings.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://github.com/DeductiveX/schemapilot";
    headers["X-Title"] = "WowDB";
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: settings.model, messages, stream: true }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message ?? `AI error ${res.status}`);
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const chunk = JSON.parse(data);
        const text: string | undefined = chunk?.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch { /* skip malformed */ }
    }
  }
}

async function* _streamAnthropic(
  messages: AIMessage[],
  settings: AISettings,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: settings.model,
      max_tokens: 4096,
      system: systemMsg?.content,
      messages: chatMessages,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } })?.error?.message ?? `Anthropic error ${res.status}`);
  }

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    const lines = buf.split("\n");
    buf = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const event = JSON.parse(line.slice(6));
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          yield event.delta.text as string;
        }
      } catch { /* skip */ }
    }
  }
}
