import { Provider, GenerateArgs, ProviderResult, ProviderError } from "./types";

// OpenRouter exposes many open models (Llama, Qwen, Gemma, GPT-OSS, …) through
// one OpenAI-compatible endpoint. Several are free (":free" slugs), which is why
// this is the default provider — no per-article cost at launch.
//
// IMPORTANT: free model slugs rotate often. The model is an ENV var
// (OPENROUTER_MODEL) so you can swap it the moment a slug changes, with no
// code edit or redeploy of new code. Verify current free IDs at
// openrouter.ai/models.
//
// Free tiers are rate-limited (roughly 20 req/min, a few hundred/day). Fine for
// launch; revisit when volume grows.

const DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct:free";

export const openRouterProvider: Provider = {
  id: "openrouter",
  label: "OpenRouter (free)",

  configured() {
    return !!process.env.OPENROUTER_API_KEY;
  },

  async generate({ system, user, maxTokens }: GenerateArgs): Promise<ProviderResult> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new ProviderError("OPENROUTER_API_KEY is not set on the server.");
    }
    const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        // OpenRouter asks for these for attribution; harmless if generic.
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://flowdesk.app",
        "X-Title": "flowdesk",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        // OpenAI-style chat format: system + user turns.
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const detail =
        data?.error?.message || `OpenRouter returned ${res.status}`;
      throw new ProviderError(detail, res.status);
    }

    const markdown: string =
      data?.choices?.[0]?.message?.content?.toString() ?? "";

    if (!markdown.trim()) {
      throw new ProviderError("Model returned an empty article.");
    }

    return { markdown, model, usage: data?.usage };
  },
};
