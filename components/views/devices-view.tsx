"use client";

import { Suspense } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { FilterBar, type FilterOption } from "@/components/data/filter-bar";
import { StatusBadge, SeverityBadge } from "@/components/status/status-badge";
import { DeviceTypeIcon } from "@/components/status/status-icon";
import { relativeTime } from "@/lib/utils";
import type { DeviceListItem } from "@/lib/types";

const columns: Column<DeviceListItem>[] = [
  { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} size="sm" /> },
  {
    key: "device",
    header: "Device",
    cell: (d) => (
      <span className="flex items-center gap-2">
        <DeviceTypeIcon type={d.type} />
        <span className="truncate font-medium text-fg">{d.label}</span>
      </span>
    ),
  },
  { key: "type", header: "Type", cell: (d) => <span className="text-fg-muted">{d.typeLabel}</span> },
  { key: "zone", header: "Zone", cell: (d) => <span className="truncate text-fg-muted">{d.zoneName}</span> },
  { key: "panel", header: "Panel", cell: (d) => <span className="text-fg-muted">{d.panelName}</span> },
  { key: "location", header: "Location", cell: (d) => <span className="truncate text-fg-muted">{d.location}</span> },
  { key: "severity", header: "Severity", cell: (d) => (d.severity ? <SeverityBadge severity={d.severity} /> : <span className="text-fg-subtle">–</span>) },
  { key: "updated", header: "Updated", mono: true, cell: (d) => <span className="text-fg-muted">{relativeTime(d.lastUpdate)}</span> },
];

const STATUS_OPTS: FilterOption[] = [
  { value: "alarm", label: "Alarm" },
  { value: "fault", label: "Fault" },
  { value: "offline", label: "Offline" },
  { value: "normal", label: "Normal" },
];
const TYPE_OPTS: FilterOption[] = [
  { value: "smoke", label: "Smoke Detector" },
  { value: "heat", label: "Heat Detector" },
  { value: "mcp", label: "Manual Call Point" },
  { value: "bell", label: "Fire Bell" },
  { value: "buzzer", label: "Buzzer" },
  { value: "io", label: "I/O Module" },
];

export function DevicesView({ panelOptions }: { panelOptions: FilterOption[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense>
        <FilterBar
          filters={[
            { key: "status", label: "Status", options: STATUS_OPTS },
            { key: "type", label: "Type", options: TYPE_OPTS },
            { key: "panelId", label: "Panel", options: panelOptions },
          ]}
          searchPlaceholder="Search label or location…"
        />
        <DataTable<DeviceListItem>
          resource="devices"
          columns={columns}
          rowKey={(d) => d.id}
          rowHref={(d) => `/devices/${d.id}`}
          rowStatus={(d) => d.status}
          gridTemplate="130px minmax(160px,1.4fr) 1fr 1fr 0.8fr 1fr 90px 110px"
          minWidth={980}
          emptyTitle="No devices match"
          emptyHint="Try clearing filters or adjusting your search."
        />
      </Suspense>
    </div>
  );
}
