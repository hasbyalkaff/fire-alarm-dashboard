import { cn } from "@/lib/utils";

export function KeyValue({
  items,
  mono,
}: {
  items: { label: string; value: React.ReactNode }[];
  mono?: boolean;
}) {
  return (
    <dl className="divide-y divide-border">
      {items.map((it) => (
        <div key={it.label} className="grid grid-cols-[minmax(8rem,10rem)_1fr] gap-3 py-2.5">
          <dt className="text-sm text-fg-subtle">{it.label}</dt>
          <dd className={cn("text-sm text-fg", mono && "font-mono text-[13px]")} translate={mono ? "no" : undefined}>
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
