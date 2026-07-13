import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-1.5 text-sm text-fg-muted">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {it.href ? (
              <Link href={it.href} className="hover:text-fg hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="font-medium text-fg" aria-current="page">
                {it.label}
              </span>
            )}
            {i < items.length - 1 && <ChevronRight size={14} className="text-fg-subtle" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
