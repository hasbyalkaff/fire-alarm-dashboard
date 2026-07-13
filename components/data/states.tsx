import { Inbox, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <Inbox className="text-fg-subtle" size={28} aria-hidden />
      <p className="text-sm font-medium text-fg">{title}</p>
      {hint && <p className="max-w-sm text-sm text-fg-subtle">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center" role="alert">
      <TriangleAlert style={{ color: "var(--status-fault-fg)" }} size={28} aria-hidden />
      <p className="text-sm font-medium text-fg">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function AllClearState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <span
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
        style={{ color: "var(--status-normal-fg)", backgroundColor: "var(--status-normal-bg)" }}
      >
        All Normal
      </span>
      <p className="text-sm text-fg-subtle">0 active alarms. Everything is operating normally.</p>
    </div>
  );
}
