import { ReactNode } from "react";
import { RunStatus, STATUS_META } from "@/lib/status";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface border border-border rounded-card p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] tracking-[0.7px] text-text-muted mb-3">
      {children}
    </div>
  );
}

export function Chip({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1">
      {icon}
      {children}
    </span>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs bg-surface2 border border-border rounded-md px-2 py-0.5 text-text">
      {children}
    </span>
  );
}

export function StatusDot({ status }: { status: RunStatus }) {
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{ background: STATUS_META[status].color }}
      aria-hidden="true"
    />
  );
}
