"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AUTOMATIONS, Automation, ToolIcon } from "@/lib/automations";
import { FactorsLogo } from "./FactorsLogo";
import {
  IconPhoto,
  IconFileText,
  IconVideo,
  IconMic,
  IconSearch,
} from "./icons";

const ICONS: Record<
  Exclude<ToolIcon, "factors">,
  (p: { size?: number }) => JSX.Element
> = {
  photo: IconPhoto,
  "file-text": IconFileText,
  video: IconVideo,
  mic: IconMic,
};

function ToolMark({ a }: { a: Automation }) {
  if (a.icon === "factors") return <FactorsLogo size={18} />;
  const Icon = ICONS[a.icon as Exclude<ToolIcon, "factors">];
  return <Icon size={18} />;
}

function Row({ a }: { a: Automation }) {
  return (
    <Link
      href={`/automations/${a.slug}`}
      className="group relative flex items-center gap-4 py-5 px-3 -mx-3 rounded-xl
                 transition-colors duration-200 hover:bg-white/[0.03]
                 focus-visible:bg-white/[0.03] outline-none"
    >
      {/* identity dot + mark */}
      <span className="relative flex items-center justify-center w-9 h-9 shrink-0">
        <span
          className="absolute inset-0 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: `${a.accent ?? "#8F8F8F"}1a` }}
        />
        <span
          className="relative text-text-muted group-hover:text-text transition-colors duration-200"
          style={a.accent ? { color: a.accent } : undefined}
        >
          <ToolMark a={a} />
        </span>
      </span>

      {/* name + description reveal */}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-[17px] text-text-muted group-hover:text-white transition-colors duration-200 truncate">
            {a.name}
          </span>
          {!a.ready && (
            <span className="text-[10px] uppercase tracking-[0.12em] text-text-faint border border-border rounded px-1.5 py-0.5 shrink-0">
              Soon
            </span>
          )}
        </span>
        <span
          className="block text-[13px] text-text-faint mt-0.5 truncate
                     opacity-70 group-hover:opacity-100 transition-opacity duration-200"
        >
          {a.description}
        </span>
      </span>

      {/* metadata + open affordance */}
      <span className="hidden sm:flex items-center gap-5 shrink-0">
        {a.ready && (
          <span className="font-mono text-[11px] text-text-faint tabular-nums">
            {a.runsToday}·{a.successRate}%
          </span>
        )}
        <span
          className="flex items-center gap-1.5 text-[13px] text-text-muted
                     translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0
                     transition-all duration-200"
        >
          Open
          <span aria-hidden>→</span>
        </span>
      </span>
    </Link>
  );
}

export function ToolRegistry() {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return AUTOMATIONS;
    return AUTOMATIONS.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term) ||
        a.integrations.some((i) => i.toLowerCase().includes(term))
    );
  }, [q]);

  return (
    <div className="max-w-3xl mx-auto px-5 md:px-8 py-12 md:py-16">
      {/* header */}
      <div className="mb-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-text-faint mb-3">
          Tool registry
        </p>
        <h1 className="font-display text-[34px] md:text-[42px] leading-[1.05] tracking-tight text-white">
          What do you want
          <br />
          to automate?
        </h1>

        <div className="mt-7 flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 focus-within:border-white/30 transition-colors">
          <IconSearch size={17} className="text-text-faint shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools…"
            className="bg-transparent outline-none text-[15px] text-text placeholder:text-text-faint w-full"
          />
          <kbd className="hidden sm:block text-[11px] text-text-faint font-mono border border-border rounded px-1.5 py-0.5">
            {results.length}
          </kbd>
        </div>
      </div>

      {/* the registry — a hover-reveal directory, not cards.
          `[&:hover>a:not(:hover)]:opacity-40` dims the rest of the list while
          one row is hovered, spotlighting the active one. */}
      <div className="flex flex-col divide-y divide-border [&:hover>a:not(:hover)]:opacity-40">
        {results.map((a) => (
          <Row key={a.slug} a={a} />
        ))}
      </div>

      {results.length === 0 && (
        <p className="text-[14px] text-text-faint text-center py-14">
          No tools match “{q}”.
        </p>
      )}
    </div>
  );
}
