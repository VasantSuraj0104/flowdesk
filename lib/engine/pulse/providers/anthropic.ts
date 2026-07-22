import { Provider, GenerateArgs, ProviderResult, ProviderError } from "./types";

// Claude — the premium, higher-quality option. Same interface as OpenRouter, so
// the route treats them identically. Paid per token; use for a premium tier or
// when output quality on the free model isn't good enough.

const DEFAULT_MODEL = "claude-sonnet-4-5";

export const anthropicProvider: Provider = {
  id: "anthropic",
  label: "Claude",

  configured() {
    return !!process.env.ANTHROPIC_API_KEY;
  },

  async generate({ system, user, maxTokens }: GenerateArgs): Promise<ProviderResult> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new ProviderError("ANTHROPIC_API_KEY is not set on the server.");
    }
    const model = process.env.PULSE_MODEL || DEFAULT_MODEL;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const detail =
        data?.error?.message || `Anthropic API returned ${res.status}`;
      throw new ProviderError(detail, res.status);
    }

    const markdown: string = Array.isArray(data?.content)
      ? data.content
          .map((b: { type: string; text?: string }) =>
            b.type === "text" ? b.text ?? "" : ""
          )
          .join("")
      : "";

    if (!markdown.trim()) {
      throw new ProviderError("Model returned an empty article.");
    }

    return { markdown, model, usage: data?.usage };
  },
};
