"use client";

import { useEffect, useId, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Minimal accessible modal: labelled + described, Esc to close, backdrop click, focus
// moves in and is trapped (Tab cycles within the panel), restores on close, overscroll
// contained. (Radix Dialog is the production choice.)
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
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const panel = ref.current;
    restore.current = document.activeElement as HTMLElement;

    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // Trap Tab within the panel so keyboard users can't reach the page behind it.
      if (e.shiftKey && (active === first || !panel?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restore.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={description ? descId : undefined}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-elevated shadow-xl [overscroll-behavior:contain]"
      >
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          {description && (
            <p id={descId} className="mt-1 text-sm text-fg-muted">
              {description}
            </p>
          )}
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
