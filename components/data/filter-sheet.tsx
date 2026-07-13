"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Below `md`, filter controls collapse behind a "Filters" button so they don't push
 * the content below the fold (Design System §11, UI Spec §7.7/§7.10). On `md`+ the
 * controls always render inline as a wrapping row.
 */
export function FilterSheet({ activeCount = 0, children }: { activeCount?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-md)] border border-border-strong px-3 text-sm font-medium text-fg hover:bg-surface-muted md:hidden"
      >
        <SlidersHorizontal size={16} aria-hidden />
        Filters
        {activeCount > 0 && (
          <span
            className="tnum inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--color-brand)", color: "var(--color-brand-fg)" }}
          >
            {activeCount}
          </span>
        )}
      </button>
      <div
        className={cn(
          "gap-3",
          open ? "flex flex-col" : "hidden",
          "md:flex md:flex-row md:flex-wrap md:items-end",
        )}
      >
        {children}
      </div>
    </div>
  );
}
