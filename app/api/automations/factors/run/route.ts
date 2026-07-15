import { NextResponse } from "next/server";

// Rendering a PNG takes time (Chromium + upload). Give it room.
export const maxDuration = 60;

const TYPES = [
  "text",
  "quote",
  "stat",
  "testimonial",
  "illustration",
  "creative-billboard",
  "billboard-wide",
];
const VARIANTS = ["red", "teal", "amber", "green", "orange", "blue", "paper"];

export async function POST(req: Request) {
  const webhookUrl = process.env.N8N_FACTORS_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, error: "N8N_FACTORS_WEBHOOK_URL is not set." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // Validate against the exact values the workflow's TYPE_MAP / VARIANTS accept,
  // so bad input fails here with a clear message instead of silently
  // falling back to defaults inside n8n.
  const type = String(body.type ?? "text");
  const background = String(body.background ?? "teal");
  const content = String(body.content ?? "").trim();

  if (!TYPES.includes(type)) {
    return NextResponse.json(
      { ok: false, error: `Unknown type "${type}".` },
      { status: 400 }
    );
  }
  if (!VARIANTS.includes(background)) {
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

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Matches the Header Auth credential on the n8n Webhook node.
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

    // n8n's Respond node returns JSON, but guard against an HTML error page.
    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json(
        { ok: false, error: "n8n did not return JSON.", detail: text.slice(0, 500) },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Request failed." },
      { status: 500 }
    );
  }
}
