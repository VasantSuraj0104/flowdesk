import { NextResponse } from "next/server";

export const maxDuration = 30;

// Vercel rejects request bodies over 4.5MB at the platform level, before this
// handler runs. Cap below that so oversized files fail with a readable message.
// The client (lib/prepareImage.ts) downscales large images before they get here.
const MAX_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export async function POST(req: Request) {
  const base = process.env.CLOUDFLARE_IMAGES_URL;
  const auth = process.env.CLOUDFLARE_IMAGES_AUTH;

  if (!base || !auth) {
    return NextResponse.json(
      {
        ok: false,
        error: "CLOUDFLARE_IMAGES_URL / CLOUDFLARE_IMAGES_AUTH are not set.",
      },
      { status: 500 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Expected multipart form data." },
      { status: 400 }
    );
  }

  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { ok: false, error: "No file provided." },
      { status: 400 }
    );
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { ok: false, error: `Unsupported type "${file.type || "unknown"}".` },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: `File is ${(file.size / 1048576).toFixed(1)}MB — the limit is 4MB.`,
      },
      { status: 400 }
    );
  }

  // Same key shape the workflow's Upload node uses: sanitized + timestamped,
  // so uploads can never collide or contain unsafe characters.
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const stem = file.name.replace(/\.[^.]+$/, "").slice(0, 40);
  const key = `asset-${stem}-${Date.now()}.${ext}`.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  try {
    const bytes = await file.arrayBuffer();

    // Mirrors the n8n "Upload PNG → Cloudflare KV" node exactly:
    // PUT {base}/upload?key=... with the x-auth header and a binary body.
    const res = await fetch(
      `${base.replace(/\/$/, "")}/upload?key=${encodeURIComponent(key)}`,
      {
        method: "PUT",
        headers: {
          "x-auth": auth,
          "Content-Type": file.type,
        },
        body: bytes,
        cache: "no-store",
      }
    );

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Upload failed (${res.status})`,
          detail: text.slice(0, 300),
        },
        { status: 502 }
      );
    }

    // The Worker returns { url: ... }. Fall back to the text body if it's a bare URL.
    let url: string | undefined;
    try {
      url = JSON.parse(text).url;
    } catch {
      url = text.trim().startsWith("http") ? text.trim() : undefined;
    }

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Worker did not return a URL.", detail: text.slice(0, 300) },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, url, key, name: file.name });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 }
    );
  }
}
