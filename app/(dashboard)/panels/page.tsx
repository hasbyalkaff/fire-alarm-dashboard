import { PageHeader } from "@/components/layout/page-header";
import { PanelsView } from "@/components/views/panels-view";

export const dynamic = "force-dynamic";

export default function PanelsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Panels" description="Communication status of every fire alarm control panel." showStale />
      <PanelsView />
    </div>
  );
}
