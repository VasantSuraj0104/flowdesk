import { SourceDoc } from "./types";

// Best-effort article extraction. No headless browser — a plain fetch plus
// HTML-to-text cleanup handles most public blog URLs. When a page is
// JS-rendered, paywalled, or blocks bots, we return an error on that ONE source
// so the UI can ask the user to paste its text instead. One bad URL never sinks
// the whole run.

const FETCH_TIMEOUT = 12_000;
const MAX_CHARS = 12_000; // plenty for synthesis; keeps token cost sane

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string | undefined {
  const og = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  );
  if (og) return og[1].trim();
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return t ? t[1].trim() : undefined;
}

// Prefer the <article> or <main> region if present — it's usually the body and
// skips nav/footer/sidebar noise. Fall back to the whole document.
function mainRegion(html: string): string {
  const article = html.match(/<article[\s\S]*?<\/article>/i);
  if (article && article[0].length > 200) return article[0];
  const main = html.match(/<main[\s\S]*?<\/main>/i);
  if (main && main[0].length > 200) return main[0];
  return html;
}

export async function scrapeUrl(url: string): Promise<SourceDoc> {
  const base: SourceDoc = { kind: "url", url, text: "" };

  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(normalized, {
      signal: ctrl.signal,
      headers: {
        // Some sites 403 an obviously-bot UA. A browser-like UA gets most
        // public blogs; we still fail gracefully when it doesn't.
        "User-Agent":
          "Mozilla/5.0 (compatible; flowdesk-reader/1.0; +https://flowdesk.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { ...base, error: `Couldn't fetch (HTTP ${res.status})` };
    }

    const ctype = res.headers.get("content-type") ?? "";
    if (!ctype.includes("html") && !ctype.includes("text")) {
      return { ...base, error: `Not an article (${ctype || "unknown type"})` };
    }

    const html = await res.text();
    const title = extractTitle(html);
    let text = stripHtml(mainRegion(html));

    if (text.length < 200) {
      return {
        ...base,
        title,
        error: "Page has little readable text (may be JS-rendered).",
      };
    }

    if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + " …";

    return { ...base, title, text };
  } catch (err) {
    const msg =
      err instanceof Error && err.name === "AbortError"
        ? "Timed out"
        : err instanceof Error
        ? err.message
        : "Fetch failed";
    return { ...base, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

export async function scrapeAll(urls: string[]): Promise<SourceDoc[]> {
  // Parallel, but each resolves to its own success/error doc.
  return Promise.all(urls.map((u) => scrapeUrl(u)));
}
