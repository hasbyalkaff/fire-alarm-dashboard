// Mock Feeder: simulates the upstream Modbus Database Feeder Service (OUT OF SCOPE
// per PRD). On an interval it mutates the in-memory domain and publishes SSE events
// on the same contract a real feeder would. This lets the dashboard demonstrate live
// alarms, faults, restores, and panel connectivity without real hardware.
//
// Replace this module with a real PG LISTEN subscriber to go live; the SSE contract
// and the UI do not change.

import { db } from "@/lib/mock/store";
import { getSummary, zoneStatus } from "@/lib/dal";
import { publish } from "@/lib/realtime/bus";
import { DEVICE_TYPE_LABEL, type AlarmDTO, type Severity } from "@/lib/types";

const g = globalThis as unknown as { __facpFeeder?: NodeJS.Timeout };

function nowISO() {
  return new Date().toISOString();
}

function pushSummary() {
  db().lastUpdate = nowISO();
  publish({ event: "summary.updated", data: getSummary() });
}

function raiseAlarm() {
  const d = db();
  const candidates = d.devices.filter((x) => x.status === "normal" && (x.type === "smoke" || x.type === "heat" || x.type === "mcp"));
  if (candidates.length === 0) return;
  const dev = candidates[Math.floor(Math.random() * candidates.length)];
  const severity: Severity = Math.random() < 0.5 ? "critical" : "high";
  dev.status = "alarm";
  dev.severity = severity;
  dev.lastUpdate = nowISO();
  const event = {
    id: d.seq.event++, deviceId: dev.id, zoneId: dev.zoneId, panelId: dev.panelId,
    eventType: "alarm" as const, severity, status: "active" as const,
    createdAt: dev.lastUpdate, restoredAt: null,
  };
  d.events.unshift(event);

  const panel = d.panels.find((p) => p.id === dev.panelId)!;
  const zone = d.zones.find((z) => z.id === dev.zoneId)!;
  const dto: AlarmDTO = {
    id: event.id, timestamp: event.createdAt, panelId: panel.id, panel: panel.name,
    zoneId: zone.id, zone: zone.name, deviceId: dev.id, device: dev.label,
    deviceType: dev.type, severity, status: "active",
  };
  publish({ event: "alarm.created", data: dto });
  publish({ event: "device.status_changed", data: { deviceId: dev.id, status: "alarm", severity, zoneId: dev.zoneId, panelId: dev.panelId } });
  pushSummary();
  void DEVICE_TYPE_LABEL; // keep import meaningful if unused across builds
}

function restoreOne() {
  const d = db();
  const active = d.events.find((e) => e.status === "active");
  if (!active) return;
  active.status = "restored";
  active.restoredAt = nowISO();
  const dev = d.devices.find((x) => x.id === active.deviceId);
  if (dev) {
    dev.status = "normal";
    dev.severity = null;
    dev.lastUpdate = active.restoredAt;
  }
  const panel = d.panels.find((p) => p.id === active.panelId)!;
  const zone = d.zones.find((z) => z.id === active.zoneId)!;
  publish({
    event: "alarm.restored",
    data: {
      id: active.id, timestamp: active.restoredAt!, panelId: panel.id, panel: panel.name,
      zoneId: zone.id, zone: zone.name, deviceId: active.deviceId, device: dev?.label ?? "",
      deviceType: dev?.type ?? "io", severity: active.severity ?? "low", status: "restored",
    },
  });
  if (dev) publish({ event: "device.status_changed", data: { deviceId: dev.id, status: "normal", severity: null, zoneId: dev.zoneId, panelId: dev.panelId } });
  pushSummary();
  void zoneStatus;
}

function togglePanel() {
  const d = db();
  const panel = d.panels[Math.floor(Math.random() * d.panels.length)];
  const next = panel.status === "online" ? "offline" : "online";
  panel.status = next;
  panel.lastCommunication = nowISO();
  d.connectionLog.unshift({
    id: d.seq.conn++, panelId: panel.id,
    event: next === "offline" ? "disconnect" : "connect", occurredAt: panel.lastCommunication,
  });
  // Reflect on this panel's devices.
  for (const dev of d.devices.filter((x) => x.panelId === panel.id)) {
    if (next === "offline") { if (dev.status === "normal") dev.status = "offline"; }
    else if (dev.status === "offline") dev.status = "normal";
    dev.lastUpdate = panel.lastCommunication;
  }
  publish({ event: "panel.status_changed", data: { panelId: panel.id, status: next, lastCommunication: panel.lastCommunication } });
  pushSummary();
}

/** Boot the mock feeder once per process (called from instrumentation.register). */
export function startMockFeeder() {
  if (g.__facpFeeder) return;
  db(); // ensure seeded
  let tick = 0;
  g.__facpFeeder = setInterval(() => {
    tick++;
    const r = Math.random();
    // Weighted behaviour: mostly quiet, occasional alarm, periodic restore.
    if (r < 0.22) raiseAlarm();
    else if (r < 0.5) restoreOne();
    else if (tick % 6 === 0) togglePanel();
    else pushSummary(); // heartbeat keeps Last Update fresh
  }, 5000);
}

export function stopMockFeeder() {
  if (g.__facpFeeder) {
    clearInterval(g.__facpFeeder);
    g.__facpFeeder = undefined;
  }
}
