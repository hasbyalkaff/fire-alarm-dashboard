import { PageHeader } from "@/components/layout/page-header";
import { EventsView } from "@/components/views/events-view";
import { panelOptions } from "@/lib/options";

export const dynamic = "force-dynamic";

export default function EventsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Event History" description="Reverse-chronological timeline of alarms, faults, and connectivity changes." />
      <EventsView panelOptions={panelOptions()} />
    </div>
  );
}
