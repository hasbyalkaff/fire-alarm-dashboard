import { PageHeader } from "@/components/layout/page-header";
import { ZonesView } from "@/components/views/zones-view";
import { panelOptions } from "@/lib/options";

export const dynamic = "force-dynamic";

export default function ZonesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Zones" description="Each zone shows a single rolled-up status." showStale />
      <ZonesView panelOptions={panelOptions()} />
    </div>
  );
}
