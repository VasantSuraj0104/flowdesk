import { BrowserlessPayload } from "./parse";

// Errors carry the step that failed, so the UI can say "Render failed"
// instead of a generic 500 — the main thing n8n was hiding from us.
export type Step = "render" | "upload";

export class EngineError extends Error {
  constructor(
    public step: Step,
    message: string,
    public status?: number,
    public detail?: string
  ) {
    super(message);
    this.name = "EngineError";
  }
}

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => clearTimeout(t) };
}

/** POST the browserless payload to the Chromium service, get PNG bytes back. */
export async function renderPng(
  payload: BrowserlessPayload,
  timeoutMs = 45_000
): Promise<ArrayBuffer> {
  const url = process.env.FACTORS_RENDER_URL;
  if (!url) {
    throw new EngineError("render", "FACTORS_RENDER_URL is not set.");
  }

  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new EngineError(
        "render",
        `Chromium service returned ${res.status}`,
        res.status,
        detail.slice(0, 300)
      );
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) {
      throw new EngineError("render", "Chromium returned an empty image.");
    }
    return buf;
  } catch (err) {
    if (err instanceof EngineError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new EngineError(
        "render",
        `Render timed out after ${timeoutMs / 1000}s.`
      );
    }
    throw new EngineError(
      "render",
      err instanceof Error ? err.message : "Render failed."
    );
  } finally {
    cancel();
  }
}

/** PUT the PNG to the Cloudflare Worker, get the public URL back. */
export async function uploadPng(
  bytes: ArrayBuffer,
  imgKey: string,
  timeoutMs = 20_000
): Promise<string> {
  const base = process.env.CLOUDFLARE_IMAGES_URL;
  const auth = process.env.CLOUDFLARE_IMAGES_AUTH;
  if (!base || !auth) {
    throw new EngineError(
      "upload",
      "CLOUDFLARE_IMAGES_URL / CLOUDFLARE_IMAGES_AUTH are not set."
    );
  }

  const { signal, cancel } = withTimeout(timeoutMs);
  try {
    const res = await fetch(
      `${base.replace(/\/$/, "")}/upload?key=${encodeURIComponent(imgKey)}`,
      {
        method: "PUT",
        headers: { "x-auth": auth, "Content-Type": "image/png" },
        body: bytes,
        signal,
        cache: "no-store",
      }
    );

    const text = await res.text();

    if (!res.ok) {
      throw new EngineError(
        "upload",
        `Worker returned ${res.status}`,
        res.status,
        text.slice(0, 300)
      );
    }

    let url: string | undefined;
    try {
      url = JSON.parse(text).url;
    } catch {
      url = text.trim().startsWith("http") ? text.trim() : undefined;
    }

    if (!url) {
      throw new EngineError(
        "upload",
        "Worker did not return a URL.",
        undefined,
        text.slice(0, 300)
      );
    }
    return url;
  } catch (err) {
    if (err instanceof EngineError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new EngineError(
        "upload",
        `Upload timed out after ${timeoutMs / 1000}s.`
      );
    }
    throw new EngineError(
      "upload",
      err instanceof Error ? err.message : "Upload failed."
    );
  } finally {
    cancel();
  }
}
