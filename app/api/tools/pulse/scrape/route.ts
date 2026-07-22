import { NextResponse } from "next/server";
import { scrapeAll } from "@/lib/engine/pulse/scrape";

export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { urls?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const urls = Array.isArray(body.urls)
    ? body.urls.map(String).map((u) => u.trim()).filter(Boolean)
    : [];

  if (urls.length === 0) {
    return NextResponse.json({ ok: true, docs: [] });
  }

  // Cap to avoid a single request fanning out to hundreds of fetches.
  const capped = urls.slice(0, 20);
  const docs = await scrapeAll(capped);

  return NextResponse.json({ ok: true, docs });
}
