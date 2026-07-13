"use client";

import { Suspense } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { FilterBar, type FilterOption } from "@/components/data/filter-bar";
import { SeverityBadge, StatusBadge } from "@/components/status/status-badge";
import { formatTime } from "@/lib/utils";
import type { AlarmDTO } from "@/lib/types";

const columns: Column<AlarmDTO>[] = [
  { key: "time", header: "Time", sortable: true, mono: true, cell: (a) => <span className="text-fg-muted">{formatTime(a.timestamp)}</span> },
  { key: "severity", header: "Severity", sortable: true, cell: (a) => <SeverityBadge severity={a.severity} /> },
  { key: "device", header: "Device", sortable: true, cell: (a) => <span className="truncate font-medium text-fg">{a.device}</span> },
  { key: "zone", header: "Zone", sortable: true, cell: (a) => <span className="truncate text-fg-muted">{a.zone}</span> },
  { key: "panel", header: "Panel", sortable: true, cell: (a) => <span className="text-fg-muted">{a.panel}</span> },
  { key: "status", header: "Status", cell: () => <StatusBadge status="alarm" size="sm" /> },
];

const SEVERITY_OPTS: FilterOption[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function AlarmsView({ panelOptions }: { panelOptions: FilterOption[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense>
        <FilterBar
          search={false}
          filters={[
            { key: "severity", label: "Severity", options: SEVERITY_OPTS },
            { key: "panelId", label: "Panel", options: panelOptions },
          ]}
        />
        <DataTable<AlarmDTO>
          resource="alarms"
          columns={columns}
          rowKey={(a) => a.id}
          rowHref={(a) => `/devices/${a.deviceId}`}
          rowLabel={(a) => `${a.device}, ${a.severity} alarm, ${a.zone}`}
          rowStatus={() => "alarm"}
          gridTemplate="100px 110px minmax(150px,1.4fr) 1fr 1fr 110px"
          minWidth={820}
          emptyTitle="All Normal"
          emptyHint="0 active alarms. Everything is operating normally."
        />
      </Suspense>
    </div>
  );
}
