// Data Access Layer: typed, read-only queries over the domain data + DTO mapping.
// In production these functions run parameterized SELECTs against the dashboard_ro
// Postgres role. Here they read the in-memory mock. The signatures are the contract.

import { db } from "@/lib/mock/store";
import {
  DEVICE_TYPE_LABEL,
  type AlarmEvent,
  type Device,
  type AlarmDTO,
  type DashboardSummary,
  type DeviceDetailDTO,
  type DeviceListItem,
  type DeviceStatus,
  type DeviceType,
  type EventDTO,
  type EventType,
  type Paginated,
  type PanelDTO,
  type PanelState,
  type ReportStatistics,
  type Severity,
  type ZoneDTO,
  type ZoneStatus,
} from "@/lib/types";

const SEVERITY_RANK: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const STATUS_PRIORITY: Record<DeviceStatus, number> = { alarm: 4, fault: 3, offline: 2, normal: 1 };

function paginate<T>(rows: T[], page: number, pageSize: number): Paginated<T> {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), totalPages);
  const start = (p - 1) * pageSize;
  return { data: rows.slice(start, start + pageSize), meta: { page: p, pageSize, total, totalPages } };
}

function panelName(id: number) {
  return db().panels.find((p) => p.id === id)?.name ?? `Panel ${id}`;
}
function zoneName(id: number) {
  return db().zones.find((z) => z.id === id)?.name ?? `Zone ${id}`;
}

/** A zone's single status = highest-priority status among its devices. */
export function zoneStatus(zoneId: number): ZoneStatus {
  const devices = db().devices.filter((d) => d.zoneId === zoneId);
  if (devices.length === 0) return "normal";
  return devices.reduce<DeviceStatus>((worst, d) =>
    STATUS_PRIORITY[d.status] > STATUS_PRIORITY[worst] ? d.status : worst, "normal");
}

export function getSummary(): DashboardSummary {
  const d = db();
  return {
    panelsOnline: d.panels.filter((p) => p.status === "online").length,
    panelsOffline: d.panels.filter((p) => p.status === "offline").length,
    activeAlarms: d.devices.filter((x) => x.status === "alarm").length,
    activeFaults: d.devices.filter((x) => x.status === "fault").length,
    activeDevices: d.devices.filter((x) => x.status !== "offline").length,
    lastUpdate: d.lastUpdate,
  };
}

export interface PanelFilters { status?: PanelState; search?: string; page?: number; pageSize?: number }
export function getPanels(f: PanelFilters = {}): Paginated<PanelDTO> {
  const d = db();
  let rows: PanelDTO[] = d.panels.map((p) => ({
    id: p.id, name: p.name, building: p.building, location: p.location,
    status: p.status, lastCommunication: p.lastCommunication,
    zoneCount: d.zones.filter((z) => z.panelId === p.id).length,
  }));
  if (f.status) rows = rows.filter((r) => r.status === f.status);
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.building.toLowerCase().includes(q));
  }
  // Offline first, then name.
  rows.sort((a, b) =>
    a.status === b.status ? a.name.localeCompare(b.name) : a.status === "offline" ? -1 : 1);
  return paginate(rows, f.page ?? 1, f.pageSize ?? 50);
}

export function getPanel(id: number): (PanelDTO & { zones: ZoneDTO[]; connectionLog: { event: string; occurredAt: string }[] }) | null {
  const d = db();
  const p = d.panels.find((x) => x.id === id);
  if (!p) return null;
  const zones = getZones({ panelId: id, pageSize: 500 }).data;
  const connectionLog = d.connectionLog
    .filter((c) => c.panelId === id)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 8)
    .map((c) => ({ event: c.event, occurredAt: c.occurredAt }));
  return {
    id: p.id, name: p.name, building: p.building, location: p.location,
    status: p.status, lastCommunication: p.lastCommunication,
    zoneCount: zones.length, zones, connectionLog,
  };
}

export interface ZoneFilters { panelId?: number; status?: ZoneStatus; search?: string; page?: number; pageSize?: number }
export function getZones(f: ZoneFilters = {}): Paginated<ZoneDTO> {
  const d = db();
  let rows: ZoneDTO[] = d.zones.map((z) => ({
    id: z.id, panelId: z.panelId, panelName: panelName(z.panelId), name: z.name,
    building: z.building, status: zoneStatus(z.id),
    deviceCount: d.devices.filter((dv) => dv.zoneId === z.id).length,
  }));
  if (f.panelId) rows = rows.filter((r) => r.panelId === f.panelId);
  if (f.status) rows = rows.filter((r) => r.status === f.status);
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.building.toLowerCase().includes(q));
  }
  rows.sort((a, b) =>
    STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status] || a.name.localeCompare(b.name));
  return paginate(rows, f.page ?? 1, f.pageSize ?? 50);
}

export function getZone(id: number): (ZoneDTO & { devices: DeviceListItem[] }) | null {
  const d = db();
  const z = d.zones.find((x) => x.id === id);
  if (!z) return null;
  const devices = getDevices({ zoneId: id, pageSize: 1000 }).data;
  return {
    id: z.id, panelId: z.panelId, panelName: panelName(z.panelId), name: z.name,
    building: z.building, status: zoneStatus(z.id), deviceCount: devices.length, devices,
  };
}

function toDeviceListItem(dev: Device): DeviceListItem {
  return {
    id: dev.id, label: dev.label, type: dev.type, typeLabel: DEVICE_TYPE_LABEL[dev.type],
    zoneId: dev.zoneId, zoneName: zoneName(dev.zoneId), panelId: dev.panelId, panelName: panelName(dev.panelId),
    location: dev.location, status: dev.status, severity: dev.severity, lastUpdate: dev.lastUpdate,
  };
}

export interface DeviceFilters {
  status?: DeviceStatus; type?: DeviceType; panelId?: number; zoneId?: number;
  search?: string; page?: number; pageSize?: number;
}
export function getDevices(f: DeviceFilters = {}): Paginated<DeviceListItem> {
  let rows = db().devices.slice();
  if (f.status) rows = rows.filter((r) => r.status === f.status);
  if (f.type) rows = rows.filter((r) => r.type === f.type);
  if (f.panelId) rows = rows.filter((r) => r.panelId === f.panelId);
  if (f.zoneId) rows = rows.filter((r) => r.zoneId === f.zoneId);
  if (f.search) {
    const q = f.search.toLowerCase();
    rows = rows.filter((r) => r.label.toLowerCase().includes(q) || r.location.toLowerCase().includes(q));
  }
  rows.sort((a, b) =>
    STATUS_PRIORITY[b.status] - STATUS_PRIORITY[a.status] || a.label.localeCompare(b.label));
  return paginate(rows.map(toDeviceListItem), f.page ?? 1, f.pageSize ?? 50);
}

export function getDevice(id: number): DeviceDetailDTO | null {
  const dev = db().devices.find((d) => d.id === id);
  if (!dev) return null;
  const z = db().zones.find((x) => x.id === dev.zoneId);
  return {
    ...toDeviceListItem(dev),
    address: dev.address,
    building: z?.building ?? "",
    registerMap: dev.registerMap,
  };
}

function eventToAlarmDTO(e: AlarmEvent): AlarmDTO {
  const dev = db().devices.find((d) => d.id === e.deviceId);
  return {
    id: e.id, timestamp: e.createdAt, panelId: e.panelId, panel: panelName(e.panelId),
    zoneId: e.zoneId, zone: zoneName(e.zoneId), deviceId: e.deviceId,
    device: dev?.label ?? `Device ${e.deviceId}`, deviceType: dev?.type ?? "io",
    severity: e.severity ?? "low", status: e.status,
  };
}

export interface AlarmFilters { severity?: Severity; panelId?: number; zoneId?: number; page?: number; pageSize?: number }
export function getAlarms(f: AlarmFilters = {}): Paginated<AlarmDTO> {
  let rows = db().events.filter((e) => e.eventType === "alarm" && e.status === "active");
  if (f.severity) rows = rows.filter((e) => e.severity === f.severity);
  if (f.panelId) rows = rows.filter((e) => e.panelId === f.panelId);
  if (f.zoneId) rows = rows.filter((e) => e.zoneId === f.zoneId);
  const dtos = rows.map(eventToAlarmDTO).sort((a, b) =>
    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.timestamp.localeCompare(a.timestamp));
  return paginate(dtos, f.page ?? 1, f.pageSize ?? 50);
}

export interface EventFilters {
  from?: string; to?: string; panelId?: number; zoneId?: number; deviceId?: number;
  severity?: Severity; type?: EventType; page?: number; pageSize?: number;
}
export function getEvents(f: EventFilters = {}): Paginated<EventDTO> {
  let rows = db().events.slice();
  if (f.from) rows = rows.filter((e) => e.createdAt >= f.from!);
  if (f.to) rows = rows.filter((e) => e.createdAt <= f.to!);
  if (f.panelId) rows = rows.filter((e) => e.panelId === f.panelId);
  if (f.zoneId) rows = rows.filter((e) => e.zoneId === f.zoneId);
  if (f.deviceId) rows = rows.filter((e) => e.deviceId === f.deviceId);
  if (f.severity) rows = rows.filter((e) => e.severity === f.severity);
  if (f.type) rows = rows.filter((e) => e.eventType === f.type);
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const dtos: EventDTO[] = rows.map((e) => {
    const dev = db().devices.find((d) => d.id === e.deviceId);
    return {
      id: e.id, timestamp: e.createdAt, eventType: e.eventType, panelId: e.panelId,
      panel: panelName(e.panelId), zoneId: e.zoneId, zone: zoneName(e.zoneId),
      deviceId: e.deviceId, device: dev?.label ?? null, severity: e.severity,
    };
  });
  return paginate(dtos, f.page ?? 1, f.pageSize ?? 50);
}

export function getDeviceHistory(deviceId: number): EventDTO[] {
  return getEvents({ deviceId, pageSize: 200 }).data;
}

export function getStatistics(period: "daily" | "monthly", dateISO: string): ReportStatistics {
  const start = new Date(dateISO);
  const end = new Date(start);
  if (period === "daily") end.setUTCDate(end.getUTCDate() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  const from = start.toISOString();
  const to = end.toISOString();
  const rows = db().events.filter((e) => e.createdAt >= from && e.createdAt < to);

  const byDay = new Map<string, number>();
  const byType = new Map<EventType, number>();
  const byZone = new Map<string, number>();
  for (const e of rows) {
    const day = e.createdAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    byType.set(e.eventType, (byType.get(e.eventType) ?? 0) + 1);
    if (e.eventType === "alarm") byZone.set(zoneName(e.zoneId), (byZone.get(zoneName(e.zoneId)) ?? 0) + 1);
  }

  return {
    periodLabel: period === "daily" ? start.toISOString().slice(0, 10) : start.toISOString().slice(0, 7),
    totals: {
      alarms: rows.filter((e) => e.eventType === "alarm").length,
      faults: rows.filter((e) => e.eventType === "fault").length,
      restores: rows.filter((e) => e.eventType === "restore" || e.status === "restored").length,
      devices: db().devices.length,
    },
    alarmsByDay: [...byDay.entries()].sort().map(([label, count]) => ({ label, count })),
    eventsByType: [...byType.entries()].map(([label, count]) => ({ label, count })),
    topZones: [...byZone.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([zone, count]) => ({ zone, count })),
  };
}
