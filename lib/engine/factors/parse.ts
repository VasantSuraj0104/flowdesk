// Direct port of the n8n "Parse prompt + content → render job" Code node.
// Kept deliberately faithful: same TYPE_MAP, same VARIANTS, same content
// parsing, same query-string construction. If you change one, change both.

export const TEMPLATE_BASE_URL =
  process.env.FACTORS_TEMPLATE_BASE_URL ??
  "https://factors-templates.small-band-469e.workers.dev";

export const TYPE_MAP: Record<string, { tpl: string; w: number; h: number }> = {
  // `text` and `quote` are the same render (same template, same size). The form
  // only offers "Text post", but `quote` stays here because existing Notion rows
  // use it and the scheduled path must keep working.
  text: { tpl: "quote", w: 1080, h: 1080 },
  quote: { tpl: "quote", w: 1080, h: 1080 },
  stat: { tpl: "stat", w: 1080, h: 1080 },
  testimonial: { tpl: "testimonial", w: 1920, h: 1080 },
  illustration: { tpl: "illustration", w: 1080, h: 1080 },
  "creative-billboard": { tpl: "creative-billboard", w: 1080, h: 1080 },
  "billboard-wide": { tpl: "billboard-wide", w: 1600, h: 1080 },
};

export const VARIANTS = [
  "red",
  "teal",
  "amber",
  "green",
  "orange",
  "blue",
  "paper",
] as const;

export interface ParseInput {
  type?: string;
  background?: string;
  content?: string;
  assets?: string[];
  id?: string;
}

export interface RenderJob {
  pageId: string;
  type: string;
  template: string;
  variant: string;
  w: number;
  h: number;
  fields: Fields;
  renderUrl: string;
  browserless: BrowserlessPayload;
  imgKey: string;
}

interface Fields {
  body: string;
  underline: string;
  eyebrow: string;
  stat: string;
  stat_label: string;
  name: string;
  role: string;
  footer: string;
}

export interface BrowserlessPayload {
  url: string;
  options: { type: string; fullPage: boolean };
  viewport: { width: number; height: number; deviceScaleFactor: number };
  gotoOptions: { waitUntil: string };
}

// "key: value" lines map onto these field names (matches the Code node's KEYS).
const KEYS: Record<string, keyof Fields> = {
  underline: "underline",
  eyebrow: "eyebrow",
  stat: "stat",
  label: "stat_label",
  name: "name",
  role: "role",
  cta: "footer",
  footer: "footer",
};

export function parseRenderJob(input: ParseInput): RenderJob {
  const typeRaw = String(input.type || "text").toLowerCase().trim();
  const bgRaw = String(input.background || "teal").toLowerCase().trim();
  const contentRaw = String(input.content ?? "");
  const assets = Array.isArray(input.assets) ? input.assets.filter(Boolean) : [];

  const t = TYPE_MAP[typeRaw] || TYPE_MAP.text;
  const variant = (VARIANTS as readonly string[]).includes(bgRaw) ? bgRaw : "teal";
  const { w, h } = t;

  const fields: Fields = {
    body: "",
    underline: "",
    eyebrow: "",
    stat: "",
    stat_label: "",
    name: "",
    role: "",
    footer: "www.factors.ai",
  };

  const bodyLines: string[] = [];
  contentRaw.split("\n").forEach((line) => {
    const m = line.match(/^\s*([a-zA-Z ]+):\s*(.+)$/);
    const key = m ? KEYS[m[1].trim().toLowerCase()] : undefined;
    if (m && key) {
      fields[key] = m[2].trim();
    } else if (line.trim()) {
      bodyLines.push(line.trim());
    }
  });
  fields.body = bodyLines.join(" ");

  // underline only renders if the phrase actually appears in the body
  if (fields.underline && fields.body.indexOf(fields.underline) < 0) {
    fields.underline = "";
  }

  const params: Record<string, string> = {
    variant,
    w: String(w),
    h: String(h),
    body: fields.body,
    underline: fields.underline,
    eyebrow: fields.eyebrow,
    stat: fields.stat,
    stat_label: fields.stat_label,
    foot: fields.footer,
    name: fields.name,
    role: fields.role,
    assets: assets.join(","), // engine classifies headshot vs logos
    partner: assets[0] || "", // back-compat
  };

  // URLSearchParams is available here (unlike the n8n sandbox), but we keep the
  // same encoding behaviour to guarantee identical output URLs.
  const qs = Object.keys(params)
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k] ?? "")}`)
    .join("&");

  const renderUrl = `${TEMPLATE_BASE_URL}/${t.tpl}.html?${qs}`;

  const browserless: BrowserlessPayload = {
    url: renderUrl,
    options: { type: "png", fullPage: false },
    viewport: { width: w, height: h, deviceScaleFactor: 2 },
    gotoOptions: { waitUntil: "networkidle0" },
  };

  const pageId = input.id || `manual-${Date.now()}`;
  const imgKey = `${pageId}-${Date.now()}.png`.replace(/[^a-zA-Z0-9._-]/g, "_");

  return {
    pageId,
    type: typeRaw,
    template: t.tpl,
    variant,
    w,
    h,
    fields,
    renderUrl,
    browserless,
    imgKey,
  };
}
