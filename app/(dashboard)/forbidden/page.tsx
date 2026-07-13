import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <ShieldX size={32} className="text-fg-subtle" aria-hidden />
      <h1 className="text-2xl font-semibold text-fg">Access denied</h1>
      <p className="max-w-sm text-sm text-fg-muted">
        Your role does not have access to this area. If you believe this is a mistake, contact your administrator.
      </p>
      <Link href="/">
        <Button variant="secondary">Back to Dashboard</Button>
      </Link>
    </div>
  );
}
