"use client";

import { useEffect, useRef } from "react";

// Minimal accessible modal: labelled, Esc to close, backdrop click, focus moves in
// and restores on close, overscroll contained. (Radix Dialog is the production choice.)
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restore.current = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const first = ref.current?.querySelector<HTMLElement>("input, select, button, textarea, [tabindex]");
    first?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      restore.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-elevated shadow-xl [overscroll-behavior:contain]"
      >
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
