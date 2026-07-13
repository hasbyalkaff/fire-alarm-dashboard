"use client";

import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/realtime-store";

/**
 * Per-surface "data may be delayed" note (Design System §9.6). Tied to a Last Update
 * stamp: when the SSE connection is not open, the displayed values may be stale, so
 * the surface says so in fault amber instead of relying only on the global banner.
 */
export function StaleNote({ className }: { className?: string }) {
  const connection = useRealtime((s) => s.connection);
  if (connection === "open") return null;
  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-1 text-xs font-medium", className)}
      style={{ color: "var(--status-fault-fg)" }}
    >
      <WifiOff size={13} aria-hidden />
      Live updates paused. Data may be delayed.
    </span>
  );
}
