"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Card, Chip, Pill, SectionLabel, StatusDot } from "@/components/ui";
import { IconSettings, IconPlay } from "@/components/icons";
import { RunStatus, STATUS_META } from "@/lib/status";

const CONFIG = [
  { k: "Notion database", v: "Social Creatives" },
  { k: "Trigger", v: "Schedule · 2 min" },
  { k: "Runs when", v: "generate = true · image empty" },
  { k: "Render service", v: "Browserless · Chromium" },
  { k: "Storage", v: "Cloudflare KV" },
];

const TEMPLATE_TYPES = [
  "quote",
  "stat",
  "testimonial",
  "illustration",
  "creative-billboard",
  "billboard-wide",
];
const VARIANTS = ["red", "teal", "amber", "green", "orange", "blue", "paper"];

interface Run {
  id: number;
  name: string;
  status: RunStatus;
  time: string;
}

const INITIAL_RUNS: Run[] = [
  { id: 1, name: "Q3 retention stat", status: "success", time: "2m" },
  { id: 2, name: "Customer testimonial", status: "running", time: "now" },
  { id: 3, name: "Launch billboard-wide", status: "success", time: "14m" },
  { id: 4, name: "Founder quote", status: "failed", time: "1h" },
  { id: 5, name: "Weekly stat card", status: "success", time: "2h" },
];

export function FactorsDetail() {
  const [runs, setRuns] = useState<Run[]>(INITIAL_RUNS);
  const [busy, setBusy] = useState(false);

  // Manual start point. This is where the real POST to the n8n webhook goes:
  //   await fetch("/api/automations/factors/run", { method: "POST" })
  // For now we optimistically add a run and simulate completion so the UI is live.
  function runNow() {
    if (busy) return;
    setBusy(true);
    const id = Date.now();
    setRuns((prev) => [
      { id, name: "Manual run", status: "running", time: "now" },
      ...prev,
    ]);
    setTimeout(() => {
      setRuns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "success", time: "just now" } : r
        )
      );
      setBusy(false);
    }, 2000);
  }

  return (
    <div>
      <header className="flex items-center gap-3 flex-wrap p-4 md:px-[22px] border-b border-border">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="w-[38px] h-[38px] rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <IconSettings size={20} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-[19px] font-medium leading-tight">
              Factors — branded social image
            </h1>
            <div className="text-[13px] text-text-muted mt-1 flex items-center gap-2 flex-wrap">
              <Chip>Notion</Chip>
              <span>Polls every 2 min · generates PNG from page fields</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 ml-auto">
          <Button variant="icon" aria-label="Configure">
            <IconSettings size={18} />
          </Button>
          <Button variant="primary" onClick={runNow} disabled={busy}>
            <IconPlay size={16} />
            {busy ? "Running…" : "Run now"}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 p-4 md:p-[22px]">
        <div className="flex flex-col gap-4">
          <Card>
            <SectionLabel>CONFIGURATION</SectionLabel>
            {CONFIG.map((row, i) => (
              <div
                key={row.k}
                className={`flex justify-between items-center gap-2.5 py-2.5 text-[13px] ${
                  i < CONFIG.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <span className="text-text-muted">{row.k}</span>
                <span className="text-right">{row.v}</span>
              </div>
            ))}
          </Card>

          <Card>
            <SectionLabel>TEMPLATE TYPES</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_TYPES.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
            <div className="mt-3.5">
              <SectionLabel>BACKGROUND VARIANTS</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {VARIANTS.map((v) => (
                  <Pill key={v}>{v}</Pill>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex justify-between items-center mb-1.5">
              <SectionLabel>STATUS</SectionLabel>
              <span className="text-[12px] text-accent flex items-center gap-1.5">
                <StatusDot status="success" />
                Enabled
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-2.5">
              <div className="bg-surface2 rounded-[9px] p-2.5">
                <div className="text-[12px] text-text-muted">Runs today</div>
                <div className="text-[22px] font-medium mt-0.5">24</div>
              </div>
              <div className="bg-surface2 rounded-[9px] p-2.5">
                <div className="text-[12px] text-text-muted">Success</div>
                <div className="text-[22px] font-medium mt-0.5 text-accent">
                  96%
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>RUN HISTORY</SectionLabel>
            {runs.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center gap-2.5 py-2.5 ${
                  i < runs.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <StatusDot status={r.status} />
                <span className="text-[13px] flex-1 min-w-0 truncate">
                  {r.name}
                </span>
                <span className={`text-[12px] shrink-0 ${STATUS_META[r.status].text}`}>
                  {STATUS_META[r.status].label}
                </span>
                <span className="text-[12px] text-text-muted w-[50px] text-right shrink-0">
                  {r.time}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
