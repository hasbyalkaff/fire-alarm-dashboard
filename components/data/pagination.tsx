"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { formatNumber } from "@/lib/utils";
import type { Paginated } from "@/lib/types";

export function Pagination({
  meta,
  pageSizeOptions,
}: {
  meta: Paginated<unknown>["meta"];
  /** When provided, renders a page-size selector wired to the `pageSize` URL param. */
  pageSizeOptions?: number[];
}) {
  const { set } = useUrlFilters();
  const { page, pageSize, total, totalPages } = meta;
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const go = (p: number) => set({ page: String(p) }, { resetPage: false });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-fg-muted">
      <span className="tnum">
        {formatNumber(first)}–{formatNumber(last)} of {formatNumber(total)}
      </span>
      <div className="flex items-center gap-2">
        {pageSizeOptions && pageSizeOptions.length > 0 && (
          <label className="mr-1 flex items-center gap-1.5 text-xs">
            <span className="sr-only sm:not-sr-only">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => set({ pageSize: e.target.value })}
              aria-label="Rows per page"
              className="h-9 rounded-[var(--radius-md)] border border-border-strong bg-surface px-2 text-sm text-fg"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </label>
        )}
        <span className="tnum text-xs">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          aria-label="Previous page"
          className="min-h-11 min-w-11 px-0"
        >
          <ChevronLeft size={16} aria-hidden />
        </Button>
        <Button
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => go(page + 1)}
          aria-label="Next page"
          className="min-h-11 min-w-11 px-0"
        >
          <ChevronRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
