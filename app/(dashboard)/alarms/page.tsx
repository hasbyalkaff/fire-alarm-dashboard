import { PageHeader } from "@/components/layout/page-header";
import { AlarmsView } from "@/components/views/alarms-view";
import { panelOptions } from "@/lib/options";

export const dynamic = "force-dynamic";

export default function AlarmsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Active Alarms" description="Live, sorted by severity then time. New alarms appear at the top." />
      <AlarmsView panelOptions={panelOptions()} />
    </div>
  );
}
