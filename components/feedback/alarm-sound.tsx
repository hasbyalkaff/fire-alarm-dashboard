"use client";

import { useEffect, useRef } from "react";
import { useRealtime } from "@/hooks/realtime-store";

// Audible alarm (PRD US-K2/AC-K2). Synthesized with the Web Audio API so no binary
// asset is required. Plays a short two-tone chirp on each new alarm unless muted.
// A visible mute control lives in the top bar; sound is never the only signal.
export function AlarmSound() {
  const lastAlarmKey = useRealtime((s) => s.lastAlarmKey);
  const muted = useRealtime((s) => s.muted);
  const ctxRef = useRef<AudioContext | null>(null);
  const first = useRef(true);

  // Unlock the AudioContext on first user interaction (autoplay policy).
  useEffect(() => {
    const unlock = () => {
      if (!ctxRef.current) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AC) ctxRef.current = new AC();
      }
      ctxRef.current?.resume().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock, { once: false });
    window.addEventListener("keydown", unlock, { once: false });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return; // don't chirp on initial mount
    }
    if (muted || lastAlarmKey === 0) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const start = now + i * 0.22;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.21);
    });
  }, [lastAlarmKey, muted]);

  return null;
}
