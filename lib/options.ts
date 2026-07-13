import { getPanels } from "@/lib/dal";
import type { FilterOption } from "@/components/data/filter-bar";

/** Panel dropdown options for filter bars (server-side). */
export function panelOptions(): FilterOption[] {
  return getPanels({ pageSize: 200 }).data.map((p) => ({ value: String(p.id), label: p.name }));
}
