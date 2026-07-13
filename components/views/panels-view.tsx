"use client";

import { Suspense } from "react";
import { DataTable, type Column } from "@/components/data/data-table";
import { FilterBar } from "@/components/data/filter-bar";
import { PanelStateBadge } from "@/components/status/status-badge";
import { relativeTime } from "@/lib/utils";
import type { PanelDTO } from "@/lib/types";

const columns: Column<PanelDTO>[] = [
  { key: "status", header: "Status", sortable: true, cell: (p) => <PanelStateBadge state={p.status} size="sm" /> },
  { key: "name", header: "Panel", sortable: true, cell: (p) => <span className="font-medium text-fg">{p.name}</span> },
  { key: "building", header: "Building", sortable: true, cell: (p) => <span className="truncate text-fg-muted">{p.building}</span> },
  { key: "location", header: "Location", sortable: true, cell: (p) => <span className="truncate text-fg-muted">{p.location}</span> },
  { key: "zones", header: "Zones", sortable: true, align: "right", cell: (p) => <span className="text-fg-muted">{p.zoneCount}</span> },
  { key: "comm", header: "Last Comm", sortable: true, mono: true, cell: (p) => <span className="text-fg-muted">{relativeTime(p.lastCommunication)}</span> },
];

export function PanelsView() {
  return (
    <div className="flex flex-col gap-4">
      <Suspense>
        <FilterBar
          filters={[{ key: "status", label: "Status", options: [{ value: "online", label: "Online" }, { value: "offline", label: "Offline" }] }]}
          searchPlaceholder="Search panels…"
        />
        <DataTable<PanelDTO>
          resource="panels"
          columns={columns}
          rowKey={(p) => p.id}
          rowHref={(p) => `/panels/${p.id}`}
          rowLabel={(p) => `${p.name}, ${p.status}`}
          rowStatus={(p) => (p.status === "offline" ? "offline" : "normal")}
          gridTemplate="130px minmax(120px,1fr) 1.2fr 1.4fr 80px 120px"
          minWidth={840}
          emptyTitle="No panels match"
        />
      </Suspense>
    </div>
  );
}
