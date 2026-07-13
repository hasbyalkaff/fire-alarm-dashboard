"use client";

import { Fragment, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeviceStatus, Paginated } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "./states";
import { Pagination } from "./pagination";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  mono?: boolean;
  align?: "left" | "right";
}

const ROW_HEIGHT = 48;
const VIRTUALIZE_OVER = 500; // PRD AC-L2

export function DataTable<T>({
  resource,
  columns,
  rowKey,
  rowHref,
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

  const header = (
    <div
      role="row"
      className="grid items-center gap-3 border-b border-border bg-surface-muted px-4 text-xs font-semibold uppercase tracking-wide text-fg-muted"
      style={{ gridTemplateColumns: rowHref ? `${gridTemplate} 16px` : gridTemplate, height: 40 }}
    >
      {columns.map((c) => (
        <div key={c.key} role="columnheader" className={cn("truncate", c.align === "right" && "text-right")}>
          {c.header}
        </div>
      ))}
      {rowHref && <div role="columnheader" aria-label="Open" />}
    </div>
  );

  const hasRows = Boolean(data && data.data.length > 0);

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
      {isPending ? (
        <div className="divide-y divide-border" aria-busy>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center px-4" style={{ height: ROW_HEIGHT }}>
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
          {/* Tablet and up: the full table. Horizontal overflow is contained here so the
              page itself never scrolls sideways (Design System §11). */}
          <div role="table" aria-busy={isFetching} className="hidden overflow-x-auto md:block">
            <div style={{ minWidth }}>
              {header}
              <TableBody
                rows={data!.data}
                columns={columns}
                rowKey={rowKey}
                rowHref={rowHref}
                rowStatus={rowStatus}
                gridTemplate={gridTemplate}
              />
            </div>
          </div>
          {/* Phone: one status-led card per row instead of a sideways-scrolling table. */}
          <ul className="divide-y divide-border md:hidden" aria-busy={isFetching}>
            {data!.data.map((row) => (
              <MobileCard key={rowKey(row)} row={row} columns={columns} rowHref={rowHref} rowStatus={rowStatus} />
            ))}
          </ul>
        </>
      )}
      {hasRows && <Pagination meta={data!.meta} />}
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

function TableBody<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  rowStatus,
  gridTemplate,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  rowHref?: (row: T) => string;
  rowStatus?: (row: T) => DeviceStatus;
  gridTemplate: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualize = rows.length > VIRTUALIZE_OVER;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    enabled: virtualize,
  });

  const RowInner = ({ row }: { row: T }) => {
    const alarm = rowStatus?.(row) === "alarm";
    const content = (
      <>
        {columns.map((c) => (
          <div
            key={c.key}
            role="cell"
            className={cn("min-w-0 truncate", c.mono && "font-mono text-[13px]", c.align === "right" && "text-right tnum")}
          >
            {c.cell(row)}
          </div>
        ))}
        {rowHref && <ChevronRight size={16} className="text-fg-subtle" aria-hidden />}
      </>
    );
    const className = cn(
      "grid items-center gap-3 px-4 text-sm text-fg",
      rowHref && "hover:bg-surface-muted",
      alarm && "ring-2 ring-inset",
    );
    const style = {
      gridTemplateColumns: rowHref ? `${gridTemplate} 16px` : gridTemplate,
      height: ROW_HEIGHT,
      ...(alarm ? { boxShadow: "inset 0 0 0 2px var(--status-alarm-strong)" } : {}),
    } as React.CSSProperties;

    if (rowHref) {
      return (
        <Link href={rowHref(row)} role="row" className={className} style={style}>
          {content}
        </Link>
      );
    }
    return (
      <div role="row" className={className} style={style}>
        {content}
      </div>
    );
  };

  if (!virtualize) {
    return (
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <Fragment key={rowKey(row)}>
            <RowInner row={row} />
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="max-h-[60vh] overflow-auto" style={{ contain: "strict" }}>
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
  );
}
