"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { IconPlay, IconPlus, IconFileText } from "@/components/icons";
import { fetchJson } from "@/lib/safeJson";
import {
  Voice,
  SourceDoc,
  Formality,
  emptyVoice,
  DEFAULT_TARGET_WORDS,
} from "@/lib/engine/pulse/types";

// NOTE: Voices are session-only for now. Persistent saving arrives with the
// Postgres DB (see PROJECT.md). The store interface below is deliberately thin
// so swapping useState for a DB-backed hook later touches nothing else.

const FORMALITY: Formality[] = ["casual", "balanced", "formal"];

function splitUrlsAndText(raw: string): { urls: string[]; text: string } {
  const urls: string[] = [];
  const textLines: string[] = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    // A line that is *just* a URL becomes a source to scrape; everything else
    // is treated as pasted material.
    if (/^https?:\/\/\S+$/i.test(t) || /^www\.\S+$/i.test(t)) {
      urls.push(t);
    } else {
      textLines.push(line);
    }
  }
  return { urls, text: textLines.join("\n").trim() };
}

export function PulseDetail() {
  // ---- voices (session state) ----
  const [voices, setVoices] = useState<Voice[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Voice | null>(null);

  // ---- composer ----
  const [topic, setTopic] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [material, setMaterial] = useState("");
  const [tier, setTier] = useState<"free" | "premium">("free");

  // ---- run state ----
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<"" | "scraping" | "writing">("");
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<{
    markdown: string;
    words: number;
    ms: number;
    providerLabel?: string;
    model?: string;
  } | null>(null);
  const [scrapeNotes, setScrapeNotes] = useState<SourceDoc[]>([]);
  const [copied, setCopied] = useState(false);

  const activeVoice = voices.find((v) => v.id === activeId) || null;
  const parsed = useMemo(() => splitUrlsAndText(material), [material]);

  const canRun =
    !busy && !!activeVoice && topic.trim().length > 0 && material.trim().length > 0;

  function saveVoice(v: Voice) {
    const cleaned: Voice = {
      ...v,
      name: v.name.trim() || "Untitled voice",
      samples: v.samples.map((s) => s).filter((s) => s.trim().length > 0),
    };
    setVoices((prev) => {
      const exists = prev.some((x) => x.id === cleaned.id);
      return exists
        ? prev.map((x) => (x.id === cleaned.id ? cleaned : x))
        : [...prev, cleaned];
    });
    setActiveId(cleaned.id);
    setEditing(null);
  }

  async function runNow() {
    if (!canRun || !activeVoice) return;
    setBusy(true);
    setError(null);
    setArticle(null);
    setScrapeNotes([]);

    try {
      // 1. Scrape any URLs the user pasted.
      let sources: SourceDoc[] = [];
      if (parsed.urls.length > 0) {
        setStage("scraping");
        const scraped = await fetchJson("/api/tools/pulse/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: parsed.urls }),
        });
        sources = (scraped.docs as SourceDoc[]).filter((d) => !d.error);
        setScrapeNotes((scraped.docs as SourceDoc[]).filter((d) => d.error));
      }

      // 2. Add the pasted text as its own source.
      if (parsed.text) {
        sources.push({ kind: "text", text: parsed.text });
      }

      if (sources.length === 0) {
        throw new Error(
          "No usable source material — every URL failed and no text was pasted."
        );
      }

      // 3. Generate.
      setStage("writing");
      const data = await fetchJson("/api/tools/pulse/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          primaryKeyword: primaryKeyword.trim() || undefined,
          voice: activeVoice,
          sources,
          tier,
        }),
      });

      setArticle({
        markdown: data.markdown,
        words: data.words,
        ms: data.ms,
        providerLabel: data.providerLabel,
        model: data.model,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  async function copyArticle() {
    if (!article) return;
    try {
      await navigator.clipboard.writeText(article.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can still download */
    }
  }

  function downloadArticle() {
    if (!article) return;
    const blob = new Blob([article.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.trim().slice(0, 40) || "article"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputCls =
    "w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] " +
    "text-text placeholder:text-text-faint outline-none focus:border-[var(--accent)]/40 transition-colors";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 max-w-6xl mx-auto px-5 md:px-8 py-8">
      {/* ---------------- VOICES SIDEBAR ---------------- */}
      <aside className="lg:border-r lg:border-border lg:pr-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-text-faint">
            Voices
          </p>
          <button
            type="button"
            onClick={() => setEditing(emptyVoice())}
            className="text-text-muted hover:text-text transition-colors"
            aria-label="New voice"
          >
            <IconPlus size={16} />
          </button>
        </div>

        {voices.length === 0 && !editing && (
          <p className="text-[12px] text-text-faint leading-relaxed">
            No voices yet. Add one — paste a couple of writing samples and it
            learns the style.
          </p>
        )}

        <div className="flex flex-col gap-1">
          {voices.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveId(v.id)}
              onDoubleClick={() => setEditing(v)}
              className={`text-left rounded-lg px-3 py-2 border transition-colors ${
                activeId === v.id
                  ? "border-[var(--accent)] bg-surface"
                  : "border-transparent hover:bg-surface"
              }`}
            >
              <div className="text-[13px] text-text truncate">{v.name}</div>
              <div className="text-[11px] text-text-faint">
                {v.samples.length} sample{v.samples.length === 1 ? "" : "s"} ·{" "}
                {v.formality} · {v.targetWords}w
              </div>
            </button>
          ))}
        </div>

        {voices.length > 0 && (
          <p className="text-[11px] text-text-faint mt-3 leading-relaxed">
            Double-click a voice to edit. Saved voices become permanent once the
            database is added.
          </p>
        )}
      </aside>

      {/* ---------------- MAIN ---------------- */}
      <div className="min-w-0">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-9 h-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <IconFileText size={19} />
          </span>
          <div>
            <h1 className="font-display text-[20px] font-medium leading-tight text-text">
              LinkedIn Pulse — article generator
            </h1>
            <p className="text-[13px] text-text-muted">
              Pick a voice, drop your sources, get a publish-ready article.
            </p>
          </div>
        </div>

        {editing ? (
          <VoiceEditor
            voice={editing}
            onCancel={() => setEditing(null)}
            onSave={saveVoice}
            inputCls={inputCls}
          />
        ) : (
          <>
            {/* topic */}
            <label className="block text-[12px] text-text-muted mb-1.5">
              Topic / title
            </label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Why B2B attribution is broken and how to fix it"
              className={`${inputCls} mb-4`}
            />

            <label className="block text-[12px] text-text-muted mb-1.5">
              Primary keyword <span className="text-text-faint">(optional)</span>
            </label>
            <input
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              placeholder="e.g. multi-touch attribution"
              className={`${inputCls} mb-4`}
            />

            {/* flexible material box */}
            <label className="block text-[12px] text-text-muted mb-1.5">
              Source material
            </label>
            <textarea
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              rows={8}
              placeholder={
                "Paste any number of blog URLs (one per line) and/or dump raw notes, transcripts, or article text.\n\nhttps://example.com/post-one\nhttps://example.com/post-two\n\nOr just paste everything you want the article to cover…"
              }
              className={`${inputCls} resize-y leading-relaxed font-mono text-[12px]`}
            />
            <p className="text-[11px] text-text-faint mt-1.5">
              {parsed.urls.length > 0 && (
                <>
                  {parsed.urls.length} URL
                  {parsed.urls.length === 1 ? "" : "s"} to scrape
                </>
              )}
              {parsed.urls.length > 0 && parsed.text && " · "}
              {parsed.text && `${parsed.text.split(/\s+/).length} words pasted`}
              {!parsed.urls.length && !parsed.text && "URLs get scraped; text is used as-is."}
            </p>

            {!activeVoice && voices.length > 0 && (
              <p className="text-[12px] text-warn mt-4">
                Pick a voice from the left first.
              </p>
            )}

            <div className="mt-5 mb-3">
              <label className="block text-[12px] text-text-muted mb-1.5">
                Model
              </label>
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setTier("free")}
                  className={`text-[12px] px-3 py-1.5 transition-colors ${
                    tier === "free"
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setTier("premium")}
                  className={`text-[12px] px-3 py-1.5 border-l border-border transition-colors ${
                    tier === "premium"
                      ? "bg-[var(--accent)] text-[var(--on-accent)]"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  Premium (Claude)
                </button>
              </div>
              <p className="text-[11px] text-text-faint mt-1.5">
                {tier === "free"
                  ? "Free open model — no cost, may be rate-limited under load."
                  : "Claude — higher quality, uses paid API credits."}
              </p>
            </div>

            <Button
              variant="primary"
              onClick={runNow}
              disabled={!canRun}
            >
              <IconPlay size={15} />
              {stage === "scraping"
                ? "Reading sources…"
                : stage === "writing"
                ? "Writing…"
                : "Generate article"}
            </Button>

            {/* scrape failures */}
            {scrapeNotes.length > 0 && (
              <div className="mt-4 border border-border rounded-lg p-3">
                <p className="text-[12px] text-warn mb-1.5">
                  Couldn&apos;t read {scrapeNotes.length} source
                  {scrapeNotes.length === 1 ? "" : "s"} — paste their text into
                  the box instead:
                </p>
                {scrapeNotes.map((d, i) => (
                  <p key={i} className="text-[11px] text-text-faint truncate">
                    {d.url} — {d.error}
                  </p>
                ))}
              </div>
            )}

            {error && (
              <p className="text-[13px] text-danger mt-4">{error}</p>
            )}

            {/* article output */}
            {article && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-text-faint">
                    Article · {article.words} words ·{" "}
                    {(article.ms / 1000).toFixed(1)}s
                    {article.providerLabel ? ` · ${article.providerLabel}` : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copyArticle}
                      className="text-[12px] text-text-muted hover:text-text transition-colors"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadArticle}
                      className="text-[12px] text-text-muted hover:text-text transition-colors"
                    >
                      Download .md
                    </button>
                  </div>
                </div>
                <div className="border border-border rounded-xl p-5 bg-surface max-h-[600px] overflow-auto">
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-text">
                    {article.markdown}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- voice editor ----------------
function VoiceEditor({
  voice,
  onSave,
  onCancel,
  inputCls,
}: {
  voice: Voice;
  onSave: (v: Voice) => void;
  onCancel: () => void;
  inputCls: string;
}) {
  const [draft, setDraft] = useState<Voice>(voice);

  function setSample(i: number, value: string) {
    setDraft((d) => {
      const samples = [...d.samples];
      samples[i] = value;
      return { ...d, samples };
    });
  }

  return (
    <div className="border border-border rounded-xl p-5">
      <p className="text-[10px] uppercase tracking-[0.16em] text-text-faint mb-4">
        {voice.name ? "Edit voice" : "New voice"}
      </p>

      <label className="block text-[12px] text-text-muted mb-1.5">Name</label>
      <input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        placeholder="e.g. My LinkedIn voice"
        className={`${inputCls} mb-4`}
      />

      <label className="block text-[12px] text-text-muted mb-1.5">
        Writing samples{" "}
        <span className="text-text-faint">
          — paste 1–3 things you&apos;ve written
        </span>
      </label>
      <div className="flex flex-col gap-2 mb-2">
        {draft.samples.map((s, i) => (
          <textarea
            key={i}
            value={s}
            onChange={(e) => setSample(i, e.target.value)}
            rows={4}
            placeholder={`Sample ${i + 1} — a post, an email, anything in your voice`}
            className={`${inputCls} resize-y leading-relaxed`}
          />
        ))}
      </div>
      {draft.samples.length < 3 && (
        <button
          type="button"
          onClick={() => setDraft({ ...draft, samples: [...draft.samples, ""] })}
          className="text-[12px] text-text-muted hover:text-text transition-colors mb-4"
        >
          + Add another sample
        </button>
      )}

      <div className="flex gap-4 mt-2 mb-5">
        <div className="flex-1">
          <label className="block text-[12px] text-text-muted mb-1.5">
            Formality
          </label>
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            {FORMALITY.map((f, i) => (
              <button
                key={f}
                type="button"
                onClick={() => setDraft({ ...draft, formality: f })}
                className={`text-[12px] px-3 py-1.5 capitalize transition-colors ${
                  i > 0 ? "border-l border-border" : ""
                } ${
                  draft.formality === f
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="w-32">
          <label className="block text-[12px] text-text-muted mb-1.5">
            Target words
          </label>
          <input
            type="number"
            value={draft.targetWords}
            onChange={(e) =>
              setDraft({
                ...draft,
                targetWords: Math.max(
                  300,
                  Math.min(4000, Number(e.target.value) || DEFAULT_TARGET_WORDS)
                ),
              })
            }
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={() => onSave(draft)}>
          Save voice
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] text-text-muted hover:text-text px-3 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
