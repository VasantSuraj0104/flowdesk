import { Card, StatusDot } from "@/components/ui";
import { RunStatus, STATUS_META } from "@/lib/status";

const STATS = [
  { label: "Active", value: "8" },
  { label: "Runs today", value: "142" },
  { label: "Success rate", value: "98%", accent: true },
  { label: "Failed", value: "3", danger: true },
];

const RECENT: { name: string; status: RunStatus; time: string }[] = [
  { name: "Lead enrichment", status: "success", time: "2m" },
  { name: "Daily report email", status: "running", time: "now" },
  { name: "Invoice sync", status: "failed", time: "1h" },
];

export default function DashboardPage() {
  return (
    <div className="p-5 md:p-[22px] max-w-5xl">
      <h1 className="font-display text-[22px] font-medium">
        Good evening, Arjun
      </h1>
      <p className="text-[13px] text-text-muted mt-0.5">
        Here&apos;s what your automations have been up to.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-[18px]">
        {STATS.map((s) => (
          <div key={s.label} className="bg-surface rounded-[10px] p-3.5">
            <div className="text-xs text-text-muted">{s.label}</div>
            <div
              className={`text-2xl font-medium mt-1 ${
                s.accent ? "text-accent" : s.danger ? "text-danger" : ""
              }`}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="text-[13px] text-text-muted mt-5 mb-2.5">Recent runs</div>
      <Card className="!p-0 overflow-hidden">
        {RECENT.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center gap-2.5 px-3.5 py-[11px] ${
              i < RECENT.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <StatusDot status={r.status} />
            <span className="text-[13px] flex-1 min-w-0 truncate">
              {r.name}
            </span>
            <span className={`text-xs shrink-0 ${STATUS_META[r.status].text}`}>
              {STATUS_META[r.status].label}
            </span>
            <span className="text-xs text-text-muted w-12 text-right shrink-0">
              {r.time}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
