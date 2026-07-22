import { NextResponse } from "next/server";
import { buildSystemAndUser } from "@/lib/engine/pulse/prompt";
import { GenerateInput } from "@/lib/engine/pulse/types";
import { resolveProvider } from "@/lib/engine/pulse/providers";
import { ProviderError } from "@/lib/engine/pulse/providers/types";

// Long articles take a while. 60s is Vercel Hobby's ceiling; lower targetWords
// or move to Pro (300s) if you hit it.
export const maxDuration = 60;

export async function POST(req: Request) {
  let input: GenerateInput & { tier?: string };
  try {
    input = (await req.json()) as GenerateInput & { tier?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!input.topic?.trim()) {
    return NextResponse.json(
      { ok: false, error: "A topic or title is required." },
      { status: 400 }
    );
  }
  if (!input.voice) {
    return NextResponse.json(
      { ok: false, error: "Pick a voice first." },
      { status: 400 }
    );
  }

  // "free" → OpenRouter, "premium" → Claude, or the env default.
  const provider = resolveProvider(input.tier);
  if (!provider.configured()) {
    return NextResponse.json(
      {
        ok: false,
        error: `The ${provider.label} provider isn't configured on the server (missing API key).`,
      },
      { status: 500 }
    );
  }

  const { system, user } = buildSystemAndUser(input);
  const maxTokens = Math.min(
    8000,
    Math.max(2000, Math.round(input.voice.targetWords * 2))
  );

  const started = Date.now();
  try {
    const result = await provider.generate({ system, user, maxTokens });
    const words = result.markdown.trim().split(/\s+/).length;

    return NextResponse.json({
      ok: true,
      markdown: result.markdown,
      words,
      provider: provider.id,
      providerLabel: provider.label,
      model: result.model,
      ms: Date.now() - started,
      usage: result.usage ?? null,
    });
  } catch (err) {
    if (err instanceof ProviderError) {
      return NextResponse.json(
        { ok: false, error: err.message, provider: provider.id },
        { status: err.status && err.status >= 400 ? 502 : 500 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Generation failed.",
      },
      { status: 500 }
    );
  }
}
