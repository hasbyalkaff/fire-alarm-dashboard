import { StaleNote } from "@/components/feedback/stale-note";

export function PageHeader({
  title,
  description,
  actions,
  showStale,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Show a per-surface "data may be delayed" note when the live stream drops (§9.6). */
  showStale?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-fg text-balance">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
        {showStale && (
          <div className="mt-1.5">
            <StaleNote />
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
