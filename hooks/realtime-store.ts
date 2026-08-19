"use client";

import { create } from "zustand";
import { alarmAudio, type AudioState } from "@/lib/audio/alarm-audio";
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
  /** Spoken announcement between siren cycles (voice-evac style). */
  voice: boolean;
  toasts: ToastItem[];
  lastAlarmKey: number;
  lastAlarm: AlarmDTO | null;
  /** A critical alarm is sounding and has not been silenced by an operator. */
  siren: boolean;
  /** The alarm the siren is announcing. */
  sirenAlarm: AlarmDTO | null;
  audio: AudioState;
  ready: boolean; // hydrated sound prefs
  setConnection: (c: ConnectionState) => void;
  setSummary: (s: DashboardSummary) => void;
  pushAlarm: (a: AlarmDTO) => void;
  dismissToast: (key: number) => void;
  hydratePrefs: () => void;
  toggleMute: () => void;
  toggleVoice: () => void;
  /** Stop the siren; the alarm itself stays active and visible. */
  silence: () => void;
  setAudio: (a: AudioState) => void;
  armAudio: () => Promise<void>;
}

export const useRealtime = create<RealtimeState>((set, get) => ({
  connection: "connecting",
  summary: null,
  muted: false,
  voice: true,
  toasts: [],
  lastAlarmKey: 0,
  lastAlarm: null,
  siren: false,
  sirenAlarm: null,
  audio: "blocked",
  ready: false,
  setConnection: (connection) => set({ connection }),
  setSummary: (summary) =>
    set((s) => ({
      summary,
      // Everything restored: the siren has nothing left to announce.
      ...(summary.activeAlarms === 0 && s.siren ? { siren: false, sirenAlarm: null } : null),
    })),
  pushAlarm: (alarm) =>
    set((s) => {
      const key = s.lastAlarmKey + 1;
      const critical = alarm.severity === "critical";
      return {
        lastAlarmKey: key,
        lastAlarm: alarm,
        toasts: [...s.toasts, { key, alarm }].slice(-4),
        // A new critical alarm re-arms the siren even if the previous one was silenced.
        ...(critical ? { siren: true, sirenAlarm: alarm } : null),
      };
    }),
  dismissToast: (key) => set((s) => ({ toasts: s.toasts.filter((t) => t.key !== key) })),
  hydratePrefs: () => {
    const has = typeof window !== "undefined";
    set({
      muted: has && localStorage.getItem("facp-muted") === "1",
      voice: !has || localStorage.getItem("facp-voice") !== "0",
      ready: true,
    });
  },
  toggleMute: () => {
    const next = !get().muted;
    if (typeof window !== "undefined") localStorage.setItem("facp-muted", next ? "1" : "0");
    set({ muted: next });
  },
  toggleVoice: () => {
    const next = !get().voice;
    if (typeof window !== "undefined") localStorage.setItem("facp-voice", next ? "1" : "0");
    set({ voice: next });
  },
  silence: () => set({ siren: false, sirenAlarm: null }),
  setAudio: (audio) => set({ audio }),
  armAudio: async () => {
    const state = await alarmAudio.arm();
    set({ audio: state });
  },
}));

/** Active-alarm badge count, authoritative from the summary. */
export function useAlarmCount(): number {
  return useRealtime((s) => s.summary?.activeAlarms ?? 0);
}
