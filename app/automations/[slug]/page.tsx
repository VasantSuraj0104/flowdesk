import Link from "next/link";
import { notFound } from "next/navigation";
import { getAutomation, AUTOMATIONS } from "@/lib/automations";
import { ComingSoonDetail } from "@/components/tools/ComingSoonDetail";
import { IconArrowLeft } from "@/components/icons";

export function generateStaticParams() {
  return AUTOMATIONS.map((a) => ({ slug: a.slug }));
}

export default function AutomationDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const automation = getAutomation(params.slug);
  if (!automation) notFound();

  return (
    <div>
      <div className="px-4 md:px-[22px] pt-4">
        <Link
          href="/automations"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text transition-colors"
        >
          <IconArrowLeft size={15} />
          All automations
        </Link>
      </div>

      <div className="px-4 md:px-[22px] pt-4">
        <h1 className="font-display text-[22px] font-medium">
          {automation.name}
        </h1>
        <p className="text-[13px] text-text-muted mt-0.5">
          {automation.description}
        </p>
      </div>
      <ComingSoonDetail automation={automation} />
    </div>
  );
}
