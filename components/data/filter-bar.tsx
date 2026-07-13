"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FilterSheet } from "./filter-sheet";
import { useUrlFilters } from "@/hooks/use-url-filters";

export interface FilterOption {
  value: string;
  label: string;
}
export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

export function FilterBar({
  filters,
  search = true,
  searchPlaceholder = "Search…",
}: {
  filters: FilterDef[];
  search?: boolean;
  searchPlaceholder?: string;
}) {
  const { get, set, clear, hasAny } = useUrlFilters();
  const [term, setTerm] = useState(get("search"));
  const activeCount = filters.filter((f) => get(f.key)).length + (get("search") ? 1 : 0);

  // Debounce free-text search into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (term !== get("search")) set({ search: term || undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  return (
    <FilterSheet activeCount={activeCount}>
      {filters.map((f) => (
        <Select
          key={f.key}
          label={f.label}
          value={get(f.key)}
          onChange={(e) => set({ [f.key]: e.target.value || undefined })}
          className="min-w-[9rem]"
        >
          <option value="">All</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ))}
      {search && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-search" className="text-xs font-medium text-fg-muted">
            Search
          </label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
              aria-hidden
            />
            <input
              id="filter-search"
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={searchPlaceholder}
              spellCheck={false}
              className="h-10 w-56 rounded-[var(--radius-md)] border border-border-strong bg-surface pl-8 pr-3 text-sm text-fg placeholder:text-fg-subtle"
            />
          </div>
        </div>
      )}
      {hasAny && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setTerm("");
            clear();
          }}
        >
          <X size={15} aria-hidden /> Clear
        </Button>
      )}
    </FilterSheet>
  );
}
