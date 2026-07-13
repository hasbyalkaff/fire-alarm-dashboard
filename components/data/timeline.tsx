import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EventDTO, EventType } from "@/lib/types";
import { StatusIcon } from "@/components/status/status-icon";
import { SeverityBadge } from "@/components/status/status-badge";
import { formatDay, formatTime } from "@/lib/utils";
import type { DeviceStatus } from "@/lib/types";

const EVENT_STATUS: Record<EventType, DeviceStatus> = {
  alarm: "alarm",
  fault: "fault",
  offline: "offline",
  online: "normal",
  restore: "normal",
};
const EVENT_LABEL: Record<EventType, string> = {
  alarm: "Alarm",
  fault: "Fault",
  restore: "Restored",
  online: "Online",
  offline: "Offline",
};

/** Reverse-chronological timeline grouped by day (Event History, Device history). */
export function Timeline({ events, linkDevices = true }: { events: EventDTO[]; linkDevices?: boolean }) {
  const groups = new Map<string, EventDTO[]>();
  for (const e of events) {
    const day = e.timestamp.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(e);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.entries()].map(([day, items]) => (
        <section key={day}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{formatDay(items[0].timestamp)}</h3>
          <ol className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
            {items.map((e) => {
              const inner = (
                <>
                  <time className="tnum shrink-0 font-mono text-[13px] text-fg-muted" dateTime={e.timestamp}>
                    {formatTime(e.timestamp)}
                  </time>
                  <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-fg">
                    <StatusIcon status={EVENT_STATUS[e.eventType]} size={15} />
                    {EVENT_LABEL[e.eventType]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">
                    {e.zone}
                    {e.device ? ` · ${e.device}` : ""}
                  </span>
                  {e.severity && <SeverityBadge severity={e.severity} />}
                  {linkDevices && e.deviceId && <ChevronRight size={16} className="shrink-0 text-fg-subtle" aria-hidden />}
                </>
              );
              const className = "flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-0";
              return (
                <li key={e.id}>
                  {linkDevices && e.deviceId ? (
                    <Link href={`/devices/${e.deviceId}`} className={`${className} hover:bg-surface-muted`}>
                      {inner}
                    </Link>
                  ) : (
                    <div className={className}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
