"use client";

import { create } from "zustand";
import type { AlarmDTO, DashboardSummary } from "@/lib/types";

export type ConnectionState = "connecting" | "open" | "reconnecting";

export interface ToastItem {
  key: number;
  alarm: AlarmDTO;
}

interface RealtimeState {
  connection: ConnectionState;
  summary: DashboardSummary | null;
  muted: boolean;
  toasts: ToastItem[];
  lastAlarmKey: number;
  ready: boolean; // hydrated mute pref
  setConnection: (c: ConnectionState) => void;
  setSummary: (s: DashboardSummary) => void;
  pushAlarm: (a: AlarmDTO) => void;
  dismissToast: (key: number) => void;
  hydrateMute: () => void;
  toggleMute: () => void;
}

export const useRealtime = create<RealtimeState>((set, get) => ({
  connection: "connecting",
  summary: null,
  muted: false,
  toasts: [],
  lastAlarmKey: 0,
  ready: false,
  setConnection: (connection) => set({ connection }),
  setSummary: (summary) => set({ summary }),
  pushAlarm: (alarm) =>
    set((s) => {
      const key = s.lastAlarmKey + 1;
      return { lastAlarmKey: key, toasts: [...s.toasts, { key, alarm }].slice(-4) };
    }),
  dismissToast: (key) => set((s) => ({ toasts: s.toasts.filter((t) => t.key !== key) })),
  hydrateMute: () => {
    const muted = typeof window !== "undefined" && localStorage.getItem("facp-muted") === "1";
    set({ muted, ready: true });
  },
  toggleMute: () => {
    const next = !get().muted;
    if (typeof window !== "undefined") localStorage.setItem("facp-muted", next ? "1" : "0");
    set({ muted: next });
  },
}));

/** Active-alarm badge count, authoritative from the summary. */
export function useAlarmCount(): number {
  return useRealtime((s) => s.summary?.activeAlarms ?? 0);
}
