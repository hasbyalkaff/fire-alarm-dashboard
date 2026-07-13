"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { formatNumber } from "@/lib/utils";
import type { Paginated } from "@/lib/types";

export function Pagination({ meta }: { meta: Paginated<unknown>["meta"] }) {
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
        <span className="tnum text-xs">
          Page {page} of {totalPages}
        </span>
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Previous page">
          <ChevronLeft size={16} aria-hidden />
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => go(page + 1)} aria-label="Next page">
          <ChevronRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
