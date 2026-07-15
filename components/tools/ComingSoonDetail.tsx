import { Card, SectionLabel } from "@/components/ui";
import { Automation } from "@/lib/automations";
import { IconLock } from "@/components/icons";

export function ComingSoonDetail({ automation: a }: { automation: Automation }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 p-5 md:p-[22px] max-w-5xl">
      <Card>
        <SectionLabel>WHAT WE KNOW SO FAR</SectionLabel>
        <div className="flex justify-between py-2.5 border-b border-border text-[13px]">
          <span className="text-text-muted">Integrations</span>
          <span className="text-right">{a.integrations.join(" · ")}</span>
        </div>
        <div className="flex justify-between py-2.5 text-[13px]">
          <span className="text-text-muted">Status</span>
          <span className="text-warn">Draft — not wired up yet</span>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center text-center min-h-[180px]">
        {a.locked && <IconLock size={22} className="text-text-muted mb-3" />}
        <h3 className="font-display text-[16px] font-medium">
          {a.locked ? "Reference workflow" : "Tool page coming soon"}
        </h3>
        <p className="text-[13px] text-text-muted mt-1.5 max-w-[280px]">
          {a.locked
            ? "This one is marked do-not-touch, so it stays read-only here until you decide to expose it."
            : "Share this automation's JSON and we'll build its start-point page with real config and a Run now button."}
        </p>
      </Card>
    </div>
  );
}
