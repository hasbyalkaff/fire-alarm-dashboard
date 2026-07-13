"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { type FilterOption } from "@/components/data/filter-bar";
import { FilterSheet } from "@/components/data/filter-sheet";
import { Timeline } from "@/components/data/timeline";
import { Pagination } from "@/components/data/pagination";
import { EmptyState, ErrorState } from "@/components/data/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Select } from "@/components/ui/field";
import { useUrlFilters } from "@/hooks/use-url-filters";
import type { EventDTO, Paginated } from "@/lib/types";

const PAGE_SIZE = 50;

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

  // Page and filters live in the URL so an investigation is deep-linkable and shareable
  // (UI Spec §9); changing a filter resets to page 1 via useUrlFilters.
  const qs = new URLSearchParams(search.toString());
  qs.set("pageSize", String(PAGE_SIZE));
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

  const activeCount = ["from", "to", "severity", "type", "panelId"].filter((k) => get(k)).length;

  return (
    <div className="flex flex-col gap-4">
      <FilterSheet activeCount={activeCount}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from" className="text-xs font-medium text-fg-muted">From</label>
          <input id="from" type="date" value={get("from")} onChange={(e) => set({ from: e.target.value || undefined })}
            className="h-10 rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-sm text-fg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="to" className="text-xs font-medium text-fg-muted">To</label>
          <input id="to" type="date" value={get("to")} onChange={(e) => set({ to: e.target.value || undefined })}
            className="h-10 rounded-[var(--radius-md)] border border-border-strong bg-surface px-3 text-sm text-fg" />
        </div>
        <Select label="Severity" value={get("severity")} onChange={(e) => set({ severity: e.target.value || undefined })} className="min-w-[9rem]">
          <option value="">All</option>
          {SEVERITY_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select label="Type" value={get("type")} onChange={(e) => set({ type: e.target.value || undefined })} className="min-w-[9rem]">
          <option value="">All</option>
          {TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
        <Select label="Panel" value={get("panelId")} onChange={(e) => set({ panelId: e.target.value || undefined })} className="min-w-[9rem]">
          <option value="">All</option>
          {panelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </FilterSheet>

      {isPending ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : isError ? (
        <ErrorState message="Couldn't load event history." onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No events match" hint="Adjust the date range or filters." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
          <div className="p-4">
            <Timeline events={data.data} />
          </div>
          <Pagination meta={data.meta} />
        </div>
      )}
    </div>
  );
}
