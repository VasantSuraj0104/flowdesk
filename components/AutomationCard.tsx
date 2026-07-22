import Link from "next/link";
import {
  IconPhoto,
  IconFileText,
  IconVideo,
  IconMic,
  IconLock,
} from "./icons";
import { Automation, ToolIcon } from "@/lib/automations";

const ICONS: Record<ToolIcon, (p: { size?: number }) => JSX.Element> = {
  photo: IconPhoto,
  "file-text": IconFileText,
  video: IconVideo,
  mic: IconMic,
};

export function AutomationCard({ automation: a }: { automation: Automation }) {
  const Icon = ICONS[a.icon];

  return (
    <Link
      href={`/automations/${a.slug}`}
      className="group flex flex-col bg-surface border border-border rounded-card p-4 transition-colors hover:border-text-muted/50"
    >
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-[15px] font-medium truncate">
              {a.name}
            </h3>
            {a.locked && (
              <IconLock
                size={13}
                className="text-text-muted shrink-0"
                aria-label="Reference only"
              />
            )}
          </div>
          <p className="text-[13px] text-text-muted mt-1 line-clamp-2">
            {a.description}
          </p>
        </div>
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ background: a.status === "enabled" ? "#3DE7DF" : "#8A9099" }}
          aria-label={a.status}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
        <span className="text-[12px] text-text-muted truncate">
          {a.integrations.join(" · ")}
        </span>
        {a.ready ? (
          <span className="text-[12px] text-text-muted shrink-0">
            {a.runsToday} today · {a.successRate}%
          </span>
        ) : (
          <span className="text-[12px] text-warn shrink-0">Setup pending</span>
        )}
      </div>
    </Link>
  );
}
