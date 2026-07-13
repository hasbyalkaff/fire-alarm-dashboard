// In-memory mock of the upstream domain database (panels/zones/devices/events).
// Stands in for the Modbus Feeder Service, which is OUT OF SCOPE per the PRD.
// The DAL reads from here; the mock feeder (lib/realtime) mutates it and emits SSE.
// A real deployment replaces this module with a read-only Postgres reader (dashboard_ro)
// behind the same DAL functions.

import type {
  AlarmEvent,
  ConnectionLogEntry,
  Device,
  DeviceStatus,
  DeviceType,
  Panel,
  RegisterEntry,
  Severity,
  Zone,
} from "@/lib/types";

// Deterministic PRNG so dev data is stable across restarts.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUILDINGS = ["Building 1", "Building 2", "Building 3", "Warehouse Complex"];
const ZONE_NAMES = [
  "Warehouse A", "Warehouse B", "Loading Bay", "Main Office", "Server Room",
  "Dispatch", "Reception", "Workshop", "Storage", "Corridor East",
  "Corridor West", "Plant Room", "Canteen", "Laboratory", "Archive",
];
const DEVICE_TYPES: DeviceType[] = ["smoke", "heat", "mcp", "bell", "buzzer", "io"];
const LOCATIONS = ["Row 1", "Row 2", "Row 3", "Ceiling N", "Ceiling S", "Exit E", "Exit W", "Dock", "Hall", "Stairwell"];

export interface MockDb {
  panels: Panel[];
  zones: Zone[];
  devices: Device[];
  events: AlarmEvent[];
  connectionLog: ConnectionLogEntry[];
  seq: { event: number; conn: number };
  lastUpdate: string;
}

function registerMapFor(type: DeviceType, address: number): RegisterEntry[] {
  const base = 40000 + address * 4;
  return [
    { register: base, name: "status", value: "0x0001" },
    { register: base + 1, name: "severity", value: "0x0000" },
    { register: base + 2, name: "type_code", value: `0x000${DEVICE_TYPES.indexOf(type) + 1}` },
    { register: base + 3, name: "last_seen", value: "0x00FF" },
  ];
}

function build(): MockDb {
  const rand = mulberry32(20260712);
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

  const panels: Panel[] = [];
  const zones: Zone[] = [];
  const devices: Device[] = [];
  const events: AlarmEvent[] = [];
  const connectionLog: ConnectionLogEntry[] = [];

  const now = Date.UTC(2026, 6, 12, 9, 31, 4); // fixed clock for stable seed
  let zoneId = 1;
  let deviceId = 1;
  let eventId = 1;
  let connId = 1;

  const PANEL_COUNT = 12;
  for (let p = 1; p <= PANEL_COUNT; p++) {
    const building = pick(BUILDINGS);
    // 2 of 12 panels start offline (matches sample summary: 10 online / 2 offline).
    const offline = p === 4 || p === 9;
    const panel: Panel = {
      id: p,
      name: `Panel ${String.fromCharCode(64 + p)}`,
      building,
      location: `${building} - ${pick(LOCATIONS)}`,
      status: offline ? "offline" : "online",
      lastCommunication: new Date(now - (offline ? 4 * 60_000 : Math.floor(rand() * 8_000))).toISOString(),
    };
    panels.push(panel);

    const zoneCount = 3 + Math.floor(rand() * 3); // 3-5 zones
    for (let z = 0; z < zoneCount; z++) {
      const zone: Zone = {
        id: zoneId++,
        panelId: p,
        name: `${pick(ZONE_NAMES)} ${z + 1}`,
        building,
      };
      zones.push(zone);

      const deviceCount = 20 + Math.floor(rand() * 20); // 20-39 devices/zone
      for (let d = 0; d < deviceCount; d++) {
        const type = pick(DEVICE_TYPES);
        const address = d + 1;
        let status: DeviceStatus = offline ? "offline" : "normal";
        let severity: Severity | null = null;
        // Seed a couple of faults so the fault view is not empty.
        if (!offline && rand() < 0.015) {
          status = "fault";
          severity = "medium";
        }
        const device: Device = {
          id: deviceId++,
          zoneId: zone.id,
          panelId: p,
          address,
          type,
          label: `${labelPrefix(type)} ${address}`,
          location: `${zone.name} - ${pick(LOCATIONS)}`,
          registerMap: registerMapFor(type, address),
          status,
          severity,
          lastUpdate: new Date(now - Math.floor(rand() * 60_000)).toISOString(),
        };
        devices.push(device);

        if (status === "fault") {
          events.push({
            id: eventId++, deviceId: device.id, zoneId: zone.id, panelId: p,
            eventType: "fault", severity, status: "active",
            createdAt: device.lastUpdate, restoredAt: null,
          });
        }
      }
    }

    // A little historical event + connection noise for the timeline.
    connectionLog.push({
      id: connId++, panelId: p, event: offline ? "disconnect" : "connect",
      occurredAt: new Date(now - Math.floor(rand() * 3 * 3600_000)).toISOString(),
    });
  }

  // Seed one active critical alarm (matches sample: Panel A / Warehouse A / Smoke).
  const seedDevice = devices.find((d) => d.type === "smoke" && d.status === "normal")!;
  seedDevice.status = "alarm";
  seedDevice.severity = "critical";
  seedDevice.lastUpdate = new Date(now).toISOString();
  events.push({
    id: eventId++, deviceId: seedDevice.id, zoneId: seedDevice.zoneId, panelId: seedDevice.panelId,
    eventType: "alarm", severity: "critical", status: "active",
    createdAt: seedDevice.lastUpdate, restoredAt: null,
  });

  // Some historical (restored) events across the last few days for Event History.
  for (let i = 0; i < 60; i++) {
    const dev = devices[Math.floor(rand() * devices.length)];
    const created = now - Math.floor(rand() * 6 * 24 * 3600_000);
    const isAlarm = rand() < 0.5;
    events.push({
      id: eventId++, deviceId: dev.id, zoneId: dev.zoneId, panelId: dev.panelId,
      eventType: isAlarm ? "alarm" : "fault",
      severity: isAlarm ? pick<Severity>(["critical", "high"]) : "medium",
      status: "restored",
      createdAt: new Date(created).toISOString(),
      restoredAt: new Date(created + 3600_000).toISOString(),
    });
  }

  events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    panels, zones, devices, events, connectionLog,
    seq: { event: eventId, conn: connId },
    lastUpdate: new Date(now).toISOString(),
  };
}

function labelPrefix(type: DeviceType) {
  return {
    smoke: "Smoke Detector", heat: "Heat Detector", mcp: "MCP",
    bell: "Bell", buzzer: "Buzzer", io: "I/O Module",
  }[type];
}

// Singleton across HMR / route invocations.
const g = globalThis as unknown as { __facpDb?: MockDb };
export function db(): MockDb {
  if (!g.__facpDb) g.__facpDb = build();
  return g.__facpDb;
}
