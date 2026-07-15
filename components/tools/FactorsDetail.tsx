"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card, SectionLabel, StatusDot } from "@/components/ui";
import { IconPlay, IconPhoto } from "@/components/icons";
import { AssetUploader, Asset } from "@/components/AssetUploader";
import { fetchJson } from "@/lib/safeJson";
import { RunStatus, STATUS_META } from "@/lib/status";

// These mirror TYPE_MAP and VARIANTS in the workflow's Parse node exactly.
const TYPES = [
  { value: "text", label: "Text", w: 1080, h: 1080, keys: "underline, eyebrow" },
  { value: "quote", label: "Quote", w: 1080, h: 1080, keys: "underline, eyebrow" },
  { value: "stat", label: "Stat", w: 1080, h: 1080, keys: "stat, label" },
  { value: "testimonial", label: "Testimonial", w: 1920, h: 1080, keys: "name, role" },
  { value: "illustration", label: "Illustration", w: 1080, h: 1080, keys: "eyebrow" },
  { value: "creative-billboard", label: "Creative billboard", w: 1080, h: 1080, keys: "eyebrow" },
  { value: "billboard-wide", label: "Billboard wide", w: 1600, h: 1080, keys: "eyebrow" },
];

const VARIANTS = ["red", "teal", "amber", "green", "orange", "blue", "paper"];

interface Run {
  id: number;
  label: string;
  status: RunStatus;
  url?: string;
  error?: string;
  at: string;
}

const PLACEHOLDER = `Retention jumped 40% after switching
stat: 40%
label: retention lift`;

export function FactorsDetail() {
  const [type, setType] = useState("stat");
  const [background, setBackground] = useState("teal");
  const [content, setContent] = useState("");
  const [assets, setAssets] = useState<Asset[]>([]);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    template: string;
    timings?: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState<{ message: string; step?: string } | null>(
    null
  );
  const [runs, setRuns] = useState<Run[]>([]);

  const selected = TYPES.find((t) => t.value === type)!;
  const uploading = assets.some((a) => a.status === "uploading");

  async function runNow() {
    if (busy || !content.trim() || uploading) return;
    setBusy(true);
    setError(null);
    setResult(null);

    const id = Date.now();
    const label = content.split("\n")[0].slice(0, 40) || "Untitled";
    setRuns((prev) => [
      { id, label, status: "running", at: "now" },
      ...prev,
    ]);

    try {
      // fetchJson throws with a legible message (and carries `step`) on failure.
      const data = await fetchJson("/api/automations/factors/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          background,
          content,
          // Only completed uploads, in display order — assets[0] is the headshot.
          assets: assets.filter((a) => a.status === "done").map((a) => a.url),
        }),
      });

      setResult({
        url: data.url,
        template: data.template,
        timings: data.timings,
      });
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "success", url: data.url, at: "just now" } : r
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      const step = (e as Error & { step?: string }).step;
      setError({ message: msg, step });
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "failed", error: msg, at: "just now" } : r
        )
      );
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-[13px] " +
    "text-text placeholder:text-text-muted outline-none focus:border-primary transition-colors";

  return (
    <div>
      <header className="flex items-center gap-3 flex-wrap p-4 md:px-[22px] border-b border-border">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="w-[38px] h-[38px] rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <IconPhoto size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-[19px] font-medium leading-tight">
              Factors — branded social image
            </h1>
            <p className="text-[13px] text-text-muted mt-1">
              Fill the fields, hit Run now — the PNG comes back here.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={runNow}
          disabled={busy || !content.trim() || uploading}
          className="ml-auto shrink-0"
        >
          <IconPlay size={16} />
          {busy ? "Rendering…" : uploading ? "Uploading…" : "Run now"}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 p-4 md:p-[22px]">
        {/* ---------- INPUT ---------- */}
        <Card>
          <SectionLabel>INPUT</SectionLabel>

          <label className="block text-[13px] text-text-muted mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`${inputCls} mb-1.5`}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-[12px] text-text-muted mb-4">
            Output {selected.w}×{selected.h} · supports keys: {selected.keys}
          </p>

          <label className="block text-[13px] text-text-muted mb-1.5">
            Background
          </label>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {VARIANTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setBackground(v)}
                className={`text-xs rounded-md px-2.5 py-1 border transition-colors ${
                  background === v
                    ? "bg-primary text-white border-primary"
                    : "bg-surface2 text-text border-border hover:border-text-muted"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <label className="block text-[13px] text-text-muted mb-1.5">
            Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder={PLACEHOLDER}
            className={`${inputCls} resize-y font-mono leading-relaxed`}
          />
          <p className="text-[12px] text-text-muted mt-1.5 mb-4">
            First lines = body. Add <code className="text-text">key: value</code>{" "}
            lines for the rest.
          </p>

          <label className="block text-[13px] text-text-muted mb-1.5">
            Assets <span className="text-text-muted">(optional)</span>
          </label>
          <AssetUploader
            assets={assets}
            onChange={setAssets}
            hint={
              type === "testimonial"
                ? "First image = headshot, the rest = logos. Drag to reorder."
                : "PNG, JPG, WebP or SVG · up to 5MB each"
            }
          />
        </Card>

        {/* ---------- OUTPUT ---------- */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col">
            <SectionLabel>OUTPUT</SectionLabel>

            <div className="flex-1 flex items-center justify-center bg-surface2 rounded-[9px] min-h-[240px] overflow-hidden">
              {busy && (
                <div className="text-center px-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[13px] text-text-muted">
                    Rendering in n8n…
                  </p>
                </div>
              )}

              {!busy && error && (
                <div className="text-center px-4 py-6">
                  <p className="text-[13px] text-danger font-medium">
                    {error.step === "render"
                      ? "Render failed"
                      : error.step === "upload"
                      ? "Upload failed"
                      : "Run failed"}
                  </p>
                  <p className="text-[12px] text-text-muted mt-1.5 break-words">
                    {error.message}
                  </p>
                </div>
              )}

              {!busy && !error && result && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={result.url}
                  alt="Rendered social image"
                  className="max-w-full max-h-[320px] object-contain"
                />
              )}

              {!busy && !error && !result && (
                <div className="text-center px-4 py-6">
                  <IconPhoto size={26} className="text-text-muted mx-auto mb-2.5" />
                  <p className="text-[13px] text-text-muted">
                    Your rendered image will appear here.
                  </p>
                </div>
              )}
            </div>

            {result?.timings && (
              <p className="text-[11px] text-text-muted mt-2.5">
                render {result.timings.render}ms · upload {result.timings.upload}ms
                · total {result.timings.total}ms
              </p>
            )}

            {result && (
              <div className="flex items-center gap-2 mt-3">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-primary hover:underline truncate flex-1"
                >
                  {result.url}
                </a>
                <a
                  href={result.url}
                  download
                  className="text-[12px] text-text-muted hover:text-text shrink-0"
                >
                  Download
                </a>
              </div>
            )}
          </Card>

          <Card>
            <SectionLabel>THIS SESSION</SectionLabel>
            {runs.length === 0 ? (
              <p className="text-[13px] text-text-muted py-2">
                No runs yet. Persistent history arrives when we add the database.
              </p>
            ) : (
              runs.map((r, i) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-2.5 py-2.5 ${
                    i < runs.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <StatusDot status={r.status} />
                  <span className="text-[13px] flex-1 min-w-0 truncate">
                    {r.label}
                  </span>
                  <span
                    className={`text-[12px] shrink-0 ${STATUS_META[r.status].text}`}
                  >
                    {STATUS_META[r.status].label}
                  </span>
                  <span className="text-[12px] text-text-muted w-[62px] text-right shrink-0">
                    {r.at}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
