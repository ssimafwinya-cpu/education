// ─── Multi-provider LLM router ───────────────────────────────────────────────
// A thin, dependency-free abstraction over the major LLM providers. Each
// provider speaks its own HTTP dialect but exposes the same `streamChat`
// contract to the rest of the app. The router picks the first provider that
// has an API key configured (honouring AI_DEFAULT_PROVIDER), and falls back to
// a built-in local "tutor" engine when nothing is configured — so the product
// is fully functional out of the box.

export type ProviderName = "anthropic" | "openai" | "google" | "mistral" | "deepseek";

export interface ChatTurn {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProviderConfig {
  name: ProviderName;
  label: string;
  model: string;
  apiKey: string | undefined;
}

/** Read provider config from the environment (server-side only). */
export function loadProviders(): ProviderConfig[] {
  return [
    { name: "anthropic", label: "Claude", model: "claude-fable-5", apiKey: process.env.ANTHROPIC_API_KEY },
    { name: "openai", label: "GPT", model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
    { name: "google", label: "Gemini", model: "gemini-1.5-pro", apiKey: process.env.GOOGLE_AI_API_KEY },
    { name: "mistral", label: "Mistral", model: "mistral-large-latest", apiKey: process.env.MISTRAL_API_KEY },
    { name: "deepseek", label: "DeepSeek", model: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  ];
}

export function pickProvider(): ProviderConfig | null {
  const providers = loadProviders();
  const preferred = (process.env.AI_DEFAULT_PROVIDER as ProviderName) || "anthropic";
  const configured = providers.filter((p) => p.apiKey);
  if (configured.length === 0) return null;
  return configured.find((p) => p.name === preferred) ?? configured[0];
}

/**
 * Stream a chat completion as an async iterable of text chunks.
 * Uses the provider's native streaming SSE format.
 */
export async function* streamChat(
  provider: ProviderConfig,
  system: string,
  messages: ChatTurn[],
  signal?: AbortSignal,
): AsyncGenerator<string> {
  switch (provider.name) {
    case "anthropic":
      yield* streamAnthropic(provider, system, messages, signal);
      return;
    case "google":
      yield* streamGoogle(provider, system, messages, signal);
      return;
    // OpenAI, Mistral and DeepSeek share the OpenAI chat-completions dialect.
    default:
      yield* streamOpenAICompatible(provider, system, messages, signal);
  }
}

async function* readSSE(res: Response, extract: (json: any) => string | undefined) {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const chunk = extract(JSON.parse(data));
        if (chunk) yield chunk;
      } catch {
        /* skip keep-alive / partial frames */
      }
    }
  }
}

async function* streamAnthropic(p: ProviderConfig, system: string, messages: ChatTurn[], signal?: AbortSignal) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": p.apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: p.model,
      max_tokens: 1500,
      system,
      stream: true,
      messages: messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  yield* readSSE(res, (j) => (j.type === "content_block_delta" ? j.delta?.text : undefined));
}

async function* streamOpenAICompatible(p: ProviderConfig, system: string, messages: ChatTurn[], signal?: AbortSignal) {
  const base =
    p.name === "mistral"
      ? "https://api.mistral.ai/v1/chat/completions"
      : p.name === "deepseek"
        ? "https://api.deepseek.com/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
  const res = await fetch(base, {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${p.apiKey}`,
    },
    body: JSON.stringify({
      model: p.model,
      stream: true,
      max_tokens: 1500,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`${p.label} ${res.status}: ${await res.text()}`);
  yield* readSSE(res, (j) => j.choices?.[0]?.delta?.content);
}

async function* streamGoogle(p: ProviderConfig, system: string, messages: ChatTurn[], signal?: AbortSignal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${p.model}:streamGenerateContent?alt=sse&key=${p.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  yield* readSSE(res, (j) => j.candidates?.[0]?.content?.parts?.[0]?.text);
}
