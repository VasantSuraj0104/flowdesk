import { GenerateInput, Formality } from "./types";

// The master prompt, generalized from the n8n "Vrushti Blog Generator v4".
//
// What we KEPT (universally good, author-independent):
//   - the structure: TL;DR → hook → body → "in a nutshell" → FAQs
//   - the sentence/paragraph rules that kill AI-tells (contractions, no
//     one-sentence paragraphs, no em-dashes, flow requirements)
//   - the banned-phrase list and "patterns to avoid"
//   - sentence-case conversational headers
//
// What we REPLACED (was hardcoded to one author):
//   - "ghostwriting for Vrushti Oza" → "match the voice in these SAMPLES"
//   - the fixed B2B-SaaS framing → neutral; the samples set the domain
//   - the 3-blog Webflow cluster → arbitrary user SOURCES injected below

const FORMALITY_NOTE: Record<Formality, string> = {
  casual:
    "Lean casual: contractions everywhere, direct address, the occasional short aside. Never stiff.",
  balanced:
    "Balanced professional: warm and clear, contractions throughout, but credible enough for a work audience.",
  formal:
    "Lean formal: still human and contraction-friendly, but measured, precise, and restrained with humour.",
};

export function buildMessages(input: GenerateInput): Array<{
  role: "user";
  content: string;
}> {
  const { topic, primaryKeyword, secondaryKeywords, voice, sources } = input;

  const samples = voice.samples
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => `--- WRITING SAMPLE ${i + 1} ---\n${s}`)
    .join("\n\n");

  const sourceText = sources
    .map((s, i) => {
      const head = s.title || s.url || `Source ${i + 1}`;
      return `--- SOURCE ${i + 1}: ${head} ---\n${s.text.trim()}`;
    })
    .join("\n\n");

  const system = `You are an expert ghostwriter. Your single most important job is to write a complete, publish-ready long-form article in the EXACT voice demonstrated by the writing samples provided, synthesising the source material into one coherent piece.

Work through these phases internally. Output ONLY the finished article in Markdown — no preamble, no notes, no intermediate work.

### PHASE 1 — Absorb the voice
Study the writing samples closely. They are the single source of truth for HOW to write: sentence rhythm, vocabulary, level of formality, use of humour, how ideas are introduced and connected. Imitate this voice faithfully. Do not impose a generic "blog" voice over it.
${FORMALITY_NOTE[voice.formality]}

### PHASE 2 — Synthesise the sources
Read every source. Find the through-line that connects them and build ONE article around ${topic}. Do not summarise each source in turn. Blend them: merge overlapping points, resolve contradictions, and organise by idea, not by source. Pull specific facts, examples, and data from the sources rather than inventing them.

### PHASE 3 — Structure
Write the article in this order:
1. TL;DR at the very top — a concise 5–7 bullet summary of the key takeaways.
2. A hook immediately after — a real, relatable scenario, not a dictionary definition or generic intro.
3. Body sections with conversational, sentence-case H2 headers (## ). Headers must signal what the reader will learn. How-to / process headers can end with a question mark. Never bold headers.
4. An "In a nutshell" conclusion BEFORE the FAQs — a genuine summary of key insights and a clear next step, never vague philosophy.
5. FAQs as the final section.
Each section must build on the last and answer a different reader question. No redundancy.

### PHASE 4 — Voice & anti-AI rules (non-negotiable)
- Use contractions throughout (don't, can't, it's, you've). Formal uncontracted writing reads as AI.
- No one-sentence paragraphs. Every paragraph is 2–4 sentences carrying one idea.
- No sentence shorter than four words or longer than 30. Split long sentences.
- Never use em dashes. Use commas, periods, or restructure.
- Vary sentence length; avoid runs of similar-length sentences.
- Every sentence must flow naturally from the previous one. This matters more than anything else.
- When a technical term appears, simplify it immediately in the same sentence.

### Patterns to DELETE (major AI tells)
- Short disconnected sentences ("This matters. Here's why. Let's dive in.").
- "Not this... but that" and "It's not about X, it's about Y" formations — especially in conclusions.
- Repetitive paragraph openings (don't start 3+ paragraphs with the same word).
- Filler sentences that add no value; generic phrasing that could apply to any topic.

### BANNED phrases
"In today's fast-paced digital landscape", "businesses must leverage", "unlock the power of", "game-changing", "revolutionary approach", "Furthermore", "Additionally", "Moreover", "Let's dive in", "Here's why", "Here's the thing", "In conclusion", and any vague philosophical conclusion.

### Length
Target ${voice.targetWords} words. Write in flowing prose, not listicle format.`;

  const user = `Write the article now.

TOPIC / TITLE: ${topic}
${primaryKeyword ? `PRIMARY KEYWORD: ${primaryKeyword}` : ""}
${secondaryKeywords ? `SECONDARY KEYWORDS: ${secondaryKeywords}` : ""}

========================================
THE VOICE TO MATCH (imitate this writing):
========================================
${samples || "(no samples provided — write in a clear, human, contraction-friendly voice)"}

========================================
SOURCE MATERIAL (synthesise all of this):
========================================
${sourceText || "(no sources provided — write from the topic alone)"}

Remember: output ONLY the finished article in Markdown, starting with the TL;DR.`;

  // Anthropic's API takes a top-level `system`, but to keep this portable and
  // easy to log, we fold the system instructions into the first user turn's
  // companion field. The route sends `system` separately (see generate route).
  return [{ role: "user", content: `${system}\n\n${user}` }];
}

// Exposed so the route can send a proper top-level system prompt too.
export function buildSystemAndUser(input: GenerateInput): {
  system: string;
  user: string;
} {
  const combined = buildMessages(input)[0].content;
  const [system, ...rest] = combined.split("\n\nWrite the article now.");
  return {
    system,
    user: `Write the article now.${rest.join("\n\nWrite the article now.")}`,
  };
}
