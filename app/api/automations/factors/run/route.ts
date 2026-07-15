import { NextResponse } from "next/server";
import { runFactors } from "@/lib/engine/factors/run";
import { TYPE_MAP, VARIANTS } from "@/lib/engine/factors/parse";

// Chromium render is the slow step. Hobby caps at 60s; Pro allows up to 300.
export const maxDuration = 60;

/**
 * Set FACTORS_ENGINE=n8n to route manual runs back through the webhook.
 * Default ("local") runs the TypeScript engine directly — no n8n hop.
 */
function useN8n() {
  return process.env.FACTORS_ENGINE === "n8n";
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const type = String(body.type ?? "text");
  const background = String(body.background ?? "teal");
  const content = String(body.content ?? "").trim();

  if (!TYPE_MAP[type]) {
    return NextResponse.json(
      { ok: false, error: `Unknown type "${type}".` },
      { status: 400 }
    );
  }
  if (!(VARIANTS as readonly string[]).includes(background)) {
    return NextResponse.json(
      { ok: false, error: `Unknown background "${background}".` },
      { status: 400 }
    );
  }
  if (!content) {
    return NextResponse.json(
      { ok: false, error: "Content is required." },
      { status: 400 }
    );
  }

  const assets = Array.isArray(body.assets)
    ? body.assets.map(String).filter(Boolean)
    : String(body.assets ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  // ---------- fallback: original n8n webhook ----------
  if (useN8n()) {
    const webhookUrl = process.env.N8N_FACTORS_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { ok: false, error: "FACTORS_ENGINE=n8n but N8N_FACTORS_WEBHOOK_URL is not set." },
        { status: 500 }
      );
    }
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.N8N_WEBHOOK_TOKEN
            ? { "x-flowdesk-token": process.env.N8N_WEBHOOK_TOKEN }
            : {}),
        },
        body: JSON.stringify({ type, background, content, assets }),
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: `n8n returned ${res.status}`, detail: text.slice(0, 500) },
          { status: 502 }
        );
      }
      return NextResponse.json({ ...JSON.parse(text), engine: "n8n" });
    } catch (err) {
      return NextResponse.json(
        { ok: false, error: err instanceof Error ? err.message : "n8n request failed." },
        { status: 502 }
      );
    }
  }

  // ---------- default: local engine ----------
  const result = await runFactors({ type, background, content, assets });

  if (!result.ok) {
    // The step name is the whole point of owning the engine — the UI can now
    // say "Render failed" vs "Upload failed" instead of a blanket error.
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        step: result.step,
        detail: result.detail,
        timings: result.timings,
        engine: "local",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ ...result, engine: "local" });
}
