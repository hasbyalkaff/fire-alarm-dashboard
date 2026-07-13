import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { AppShell } from "@/components/shell/app-shell";

// Protected shell for all dashboard routes. verifySession() is the authoritative
// auth check (proxy.ts only did an optimistic pre-check). One SSE connection is
// mounted here and preserved across page navigations.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  if (!session) redirect("/login");
  return <AppShell user={session}>{children}</AppShell>;
}
