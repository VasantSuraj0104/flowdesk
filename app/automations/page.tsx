import { AutomationCard } from "@/components/AutomationCard";
import { AUTOMATIONS } from "@/lib/automations";

export default function AutomationsPage() {
  const ready = AUTOMATIONS.filter((a) => a.ready).length;

  return (
    <div className="p-5 md:p-[22px] max-w-6xl">
      <h1 className="font-display text-[22px] font-medium">Automations</h1>
      <p className="text-[13px] text-text-muted mt-0.5">
        {AUTOMATIONS.length} automations · {ready} live · the rest are being set up.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-[18px]">
        {AUTOMATIONS.map((a) => (
          <AutomationCard key={a.slug} automation={a} />
        ))}
      </div>
    </div>
  );
}
