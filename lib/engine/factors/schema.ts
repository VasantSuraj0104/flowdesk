// What each post type actually needs.
//
// Derived from the workflow's TYPE_MAP (template + dimensions) and the Code
// node's KEYS map (which "key: value" lines the parser understands).
//
// NOTE: `text` and `quote` both mapped to tpl "quote" at 1080×1080 — literally
// the same render. `quote` was redundant and has been removed.

export type AssetRule = "none" | "optional" | "required";

export interface FieldDef {
  /** The parser key, e.g. "stat" -> a "stat: ..." line in content. */
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
}

export interface TypeSchema {
  value: string;
  label: string;
  w: number;
  h: number;
  /** Body textarea copy. */
  bodyLabel: string;
  bodyPlaceholder: string;
  fields: FieldDef[];
  assets: AssetRule;
  assetsHint?: string;
  /** Billboards ignore the colour variant, so we hide the picker. */
  background: boolean;
}

const CTA: FieldDef = {
  key: "cta",
  label: "Footer / CTA",
  placeholder: "www.factors.ai",
  hint: "Defaults to www.factors.ai",
};

const EYEBROW: FieldDef = {
  key: "eyebrow",
  label: "Eyebrow",
  placeholder: "GTM truths",
  hint: "Small label above the body",
};

const UNDERLINE: FieldDef = {
  key: "underline",
  label: "Underline",
  placeholder: "your belief",
  hint: "Must appear word-for-word in the body, or it's ignored",
};

export const TYPE_SCHEMAS: TypeSchema[] = [
  {
    value: "text",
    label: "Text post",
    w: 1080,
    h: 1080,
    bodyLabel: "Body",
    bodyPlaceholder: "Your pipeline review reflects your belief, not the reality.",
    fields: [UNDERLINE, EYEBROW, CTA],
    assets: "none",
    background: true,
  },
  {
    value: "stat",
    label: "Stat",
    w: 1080,
    h: 1080,
    bodyLabel: "Body",
    bodyPlaceholder: "From first touch to closed-won, attribution in seconds.",
    fields: [
      { key: "stat", label: "Stat", placeholder: "600+", hint: "The big number" },
      {
        key: "label",
        label: "Stat label",
        placeholder: "B2B GTM teams run on Factors",
        hint: "Caption under the number",
      },
      UNDERLINE,
      EYEBROW,
      CTA,
    ],
    assets: "optional",
    background: true,
  },
  {
    value: "testimonial",
    label: "Testimonial",
    w: 1920,
    h: 1080,
    bodyLabel: "Quote",
    bodyPlaceholder:
      "Factors.ai gives us deeper insights, turning data into a story we can present to the CFO.",
    fields: [
      { key: "name", label: "Name", placeholder: "Sunny Singh" },
      {
        key: "role",
        label: "Role",
        placeholder: "Head of Digital Marketing & Content, Zembl",
      },
      CTA,
    ],
    assets: "optional",
    assetsHint: "First image = headshot, the rest = logos. Reorder with ↑ ↓.",
    background: true,
  },
  {
    value: "illustration",
    label: "Illustration",
    w: 1080,
    h: 1080,
    bodyLabel: "Body",
    bodyPlaceholder: "Ship the boring thing first.",
    fields: [EYEBROW, CTA],
    assets: "optional",
    background: true,
  },
  {
    value: "creative-billboard",
    label: "Creative billboard",
    w: 1080,
    h: 1080,
    bodyLabel: "Headline",
    bodyPlaceholder: "Your data already knows. Ask it.",
    fields: [EYEBROW, CTA],
    assets: "required",
    assetsHint: "At least one image is required for this layout.",
    background: false,
  },
  {
    value: "billboard-wide",
    label: "Billboard wide",
    w: 1600,
    h: 1080,
    bodyLabel: "Headline",
    bodyPlaceholder: "One dashboard. Every automation. Zero tabs.",
    fields: [EYEBROW, CTA],
    assets: "required",
    assetsHint: "At least one image is required for this layout.",
    background: false,
  },
];

export function getSchema(value: string): TypeSchema {
  return TYPE_SCHEMAS.find((t) => t.value === value) ?? TYPE_SCHEMAS[0];
}

/**
 * Turn the structured fields back into the `content` string the parser expects:
 * body lines first, then "key: value" lines. This keeps parse.ts byte-identical
 * to the n8n Code node — the form is just a friendlier way to author the string.
 */
export function buildContent(
  body: string,
  fields: Record<string, string>,
  schema: TypeSchema
): string {
  const lines: string[] = [];
  const trimmedBody = body.trim();
  if (trimmedBody) lines.push(trimmedBody);

  for (const def of schema.fields) {
    const v = (fields[def.key] ?? "").trim();
    if (v) lines.push(`${def.key}: ${v}`);
  }
  return lines.join("\n");
}
