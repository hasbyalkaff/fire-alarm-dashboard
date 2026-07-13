"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { FilterBar, type FilterOption } from "@/components/data/filter-bar";
import { Timeline } from "@/components/data/timeline";
import { EmptyState, ErrorState } from "@/components/data/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { formatNumber } from "@/lib/utils";
import type { EventDTO, Paginated } from "@/lib/types";

const SEVERITY_OPTS: FilterOption[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];
const TYPE_OPTS: FilterOption[] = [
  { value: "alarm", label: "Alarm" },
  { value: "fault", label: "Fault" },
  { value: "restore", label: "Restore" },
  { value: "offline", label: "Offline" },
  { value: "online", label: "Online" },
];

export function EventsView({ panelOptions }: { panelOptions: FilterOption[] }) {
  return (
    <Suspense>
      <EventsInner panelOptions={panelOptions} />
    </Suspense>
  );
}

function EventsInner({ panelOptions }: { panelOptions: FilterOption[] }) {
  const search = useSearchParams();
  const { get, set } = useUrlFilters();
  const [limit, setLimit] = useState(50);

  const qs = new URLSearchParams(search.toString());
  qs.set("pageSize", String(limit));
  qs.set("page", "1");
  const query = qs.toString();

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["events", query],
    queryFn: async (): Promise<Paginated<EventDTO>> => {
      const res = await fetch(`/api/events?${query}`);
      if (!res.ok) throw new Error("failed");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="text-xs font-medium text-fg-muted">From</label>
          <input id="from" type="date" value={get("from")} onChange={(e) => set({ from: e.target.value || undefined })}
            className="h-9 rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-sm text-fg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="text-xs font-medium text-fg-muted">To</label>
          <input id="to" type="date" value={get("to")} onChange={(e) => set({ to: e.target.value || undefined })}
            className="h-9 rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-sm text-fg" />
        </div>
        <Select label="Severity" value={get("severity")} onChange={(e) => set({ severity: e.target.value || undefined })} className="min-w-[9rem]">
          <option value="">All</option>
          {SEVERITY_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select label="Type" value={get("type")} onChange={(e) => set({ type: e.target.value || undefined })} className="min-w-[9rem]">
          <option value="">All</option>
          {TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <FilterBar search={false} filters={[{ key: "panelId", label: "Panel", options: panelOptions }]} />
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : isError ? (
        <ErrorState message="Couldn't load event history." onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No events match" hint="Adjust the date range or filters." />
      ) : (
        <>
          <Timeline events={data.data} />
          <div className="flex items-center justify-center gap-3 pt-2 text-sm text-fg-subtle">
            <span className="tnum">Showing {formatNumber(data.data.length)} of {formatNumber(data.meta.total)}</span>
            {data.data.length < data.meta.total && (
              <Button variant="secondary" size="sm" onClick={() => setLimit((n) => n + 50)}>Load more</Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
