"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";
import { StatusDot } from "./status-badge";
import type { DeviceStatus } from "@/lib/types";

/**
 * The signature component. Calm at rest; when it represents a problem status and
 * its count is positive it adopts the status tint + a coloured left border, and
 * flashes once when the count increases. Reduced motion disables the flash.
 */
export function StatusTile({
  label,
  value,
  activeStatus,
  restingHint,
  activeHint,
  href,
}: {
  label: string;
  value: number;
  activeStatus?: DeviceStatus;
  restingHint?: string;
  activeHint?: string;
  href?: string;
}) {
  const active = Boolean(activeStatus) && value > 0;
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (active && value > prev.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1500);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value, active]);

  const style = active
    ? { borderLeftColor: `var(--status-${activeStatus}-icon)`, backgroundColor: `var(--status-${activeStatus}-bg)` }
    : undefined;

  const body = (
    <div
      style={style}
      className={cn(
        "flex h-full flex-col justify-between gap-3 rounded-[var(--radius-md)] border border-l-4 border-border border-l-transparent bg-surface p-5 transition-colors",
        active && "border-l-4",
        flash && "animate-alarm",
        href && "hover:border-border-strong",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-fg-muted">{label}</span>
        {activeStatus && <StatusDot status={active ? activeStatus : "normal"} />}
      </div>
      <div>
        <div className="tnum text-4xl font-bold leading-none text-fg">{formatNumber(value)}</div>
        <div className="mt-1.5 text-xs text-fg-subtle">
          {active ? activeHint ?? "Needs attention" : restingHint ?? "All normal"}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-[var(--radius-md)]">
        {body}
      </Link>
    );
  }
  return body;
}
