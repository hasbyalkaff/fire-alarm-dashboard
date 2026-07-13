import { PageHeader } from "@/components/layout/page-header";
import { DevicesView } from "@/components/views/devices-view";
import { panelOptions } from "@/lib/options";

export const dynamic = "force-dynamic";

export default function DevicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Devices" description="All field devices with current status, severity, and location." />
      <DevicesView panelOptions={panelOptions()} />
    </div>
  );
}
