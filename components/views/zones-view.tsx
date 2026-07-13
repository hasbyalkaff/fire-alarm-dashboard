"use client";

import { Suspense } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { FilterBar, type FilterOption } from "@/components/data/filter-bar";
import { StatusBadge } from "@/components/status/status-badge";
import type { ZoneDTO } from "@/lib/types";

const columns: Column<ZoneDTO>[] = [
  { key: "status", header: "Status", sortable: true, cell: (z) => <StatusBadge status={z.status} size="sm" /> },
  { key: "name", header: "Zone", sortable: true, cell: (z) => <span className="font-medium text-fg">{z.name}</span> },
  { key: "building", header: "Building", sortable: true, cell: (z) => <span className="truncate text-fg-muted">{z.building}</span> },
  { key: "panel", header: "Panel", sortable: true, cell: (z) => <span className="text-fg-muted">{z.panelName}</span> },
  { key: "devices", header: "Devices", sortable: true, align: "right", cell: (z) => <span className="text-fg-muted">{z.deviceCount}</span> },
];

const STATUS_OPTS: FilterOption[] = [
  { value: "alarm", label: "Alarm" },
  { value: "fault", label: "Fault" },
  { value: "offline", label: "Offline" },
  { value: "normal", label: "Normal" },
];

export function ZonesView({ panelOptions }: { panelOptions: FilterOption[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Suspense>
        <FilterBar
          filters={[
            { key: "status", label: "Status", options: STATUS_OPTS },
            { key: "panelId", label: "Panel", options: panelOptions },
          ]}
          searchPlaceholder="Search zones…"
        />
        <DataTable<ZoneDTO>
          resource="zones"
          columns={columns}
          rowKey={(z) => z.id}
          rowHref={(z) => `/zones/${z.id}`}
          rowLabel={(z) => `${z.name}, ${z.status}`}
          rowStatus={(z) => z.status}
          gridTemplate="130px minmax(140px,1.4fr) 1fr 1fr 90px"
          minWidth={760}
          emptyTitle="No zones match"
        />
      </Suspense>
    </div>
  );
}
