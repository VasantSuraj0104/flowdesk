// Types for the LinkedIn Pulse article generator.
//
// The original n8n workflow hardcoded one author's voice ("Vrushti") and pulled
// exactly 3 blogs from Webflow. This generic version makes the voice a saved,
// swappable profile and lets the user bring any number of sources (URLs to
// scrape and/or pasted text).

export type Formality = "casual" | "balanced" | "formal";

export interface Voice {
  id: string;
  name: string;
  /** 1–3 pasted writing samples. The primary signal for the model. */
  samples: string[];
  /** Light guardrails layered on top of the inferred voice. */
  formality: Formality;
  /** Target article length in words. */
  targetWords: number;
  createdAt: number;
}

export interface SourceDoc {
  /** Where it came from: a scraped URL or pasted text. */
  kind: "url" | "text";
  url?: string;
  title?: string;
  text: string;
  /** Populated when a URL scrape failed, so the UI can prompt for a paste. */
  error?: string;
}

export interface GenerateInput {
  topic: string;
  /** Optional SEO hints — kept from the original prompt's input contract. */
  primaryKeyword?: string;
  secondaryKeywords?: string;
  voice: Voice;
  sources: SourceDoc[];
}

export const DEFAULT_TARGET_WORDS = 1400;

export function emptyVoice(): Voice {
  return {
    id: `voice-${Date.now()}`,
    name: "",
    samples: [""],
    formality: "balanced",
    targetWords: DEFAULT_TARGET_WORDS,
    createdAt: Date.now(),
  };
}
