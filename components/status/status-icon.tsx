import {
  CheckCircle2,
  TriangleAlert,
  OctagonAlert,
  CircleSlash2,
  Cpu,
  Bell,
  Volume2,
  Thermometer,
  CloudFog,
  CircleDot,
  type LucideIcon,
} from "lucide-react";
import type { DeviceStatus, DeviceType } from "@/lib/types";
import { statusIconColor } from "@/lib/status";

// Four distinct silhouettes so status is legible without color (Design System §3.1).
const STATUS_ICON: Record<DeviceStatus, LucideIcon> = {
  normal: CheckCircle2,
  alarm: TriangleAlert,
  fault: OctagonAlert,
  offline: CircleSlash2,
};

export function StatusIcon({ status, size = 16 }: { status: DeviceStatus; size?: number }) {
  const Icon = STATUS_ICON[status];
  return <Icon size={size} color={statusIconColor(status)} strokeWidth={1.75} aria-hidden />;
}

const DEVICE_ICON: Record<DeviceType, LucideIcon> = {
  smoke: CloudFog,
  heat: Thermometer,
  mcp: CircleDot,
  bell: Bell,
  buzzer: Volume2,
  io: Cpu,
};

export function DeviceTypeIcon({ type, size = 16 }: { type: DeviceType; size?: number }) {
  const Icon = DEVICE_ICON[type];
  return <Icon size={size} strokeWidth={1.75} className="text-fg-subtle" aria-hidden />;
}
