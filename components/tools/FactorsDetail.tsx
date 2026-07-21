"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card, SectionLabel, StatusDot } from "@/components/ui";
import { IconPlay, IconPhoto } from "@/components/icons";
import { FactorsLogo } from "@/components/FactorsLogo";
import { AssetUploader, Asset } from "@/components/AssetUploader";
import { fetchJson } from "@/lib/safeJson";
import {
  TYPE_SCHEMAS,
  getSchema,
  buildContent,
} from "@/lib/engine/factors/schema";
import { RunStatus, STATUS_META } from "@/lib/status";

const VARIANTS = ["red", "teal", "amber", "green", "orange", "blue", "paper"];

interface Run {
  id: number;
  label: string;
  status: RunStatus;
  at: string;
}

export function FactorsDetail() {
  const [type, setType] = useState("stat");
  const [background, setBackground] = useState("teal");
  const [body, setBody] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<Asset[]>([]);

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    template: string;
    timings?: Record<string, number>;
    engine?: string;
  } | null>(null);
  const [error, setError] = useState<{ message: string; step?: string } | null>(
    null
  );
  const [runs, setRuns] = useState<Run[]>([]);

  const schema = getSchema(type);
  const uploading = assets.some((a) => a.status === "uploading");
  const doneAssets = assets.filter((a) => a.status === "done");

  // Types that take no images shouldn't silently carry uploads across a switch.
  function changeType(next: string) {
    setType(next);
    if (getSchema(next).assets === "none") setAssets([]);
  }

  const missingAssets = schema.assets === "required" && doneAssets.length === 0;

  // The parser drops an underline that doesn't appear verbatim in the body,
  // so warn rather than let it silently vanish from the render.
  const underlineValue = (fields.underline ?? "").trim();
  const underlineMissing =
    underlineValue.length > 0 && !body.includes(underlineValue);

  const canRun =
    !busy && !uploading && body.trim().length > 0 && !missingAssets;

  async function runNow() {
    if (!canRun) return;
    setBusy(true);
    setError(null);
    setResult(null);

    const id = Date.now();
    const label = body.trim().split("\n")[0].slice(0, 40) || "Untitled";
    setRuns((prev) => [{ id, label, status: "running", at: "now" }, ...prev]);

    try {
      const data = await fetchJson("/api/automations/factors/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          // Billboards ignore the variant, but the engine still expects a valid
          // one — send the default rather than an empty string.
          background: schema.background ? background : "teal",
          content: buildContent(body, fields, schema),
          assets: doneAssets.map((a) => a.url),
        }),
      });

      setResult({
        url: data.url,
        template: data.template,
        timings: data.timings,
        engine: data.engine,
      });
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "success", at: "just now" } : r
        )
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      const step = (e as Error & { step?: string }).step;
      setError({ message: msg, step });
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "failed", at: "just now" } : r
        )
      );
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full bg-surface2 border border-border rounded-lg px-3 py-2 text-[13px] " +
    "text-text placeholder:text-text-muted outline-none focus:border-white/30 transition-colors";

  return (
    <div>
      <header className="flex items-center gap-3 flex-wrap p-4 md:px-[22px] border-b border-border">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="w-[38px] h-[38px] rounded-[10px] bg-[#FC3B2D]/10 flex items-center justify-center shrink-0">
            <FactorsLogo size={20} />
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
          disabled={!canRun}
          className="ml-auto shrink-0"
        >
          <IconPlay size={16} />
          {busy ? "Rendering…" : uploading ? "Uploading…" : "Run now"}
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 p-4 md:p-[22px]">
        {/* ---------------- INPUT ---------------- */}
        <Card>
          <SectionLabel>INPUT</SectionLabel>

          <label className="block text-[13px] text-text-muted mb-1.5">Type</label>
          <select
            value={type}
            onChange={(e) => changeType(e.target.value)}
            className={`${inputCls} mb-1.5`}
          >
            {TYPE_SCHEMAS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-[12px] text-text-muted mb-4">
            Output {schema.w}×{schema.h}
          </p>

          {/* Billboards ignore the colour variant, so the picker is hidden. */}
          {schema.background && (
            <>
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
                        ? "bg-white text-ink border-white"
                        : "bg-surface2 text-text border-border hover:border-text-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="block text-[13px] text-text-muted mb-1.5">
            {schema.bodyLabel}
            <span className="text-danger ml-0.5">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder={schema.bodyPlaceholder}
            className={`${inputCls} resize-y leading-relaxed mb-4`}
          />

          {schema.fields.map((f) => (
            <div key={f.key} className="mb-4">
              <label className="block text-[13px] text-text-muted mb-1.5">
                {f.label}
              </label>
              <input
                value={fields[f.key] ?? ""}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                placeholder={f.placeholder}
                className={inputCls}
              />
              {f.key === "underline" && underlineMissing ? (
                <p className="text-[12px] text-warn mt-1.5">
                  Not found in the body — it won&apos;t be underlined.
                </p>
              ) : f.hint ? (
                <p className="text-[12px] text-text-muted mt-1.5">{f.hint}</p>
              ) : null}
            </div>
          ))}

          {schema.assets !== "none" && (
            <>
              <label className="block text-[13px] text-text-muted mb-1.5">
                Assets
                {schema.assets === "required" ? (
                  <span className="text-danger ml-0.5">*</span>
                ) : (
                  <span className="text-text-muted"> (optional)</span>
                )}
              </label>
              <AssetUploader
                assets={assets}
                onChange={setAssets}
                hint={schema.assetsHint}
              />
              {missingAssets && (
                <p className="text-[12px] text-warn mt-1.5">
                  This layout needs at least one image.
                </p>
              )}
            </>
          )}
        </Card>

        {/* ---------------- OUTPUT ---------------- */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col">
            <SectionLabel>OUTPUT</SectionLabel>

            <div
              className="flex-1 flex items-center justify-center bg-surface2 rounded-[9px] overflow-hidden"
              style={{ aspectRatio: `${schema.w} / ${schema.h}` }}
            >
              {busy && (
                <div className="text-center px-4">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-[13px] text-text-muted">Rendering…</p>
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
                  className="w-full h-full object-contain"
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

            {result && (result.timings || result.engine) && (
              <p className="text-[11px] text-text-muted mt-2.5">
                {result.engine === "local" ? "flowdesk engine" : "n8n"}
                {result.timings
                  ? ` · render ${result.timings.render}ms · upload ${result.timings.upload}ms · total ${result.timings.total}ms`
                  : ""}
              </p>
            )}

            {result && (
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-white hover:underline truncate flex-1"
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
