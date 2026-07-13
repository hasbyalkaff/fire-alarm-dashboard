"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceStatus, Paginated } from "@/lib/types";
import { useDensity, ROW_HEIGHT } from "@/hooks/use-density";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "./states";
import { Pagination } from "./pagination";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  mono?: boolean;
  align?: "left" | "right";
  /** Click-to-sort. The column `key` is sent to the server as `?sort=<key>`. */
  sortable?: boolean;
}

const HEADER_HEIGHT = 40;
const VIRTUALIZE_OVER = 500; // PRD AC-L2

type SortDir = "asc" | "desc";

export function DataTable<T>({
  resource,
  columns,
  rowKey,
  rowHref,
  rowLabel,
  rowStatus,
  gridTemplate,
  minWidth = 720,
  emptyTitle,
  emptyHint,
  extraParams,
}: {
  resource: string;
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  rowHref?: (row: T) => string;
  /** Accessible name for the whole-row navigation link (screen readers). */
  rowLabel?: (row: T) => string;
  rowStatus?: (row: T) => DeviceStatus;
  gridTemplate: string;
  minWidth?: number;
  emptyTitle: string;
  emptyHint?: string;
  extraParams?: Record<string, string>;
}) {
  const search = useSearchParams();
  const qs = new URLSearchParams(search.toString());
  if (extraParams) for (const [k, v] of Object.entries(extraParams)) qs.set(k, v);
  const query = qs.toString();

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: [resource, query],
    queryFn: async (): Promise<Paginated<T>> => {
      const res = await fetch(`/api/${resource}?${query}`);
      if (!res.ok) throw new Error(`Failed to load ${resource}`);
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const hasRows = Boolean(data && data.data.length > 0);

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
      {isPending ? (
        <div className="divide-y divide-border" aria-busy>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center px-4" style={{ height: ROW_HEIGHT.comfortable }}>
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={`Couldn't load ${resource}.`} onRetry={() => refetch()} />
      ) : !hasRows ? (
        <EmptyState title={emptyTitle} hint={emptyHint} />
      ) : (
        <>
          {/* Tablet and up: the full table. Horizontal/vertical overflow is contained
              here so the page itself never scrolls sideways (Design System §11). */}
          <DesktopTable
            rows={data!.data}
            columns={columns}
            rowKey={rowKey}
            rowHref={rowHref}
            rowLabel={rowLabel}
            rowStatus={rowStatus}
            gridTemplate={gridTemplate}
            minWidth={minWidth}
            isFetching={isFetching}
          />
          {/* Phone: one status-led card per row instead of a sideways-scrolling table. */}
          <ul className="divide-y divide-border md:hidden" aria-busy={isFetching}>
            {data!.data.map((row) => (
              <MobileCard key={rowKey(row)} row={row} columns={columns} rowHref={rowHref} rowStatus={rowStatus} />
            ))}
          </ul>
        </>
      )}
      {hasRows && <Pagination meta={data!.meta} pageSizeOptions={[50, 100, 200]} />}
    </div>
  );
}

/** Reads the active sort from the URL and cycles asc → desc → unsorted on click. */
function useSort() {
  const search = useSearchParams();
  const { set } = useUrlFilters();
  const sortKey = search.get("sort") ?? undefined;
  const dir: SortDir = search.get("dir") === "desc" ? "desc" : "asc";
  const cycle = (key: string) => {
    if (sortKey !== key) set({ sort: key, dir: "asc" });
    else if (dir === "asc") set({ sort: key, dir: "desc" });
    else set({ sort: undefined, dir: undefined });
  };
  return { sortKey, dir, cycle };
}

function HeaderRow<T>({
  columns,
  rowHref,
  gridTemplate,
  sticky,
}: {
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  gridTemplate: string;
  sticky?: boolean;
}) {
  const { sortKey, dir, cycle } = useSort();
  return (
    <div
      role="row"
      className={cn(
        "grid items-center gap-3 border-b border-border bg-surface-muted px-4 text-xs font-semibold uppercase tracking-wide text-fg-muted",
        sticky && "sticky top-0 z-10",
      )}
      style={{ gridTemplateColumns: rowHref ? `${gridTemplate} 16px` : gridTemplate, height: HEADER_HEIGHT }}
    >
      {columns.map((c) => {
        const active = sortKey === c.key;
        return (
          <div
            key={c.key}
            role="columnheader"
            aria-sort={c.sortable ? (active ? (dir === "asc" ? "ascending" : "descending") : "none") : undefined}
            className={cn("min-w-0", c.align === "right" && "text-right")}
          >
            {c.sortable ? (
              <button
                type="button"
                onClick={() => cycle(c.key)}
                className={cn(
                  "-mx-1 inline-flex max-w-full items-center gap-1 rounded px-1 py-0.5 uppercase hover:text-fg",
                  c.align === "right" && "flex-row-reverse",
                  active && "text-fg",
                )}
              >
                <span className="truncate">{c.header}</span>
                {active ? (
                  dir === "asc" ? (
                    <ChevronUp size={13} aria-hidden />
                  ) : (
                    <ChevronDown size={13} aria-hidden />
                  )
                ) : (
                  <ChevronsUpDown size={13} className="text-fg-subtle" aria-hidden />
                )}
              </button>
            ) : (
              <span className="truncate">{c.header}</span>
            )}
          </div>
        );
      })}
      {rowHref && <div role="columnheader" aria-label="Open" />}
    </div>
  );
}

function DesktopTable<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  rowLabel,
  rowStatus,
  gridTemplate,
  minWidth,
  isFetching,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  rowHref?: (row: T) => string;
  rowLabel?: (row: T) => string;
  rowStatus?: (row: T) => DeviceStatus;
  gridTemplate: string;
  minWidth: number;
  isFetching: boolean;
}) {
  const density = useDensity((s) => s.density);
  const rowHeight = ROW_HEIGHT[density];
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualize = rows.length > VIRTUALIZE_OVER;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 12,
    enabled: virtualize,
  });

  // Density changes the row height; re-measure so the virtual body resizes (Context7:
  // TanStack Virtual — call measure() after estimateSize changes).
  useEffect(() => {
    if (virtualize) virtualizer.measure();
  }, [rowHeight, virtualize, virtualizer]);

  // The row is a real `role="row"`; navigation is a real <Link> that covers the row
  // (absolute inset), so screen readers announce a named link — not a "row" — while a
  // click anywhere still navigates (Design System §9.3, and fixes role="row" on <a>).
  const rowClass = (alarm: boolean) =>
    cn("relative grid items-center gap-3 px-4 text-sm text-fg", rowHref && "hover:bg-surface-muted", alarm && "ring-2 ring-inset");
  const rowStyle = (alarm: boolean) =>
    ({
      gridTemplateColumns: rowHref ? `${gridTemplate} 16px` : gridTemplate,
      height: rowHeight,
      ...(alarm ? { boxShadow: "inset 0 0 0 2px var(--status-alarm-strong)" } : {}),
    }) as React.CSSProperties;

  const RowInner = ({ row }: { row: T }) => {
    const alarm = rowStatus?.(row) === "alarm";
    return (
      <div role="row" className={rowClass(alarm)} style={rowStyle(alarm)}>
        {columns.map((c) => (
          <div
            key={c.key}
            role="cell"
            className={cn("min-w-0 truncate", c.mono && "font-mono text-[13px]", c.align === "right" && "text-right tnum")}
          >
            {c.cell(row)}
          </div>
        ))}
        {rowHref && (
          <div role="cell" className="flex items-center justify-end">
            <ChevronRight size={16} className="text-fg-subtle" aria-hidden />
            <Link
              href={rowHref(row)}
              aria-label={rowLabel?.(row) ?? "Open row"}
              className="absolute inset-0 rounded-[var(--radius-md)]"
            />
          </div>
        )}
      </div>
    );
  };

  // Large lists (> 500 rows): one contained scroll area with a sticky header, so the
  // column labels stay visible while scrolling thousands of devices (Design System §9.3).
  if (virtualize) {
    return (
      <div role="table" aria-busy={isFetching} className="hidden md:block">
        <div ref={parentRef} className="max-h-[70vh] overflow-auto" style={{ contain: "strict" }}>
          <div style={{ minWidth }}>
            <HeaderRow columns={columns} rowHref={rowHref} gridTemplate={gridTemplate} sticky />
            <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
              {virtualizer.getVirtualItems().map((vi) => {
                const row = rows[vi.index];
                return (
                  <div
                    key={rowKey(row)}
                    className="absolute left-0 top-0 w-full border-b border-border"
                    style={{ transform: `translateY(${vi.start}px)` }}
                  >
                    <RowInner row={row} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div role="table" aria-busy={isFetching} className="hidden overflow-x-auto md:block">
      <div style={{ minWidth }}>
        <HeaderRow columns={columns} rowHref={rowHref} gridTemplate={gridTemplate} />
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <Fragment key={rowKey(row)}>
              <RowInner row={row} />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// Below `md`, each row becomes a card: status leads, the primary label is the title,
// and the remaining columns render as labelled pairs (Design System §11).
function MobileCard<T>({
  row,
  columns,
  rowHref,
  rowStatus,
}: {
  row: T;
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  rowStatus?: (row: T) => DeviceStatus;
}) {
  const statusCol = columns.find((c) => c.key === "status") ?? columns.find((c) => c.key === "severity");
  const titleCol =
    columns.find((c) => ["device", "name", "label"].includes(c.key)) ?? columns.find((c) => c !== statusCol);
  const rest = columns.filter((c) => c !== statusCol && c !== titleCol);
  const alarm = rowStatus?.(row) === "alarm";

  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        {statusCol ? <div className="min-w-0">{statusCol.cell(row)}</div> : <span />}
        {rowHref && <ChevronRight size={16} className="shrink-0 text-fg-subtle" aria-hidden />}
      </div>
      {titleCol && <div className="min-w-0 text-sm">{titleCol.cell(row)}</div>}
      {rest.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {rest.map((c) => (
            <div key={c.key} className="flex min-w-0 flex-col gap-0.5">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-fg-subtle">{c.header}</dt>
              <dd className={cn("min-w-0 truncate text-sm text-fg-muted", c.mono && "font-mono text-[13px]")}>
                {c.cell(row)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );

  const className = cn("flex flex-col gap-3 p-4", rowHref && "hover:bg-surface-muted");
  const style = alarm ? ({ boxShadow: "inset 0 0 0 2px var(--status-alarm-strong)" } as React.CSSProperties) : undefined;

  return (
    <li>
      {rowHref ? (
        <Link href={rowHref(row)} className={className} style={style}>
          {inner}
        </Link>
      ) : (
        <div className={className} style={style}>
          {inner}
        </div>
      )}
    </li>
  );
}
