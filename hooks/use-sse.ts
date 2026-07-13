"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/realtime-store";
import type { AlarmDTO, DashboardSummary } from "@/lib/types";

// Query keys that live-updating pages use, invalidated on relevant SSE events.
const LIST_KEYS = ["devices", "zones", "panels", "alarms", "events", "summary"];

/**
 * Owns the single EventSource for the app. Mounted once in the dashboard shell.
 * Applies deltas to the store and invalidates React Query caches so any open
 * table refetches. On (re)connect it resyncs by refetching the summary + lists
 * (PRD AC-I2). EventSource auto-reconnects with the server's retry directive.
 */
export function useSSE() {
  const queryClient = useQueryClient();
  const setConnection = useRealtime((s) => s.setConnection);
  const setSummary = useRealtime((s) => s.setSummary);
  const pushAlarm = useRealtime((s) => s.pushAlarm);

  useEffect(() => {
    const es = new EventSource("/api/sse");
    let hadError = false;

    const resync = () => {
      // Re-fetch snapshot + active lists so displayed state matches reality.
      fetch("/api/dashboard")
        .then((r) => (r.ok ? r.json() : null))
        .then((s: DashboardSummary | null) => s && setSummary(s))
        .catch(() => {});
      queryClient.invalidateQueries();
    };

    es.onopen = () => {
      setConnection("open");
      if (hadError) {
        hadError = false;
        resync();
      }
    };
    es.onerror = () => {
      hadError = true;
      setConnection("reconnecting");
    };

    const onSummary = (e: MessageEvent) => setSummary(JSON.parse(e.data) as DashboardSummary);
    const invalidateLists = () =>
      LIST_KEYS.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

    const onAlarmCreated = (e: MessageEvent) => {
      pushAlarm(JSON.parse(e.data) as AlarmDTO);
      invalidateLists();
    };
    const onAlarmRestored = () => invalidateLists();
    const onDeviceChanged = () => invalidateLists();
    const onPanelChanged = () => invalidateLists();

    es.addEventListener("summary.updated", onSummary);
    es.addEventListener("alarm.created", onAlarmCreated);
    es.addEventListener("alarm.restored", onAlarmRestored);
    es.addEventListener("device.status_changed", onDeviceChanged);
    es.addEventListener("panel.status_changed", onPanelChanged);

    return () => es.close();
  }, [queryClient, setConnection, setSummary, pushAlarm]);
}
