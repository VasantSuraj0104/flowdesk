import { NextResponse } from "next/server";
import { buildSystemAndUser } from "@/lib/engine/pulse/prompt";
import { GenerateInput } from "@/lib/engine/pulse/types";

// Long articles take a while to generate. 60s is Vercel Hobby's ceiling; if you
// hit it on very long pieces, lower targetWords or move to a Pro plan (300s).
export const maxDuration = 60;

// Set PULSE_MODEL in your env to a model your Anthropic account can access.
// Kept configurable so we never hardcode a model string that might not fit your
// plan. See console.anthropic.com → your available models.
const MODEL = process.env.PULSE_MODEL || "claude-sonnet-4-5";

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  let input: GenerateInput;
  try {
    input = (await req.json()) as GenerateInput;
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

  const { system, user } = buildSystemAndUser(input);

  // Generous cap: ~4000 words ≈ 6000 tokens, plus headroom.
  const maxTokens = Math.min(
    8000,
    Math.max(2000, Math.round(input.voice.targetWords * 2))
  );

  const started = Date.now();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
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
      return NextResponse.json(
        { ok: false, error: detail, status: res.status },
        { status: 502 }
      );
    }

    // Anthropic returns content as an array of blocks; concatenate the text.
    const markdown: string = Array.isArray(data?.content)
      ? data.content
          .map((b: { type: string; text?: string }) =>
            b.type === "text" ? b.text ?? "" : ""
          )
          .join("")
      : "";

    if (!markdown.trim()) {
      return NextResponse.json(
        { ok: false, error: "Model returned an empty article." },
        { status: 502 }
      );
    }

    const words = markdown.trim().split(/\s+/).length;

    return NextResponse.json({
      ok: true,
      markdown,
      words,
      model: MODEL,
      ms: Date.now() - started,
      usage: data?.usage ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Generation failed.",
      },
      { status: 500 }
    );
  }
}
