import { getSummary } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { SummaryTiles } from "@/components/views/summary-tiles";
import { ActiveAlarmsPreview } from "@/components/views/active-alarms-preview";

// Server-rendered first paint for the 5-second glance (PRD North Star); the client
// tiles then subscribe to live SSE deltas.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const summary = getSummary();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" description="Live status across all fire alarm panels, zones, and devices." />
      <SummaryTiles initial={summary} />
      <ActiveAlarmsPreview />
    </div>
  );
}
