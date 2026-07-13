import { cn } from "@/lib/utils";
import { STATUS_LABEL, SEVERITY_LABEL, statusChipStyle, statusDotStyle } from "@/lib/status";
import { StatusIcon } from "./status-icon";
import type { DeviceStatus, PanelState, Severity } from "@/lib/types";

/** The canonical status object: color + icon + text label, always together. */
export function StatusBadge({
  status,
  size = "md",
  className,
}: {
  status: DeviceStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      style={statusChipStyle(status)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <StatusIcon status={status} size={size === "sm" ? 13 : 15} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PanelStateBadge({ state, size = "md" }: { state: PanelState; size?: "sm" | "md" }) {
  return <StatusBadge status={state === "online" ? "normal" : "offline"} size={size} />;
}

export function StatusDot({ status, label }: { status: DeviceStatus; label?: string }) {
  return (
    <span
      className="inline-block size-2 rounded-full"
      style={statusDotStyle(status)}
      role="img"
      aria-label={label ?? STATUS_LABEL[status]}
    />
  );
}

// Severity reuses the status palette; text tag is always present (Design System §3.2).
const SEVERITY_STATUS: Record<Severity, DeviceStatus> = {
  critical: "alarm",
  high: "alarm",
  medium: "fault",
  low: "offline",
};

export function SeverityBadge({ severity, size = "sm" }: { severity: Severity; size?: "sm" | "md" }) {
  const base = SEVERITY_STATUS[severity];
  const solid = severity === "critical";
  return (
    <span
      style={
        solid
          ? { backgroundColor: "var(--status-alarm-solid)", color: "var(--status-alarm-solid-fg)" }
          : { color: `var(--status-${base}-fg)`, borderColor: `var(--status-${base}-fg)` }
      }
      className={cn(
        "inline-flex items-center rounded-full font-semibold uppercase tracking-wide",
        solid ? "" : "border bg-transparent",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
      )}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
