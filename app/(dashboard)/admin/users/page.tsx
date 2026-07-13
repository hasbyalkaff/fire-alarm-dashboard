import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/layout/page-header";
import { UsersView } from "@/components/views/users-view";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  if (!canManageUsers(session.role)) redirect("/forbidden");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Manage accounts and roles. Deactivation is reversible." />
      <UsersView />
    </div>
  );
}
