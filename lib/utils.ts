import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO timestamp as a locale time (HH:MM:SS). Client-safe via Intl. */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date(iso));
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  }).format(new Date(iso));
}

/** "3s ago", "4m ago", "2h ago" — relative, compact. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" });
  if (abs < 60) return rtf.format(Math.trunc(diff), "second");
  if (abs < 3600) return rtf.format(Math.trunc(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.trunc(diff / 3600), "hour");
  return rtf.format(Math.trunc(diff / 86400), "day");
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}
