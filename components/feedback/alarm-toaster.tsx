"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert, X } from "lucide-react";
import { useRealtime, type ToastItem } from "@/hooks/realtime-store";
import { SeverityBadge } from "@/components/status/status-badge";
import { formatTime } from "@/lib/utils";

// Non-blocking alarm toasts. role="alert" / assertive so a new alarm is announced
// even when focus is elsewhere (PRD US-K1, AC-K1). Critical toasts persist.
export function AlarmToaster() {
  const toasts = useRealtime((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed right-4 top-16 z-50 flex w-[min(92vw,22rem)] flex-col gap-2" role="alert" aria-live="assertive">
      {toasts.map((t) => (
        <Toast key={t.key} item={t} />
      ))}
    </div>
  );
}

function Toast({ item }: { item: ToastItem }) {
  const dismiss = useRealtime((s) => s.dismissToast);
  const { alarm } = item;

  useEffect(() => {
    if (alarm.severity === "critical") return; // critical persists until dismissed
    const t = setTimeout(() => dismiss(item.key), 8000);
    return () => clearTimeout(t);
  }, [alarm.severity, dismiss, item.key]);

  return (
    <div
      className="pointer-events-auto overflow-hidden rounded-[var(--radius-lg)] border bg-surface-elevated shadow-lg"
      style={{ borderColor: "var(--status-alarm-strong)" }}
    >
      <div className="flex items-start gap-2.5 p-3">
        <TriangleAlert size={18} style={{ color: "var(--status-alarm-strong)" }} className="mt-0.5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-fg">New alarm</span>
            <SeverityBadge severity={alarm.severity} />
          </div>
          <p className="mt-0.5 truncate text-sm text-fg-muted">
            {alarm.device} · {alarm.zone}
          </p>
          <div className="mt-1.5 flex items-center justify-between">
            <time className="tnum font-mono text-xs text-fg-subtle">{formatTime(alarm.timestamp)}</time>
            <Link href={`/devices/${alarm.deviceId}`} className="text-sm font-medium text-brand hover:underline">
              View
            </Link>
          </div>
        </div>
        <button onClick={() => dismiss(item.key)} aria-label="Dismiss" className="rounded p-1 text-fg-subtle hover:bg-surface-muted">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
