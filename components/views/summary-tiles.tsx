"use client";

import { useEffect } from "react";
import { useRealtime } from "@/hooks/realtime-store";
import { StatusTile } from "@/components/status/status-tile";
import { StaleNote } from "@/components/feedback/stale-note";
import { relativeTime } from "@/lib/utils";
import { useState } from "react";
import type { DashboardSummary } from "@/lib/types";

// Seeds the store with the server-rendered summary, then reflects live SSE updates.
export function SummaryTiles({ initial }: { initial: DashboardSummary }) {
  const setSummary = useRealtime((s) => s.setSummary);
  const summary = useRealtime((s) => s.summary) ?? initial;

  useEffect(() => {
    if (!useRealtime.getState().summary) setSummary(initial);
  }, [initial, setSummary]);

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {/* Live counts are visual; mirror them to a polite region so screen-reader users
          hear count changes (a new fault, a panel dropping offline) without a toast. */}
      <p className="sr-only" role="status" aria-live="polite">
        {plural(summary.activeAlarms, "active alarm", "active alarms")},{" "}
        {plural(summary.activeFaults, "active fault", "active faults")},{" "}
        {plural(summary.panelsOffline, "panel offline", "panels offline")}.
      </p>
      {/* Active Alarms leads: first in DOM and first visually at every breakpoint, so the
          most important tile is where the eye and the screen reader land first — and the
          remaining tiles flow after it with no empty leading cells. */}
      <StatusTile
        label="Active Alarms"
        value={summary.activeAlarms}
        activeStatus="alarm"
        restingHint="0 / All Normal"
        activeHint="Active alarm"
        href="/alarms"
      />
      <StatusTile label="Panels Online" value={summary.panelsOnline} restingHint="Communicating" href="/panels" />
      <StatusTile
        label="Panels Offline"
        value={summary.panelsOffline}
        activeStatus="offline"
        restingHint="All communicating"
        activeHint="No communication"
        href="/panels?status=offline"
      />
      <StatusTile
        label="Active Faults"
        value={summary.activeFaults}
        activeStatus="fault"
        restingHint="No faults"
        activeHint="Needs maintenance"
        href="/devices?status=fault"
      />
      <StatusTile label="Active Devices" value={summary.activeDevices} restingHint="Reporting" href="/devices" />
      <LastUpdate iso={summary.lastUpdate} />
    </div>
  );
}

function LastUpdate({ iso }: { iso: string }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-subtle sm:col-span-3 lg:col-span-5">
      <span className="flex items-center gap-2">
        <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: "var(--status-normal-icon)" }} aria-hidden />
        Last update <span className="tnum text-fg-muted">{relativeTime(iso)}</span>
      </span>
      <StaleNote />
    </div>
  );
}
