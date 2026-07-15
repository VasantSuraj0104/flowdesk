/**
 * fetch + parse JSON, but fail with a legible message when the server returns
 * HTML (a 404 page, a gateway error, a platform error) instead of JSON.
 *
 * Without this you get "Unexpected token '<', "<!DOCTYPE "... is not valid JSON",
 * which tells the user nothing. This says "Endpoint not found (404)" instead.
 */
export async function fetchJson(
  input: string,
  init?: RequestInit
): Promise<any> {
  const res = await fetch(input, init);
  const text = await res.text();

  const looksLikeHtml =
    text.trimStart().startsWith("<") ||
    (res.headers.get("content-type") ?? "").includes("text/html");

  if (looksLikeHtml || res.status === 413) {
    if (res.status === 404) {
      throw new Error(`Endpoint not found (404) — ${input} isn't deployed yet.`);
    }
    // Vercel returns a plain-text "Request Entity Too Large" body, not JSON.
    if (res.status === 413 || /request entity too large/i.test(text)) {
      throw new Error("File too large for the server (4.5MB request limit).");
    }
    throw new Error(
      `Server returned an error page (${res.status}) instead of JSON.`
    );
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned invalid JSON (${res.status}): ${text.slice(0, 120)}`
    );
  }

  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    (err as Error & { step?: string }).step = data?.step;
    throw err;
  }

  return data;
}
