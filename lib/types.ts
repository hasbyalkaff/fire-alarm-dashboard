// Domain + DTO types for the Fire Alarm Monitoring Dashboard.
// Mirrors the read-only domain contract in Technical_Architecture.md §4.2.
// The dashboard never writes these; upstream (Feeder) owns them.

export type DeviceStatus = "normal" | "alarm" | "fault" | "offline";
export type PanelState = "online" | "offline";
export type ZoneStatus = DeviceStatus; // a zone rolls up to one device status
export type Severity = "critical" | "high" | "medium" | "low";
export type DeviceType = "smoke" | "heat" | "mcp" | "bell" | "buzzer" | "io";
export type EventType = "alarm" | "fault" | "restore" | "online" | "offline";
export type Role = "administrator" | "safety_officer" | "viewer";

export const DEVICE_TYPE_LABEL: Record<DeviceType, string> = {
  smoke: "Smoke Detector",
  heat: "Heat Detector",
  mcp: "Manual Call Point",
  bell: "Fire Bell",
  buzzer: "Buzzer",
  io: "I/O Module",
};

export const ROLE_LABEL: Record<Role, string> = {
  administrator: "Administrator",
  safety_officer: "Safety Officer",
  viewer: "Viewer",
};

// ---- Domain records (as the Feeder would expose them) ----

export interface Panel {
  id: number;
  name: string;
  building: string;
  location: string;
  status: PanelState;
  lastCommunication: string; // ISO
}

export interface Zone {
  id: number;
  panelId: number;
  name: string;
  building: string;
}

export interface Device {
  id: number;
  zoneId: number;
  panelId: number;
  address: number;
  type: DeviceType;
  label: string;
  location: string;
  registerMap: RegisterEntry[];
  status: DeviceStatus;
  severity: Severity | null;
  lastUpdate: string; // ISO
}

export interface RegisterEntry {
  register: number;
  name: string;
  value: string;
}

export interface AlarmEvent {
  id: number;
  deviceId: number;
  zoneId: number;
  panelId: number;
  eventType: EventType;
  severity: Severity | null;
  status: "active" | "restored";
  createdAt: string; // ISO
  restoredAt: string | null;
}

export interface ConnectionLogEntry {
  id: number;
  panelId: number;
  event: "connect" | "disconnect";
  occurredAt: string;
}

// ---- DTOs returned by the API / DAL ----

export interface DashboardSummary {
  panelsOnline: number;
  panelsOffline: number;
  activeAlarms: number;
  activeFaults: number;
  activeDevices: number;
  lastUpdate: string;
}

export interface PanelDTO {
  id: number;
  name: string;
  building: string;
  location: string;
  status: PanelState;
  lastCommunication: string;
  zoneCount: number;
}

export interface ZoneDTO {
  id: number;
  panelId: number;
  panelName: string;
  name: string;
  building: string;
  status: ZoneStatus;
  deviceCount: number;
}

export interface DeviceListItem {
  id: number;
  label: string;
  type: DeviceType;
  typeLabel: string;
  zoneId: number;
  zoneName: string;
  panelId: number;
  panelName: string;
  location: string;
  status: DeviceStatus;
  severity: Severity | null;
  lastUpdate: string;
}

export interface DeviceDetailDTO extends DeviceListItem {
  address: number;
  building: string;
  registerMap: RegisterEntry[];
}

export interface AlarmDTO {
  id: number;
  timestamp: string;
  panelId: number;
  panel: string;
  zoneId: number;
  zone: string;
  deviceId: number;
  device: string;
  deviceType: DeviceType;
  severity: Severity;
  status: "active" | "restored";
}

export interface EventDTO {
  id: number;
  timestamp: string;
  eventType: EventType;
  panelId: number;
  panel: string;
  zoneId: number;
  zone: string;
  deviceId: number | null;
  device: string | null;
  severity: Severity | null;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface SessionUser {
  sub: string;
  username: string;
  role: Role;
}

// ---- SSE event contract (Technical_Architecture.md §5.4) ----

export type SSEEvent =
  | { event: "alarm.created"; data: AlarmDTO }
  | { event: "alarm.restored"; data: AlarmDTO }
  | {
      event: "device.status_changed";
      data: { deviceId: number; status: DeviceStatus; severity: Severity | null; zoneId: number; panelId: number };
    }
  | {
      event: "panel.status_changed";
      data: { panelId: number; status: PanelState; lastCommunication: string };
    }
  | { event: "summary.updated"; data: DashboardSummary };

export type ReportStatistics = {
  periodLabel: string;
  totals: { alarms: number; faults: number; restores: number; devices: number };
  alarmsByDay: { label: string; count: number }[];
  eventsByType: { label: string; count: number }[];
  topZones: { zone: string; count: number }[];
};
