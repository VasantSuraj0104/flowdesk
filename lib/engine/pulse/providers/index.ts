import { Provider } from "./types";
import { openRouterProvider } from "./openrouter";
import { anthropicProvider } from "./anthropic";

// The registry. To add a provider (Groq, Together, a self-hosted model later),
// implement the Provider interface in a new file and register it here — nothing
// else in the app changes.

export const PROVIDERS: Record<string, Provider> = {
  openrouter: openRouterProvider,
  anthropic: anthropicProvider,
};

// Two named tiers the UI can request. "free" → OpenRouter, "premium" → Claude.
// PULSE_DEFAULT_PROVIDER lets you flip the default without a code change.
export function resolveProvider(tier?: string): Provider {
  if (tier === "premium") return anthropicProvider;
  if (tier === "free") return openRouterProvider;

  const envDefault = process.env.PULSE_DEFAULT_PROVIDER;
  if (envDefault && PROVIDERS[envDefault]) return PROVIDERS[envDefault];

  return openRouterProvider; // free by default
}
