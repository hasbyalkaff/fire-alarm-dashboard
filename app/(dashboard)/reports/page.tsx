import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { canSeeReports } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/layout/page-header";
import { ReportsView } from "@/components/views/reports-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  if (!canSeeReports(session.role)) redirect("/forbidden");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Daily and monthly statistics, exportable as PDF or CSV." />
      <ReportsView canGenerate />
    </div>
  );
}
