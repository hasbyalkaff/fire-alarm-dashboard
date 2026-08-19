"use client";

import { useEffect, useRef } from "react";
import { useRealtime } from "@/hooks/realtime-store";
import { alarmAudio, speak } from "@/lib/audio/alarm-audio";
import type { AlarmDTO } from "@/lib/types";

/**
 * Headless audible-alarm controller (PRD US-K2/AC-K2, UI Spec §8).
 *
 * Critical alarms sound a looping evacuation siren that keeps going until an operator
 * hits Silence or every alarm restores — a single chirp is too easy to miss in a
 * control room, and critical alarms are rare enough that a siren is not fatiguing.
 * Lower severities keep a short one-shot tone. Sound is never the only signal: the
 * toast, the badge, and the live region fire regardless of mute state.
 */
export function AlarmSound() {
  const siren = useRealtime((s) => s.siren);
  const sirenAlarm = useRealtime((s) => s.sirenAlarm);
  const muted = useRealtime((s) => s.muted);
  const voice = useRealtime((s) => s.voice);
  const lastAlarmKey = useRealtime((s) => s.lastAlarmKey);
  const lastAlarm = useRealtime((s) => s.lastAlarm);
  const setAudio = useRealtime((s) => s.setAudio);
  const first = useRef(true);

  // Autoplay policy: the AudioContext can only start from a user gesture. Arm it on the
  // first interaction of the session and report the result so the top bar can show an
  // "Enable sound" prompt if the browser is still holding it back (wall displays that
  // nobody has clicked would otherwise be silently deaf).
  useEffect(() => {
    let done = false;
    const unlock = () => {
      void alarmAudio.arm().then((state) => {
        setAudio(state);
        if (state === "ready" && !done) {
          done = true;
          window.removeEventListener("pointerdown", unlock);
          window.removeEventListener("keydown", unlock);
        }
      });
    };
    unlock(); // some browsers/kiosk configs allow it immediately
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [setAudio]);

  // The critical siren: runs for as long as the store says it should.
  useEffect(() => {
    if (siren && !muted) {
      alarmAudio.startSiren(voice && sirenAlarm ? () => speak(announcement(sirenAlarm)) : undefined);
    } else {
      alarmAudio.stop();
    }
    return () => alarmAudio.stop();
  }, [siren, muted, voice, sirenAlarm]);

  // Non-critical alarms: one short tone, urgency scaled to severity.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return; // don't sound on initial mount
    }
    if (muted || lastAlarmKey === 0 || !lastAlarm) return;
    if (lastAlarm.severity === "critical") return; // handled by the siren
    alarmAudio.playOnce(lastAlarm.severity === "high" ? "urgent" : "notice");
  }, [lastAlarmKey, lastAlarm, muted]);

  return null;
}

function announcement(a: AlarmDTO): string {
  return `Fire alarm. ${a.zone}. ${a.device}.`;
}
