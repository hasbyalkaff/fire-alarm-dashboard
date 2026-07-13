import type { CSSProperties } from "react";
import type { DeviceStatus, Severity } from "@/lib/types";

export const STATUS_LABEL: Record<DeviceStatus, string> = {
  normal: "Normal",
  alarm: "Alarm",
  fault: "Fault",
  offline: "Offline",
};

export const PANEL_STATE_LABEL = { online: "Online", offline: "Offline" } as const;

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Chip style: text on tint background (pre-approved AA pairs, Design System §3.1). */
export function statusChipStyle(status: DeviceStatus): CSSProperties {
  return {
    color: `var(--status-${status}-fg)`,
    backgroundColor: `var(--status-${status}-bg)`,
  };
}

export function statusFg(status: DeviceStatus): CSSProperties {
  return { color: `var(--status-${status}-fg)` };
}

export function statusIconColor(status: DeviceStatus): string {
  return `var(--status-${status}-icon)`;
}

export function statusDotStyle(status: DeviceStatus): CSSProperties {
  return { backgroundColor: `var(--status-${status}-icon)` };
}

/** Panel online/offline maps onto the shared status palette (online→normal). */
export function panelStatusKey(state: "online" | "offline"): DeviceStatus {
  return state === "online" ? "normal" : "offline";
}
