/**
 * Audible alarm engine (PRD US-K2/AC-K2, Design System §3.1 "Sound" column).
 *
 * Everything is synthesized with the Web Audio API, so there is no binary asset to
 * ship, cache-bust, or serve through nginx, and the tone is byte-identical on every
 * browser and OS.
 *
 * Three tiers, deliberately unmistakable from one another:
 *
 *   critical → a looping fire-evacuation siren that keeps sounding until an operator
 *              silences it or every alarm restores. Each 6-8s cycle is a rising WAIL
 *              block followed by the ISO 8201 / NFPA 72 "Temporal-3" evacuation
 *              pattern (0.5s on / 0.5s off x3) and a silent gap. Alternating two
 *              different figures defeats auditory habituation far better than one
 *              repeated tone, and the gap leaves room for a spoken announcement and
 *              for people to talk over it.
 *   urgent   → severity "high": three fast double-beeps, one shot.
 *   notice   → severity medium/low: the original soft two-tone chirp, one shot.
 *
 * Loudness is engineered for the laptop and wall-display speakers this dashboard
 * actually runs on: the fundamentals sit in 660-1500 Hz (where small drivers are
 * efficient) and every voice carries a partial near 2-3 kHz (where human hearing
 * peaks). A compressor on the master bus raises perceived loudness without clipping.
 */

export type AlarmTier = "critical" | "urgent" | "notice";
export type AudioState = "unsupported" | "blocked" | "ready";

/** Master bus level, pre-compressor. */
const MASTER_GAIN = 1.15;

/* --- critical cycle layout (seconds) ------------------------------------- */
const WAIL_DUR = 0.8;
const WAIL_COUNT = 3;
const T3_ON = 0.5;
const T3_OFF = 0.5;
const T3_PULSES = 3;
const PAUSE_AFTER_WAIL = 0.2;
const TAIL_QUIET = 0.7;
const TAIL_ANNOUNCE = 2.0; // longer gap on cycles that carry a spoken announcement
const SOUNDING = WAIL_COUNT * WAIL_DUR + PAUSE_AFTER_WAIL + T3_PULSES * (T3_ON + T3_OFF);

/** Schedule this far ahead of the audio clock; survives background-tab timer throttling. */
const LOOKAHEAD = 3.0;
const TICK_MS = 400;

class AlarmAudio {
  private ctx: AudioContext | null = null;
  private bus: GainNode | null = null;
  private sources: OscillatorNode[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private speechTimers: ReturnType<typeof setTimeout>[] = [];
  private nextCycleAt = 0;
  private cycleIndex = 0;
  private looping = false;
  private announce: (() => void) | null = null;

  /* ---------------------------------------------------------------- context */

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      // Compressing the bus buys real perceived loudness on tinny speakers.
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 6;
      comp.ratio.value = 12;
      comp.attack.value = 0.003;
      comp.release.value = 0.15;
      const bus = ctx.createGain();
      bus.gain.value = MASTER_GAIN;
      bus.connect(comp).connect(ctx.destination);
      this.ctx = ctx;
      this.bus = bus;
    }
    return this.ctx;
  }

  state(): AudioState {
    if (typeof window === "undefined") return "blocked";
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return "unsupported";
    if (!this.ctx) return "blocked";
    return this.ctx.state === "running" ? "ready" : "blocked";
  }

  /**
   * Create/resume the AudioContext. Browsers only let this succeed inside (or shortly
   * after) a user gesture, so the shell calls it on first interaction and offers a
   * visible "Enable sound" control when it stays blocked.
   */
  async arm(): Promise<AudioState> {
    const ctx = this.ensure();
    if (!ctx) return "unsupported";
    if (ctx.state !== "running") {
      // Outside a user gesture Chrome leaves this promise pending forever, so race it —
      // arm() must always settle or the "Enable sound" prompt would never appear.
      await Promise.race([
        ctx.resume().catch(() => {}),
        new Promise((r) => setTimeout(r, 400)),
      ]);
    }
    return this.state();
  }

  /* ------------------------------------------------------------- primitives */

  private track(osc: OscillatorNode) {
    this.sources.push(osc);
    osc.onended = () => {
      const i = this.sources.indexOf(osc);
      if (i !== -1) this.sources.splice(i, 1);
    };
  }

  /** One rise-and-fall siren sweep, two detuned voices for a rough, cutting timbre. */
  private wail(start: number, dur: number) {
    const ctx = this.ctx!;
    const bus = this.bus!;
    const lo = 660;
    const hi = 1480;
    const rise = dur * 0.62; // faster fall than rise reads as more urgent
    const voices: [OscillatorType, number, number][] = [
      ["sawtooth", 1, 0.62],
      ["square", 2.01, 0.22], // slightly detuned octave lands near the ear's 3 kHz peak
    ];
    for (const [type, mult, peak] of voices) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(lo * mult, start);
      osc.frequency.exponentialRampToValueAtTime(hi * mult, start + rise);
      osc.frequency.exponentialRampToValueAtTime(lo * mult, start + dur);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(peak, start + 0.03);
      g.gain.setValueAtTime(peak, start + dur - 0.07);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g).connect(bus);
      osc.start(start);
      osc.stop(start + dur + 0.02);
      this.track(osc);
    }
  }

  /** Flat tone with a hard attack; `harmonic` adds a partial for speaker cut-through. */
  private beep(
    start: number,
    dur: number,
    freq: number,
    peak: number,
    type: OscillatorType = "square",
    harmonic = 0,
  ) {
    const ctx = this.ctx!;
    const bus = this.bus!;
    const parts: [number, number][] = [[freq, peak]];
    if (harmonic > 0) parts.push([freq * 1.5, peak * harmonic]);
    for (const [f, p] of parts) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(p, start + 0.008);
      g.gain.setValueAtTime(p, start + dur - 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(g).connect(bus);
      osc.start(start);
      osc.stop(start + dur + 0.02);
      this.track(osc);
    }
  }

  /* ---------------------------------------------------------- critical loop */

  /** Schedules one full siren cycle at `start`; returns the cycle's length. */
  private scheduleCycle(start: number, announcing: boolean): number {
    for (let i = 0; i < WAIL_COUNT; i++) this.wail(start + i * WAIL_DUR, WAIL_DUR);

    const t3 = start + WAIL_COUNT * WAIL_DUR + PAUSE_AFTER_WAIL;
    // Temporal-3: the internationally standardized "evacuate" cadence.
    for (let i = 0; i < T3_PULSES; i++) {
      this.beep(t3 + i * (T3_ON + T3_OFF), T3_ON, 970, 0.5, "square", 0.35);
    }

    if (announcing && this.announce) {
      const fire = this.announce;
      const delayMs = (start + SOUNDING - this.ctx!.currentTime) * 1000;
      const handle = setTimeout(() => fire(), Math.max(0, delayMs));
      this.speechTimers.push(handle);
    }
    return SOUNDING + (announcing ? TAIL_ANNOUNCE : TAIL_QUIET);
  }

  private pump = () => {
    const ctx = this.ctx;
    if (!this.looping || !ctx || ctx.state !== "running") return;
    while (this.nextCycleAt < ctx.currentTime + LOOKAHEAD) {
      const announcing = this.announce != null && this.cycleIndex % 2 === 0;
      const len = this.scheduleCycle(Math.max(this.nextCycleAt, ctx.currentTime + 0.05), announcing);
      this.nextCycleAt = Math.max(this.nextCycleAt, ctx.currentTime + 0.05) + len;
      this.cycleIndex++;
    }
  };

  /**
   * Start the looping critical siren. Idempotent — calling it again while already
   * sounding does nothing, so a second critical alarm never doubles the volume.
   */
  startSiren(announce?: () => void) {
    if (this.looping) return;
    const ctx = this.ensure();
    if (!ctx) return;
    this.announce = announce ?? null;
    this.looping = true;
    this.cycleIndex = 0;
    this.nextCycleAt = ctx.currentTime + 0.06;
    void ctx.resume().catch(() => {});
    this.pump();
    this.timer = setInterval(this.pump, TICK_MS);
  }

  get sounding(): boolean {
    return this.looping;
  }

  /** Stop everything with a short fade so there is no click. */
  stop() {
    this.looping = false;
    this.announce = null;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.speechTimers.forEach(clearTimeout);
    this.speechTimers = [];
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();

    const ctx = this.ctx;
    const bus = this.bus;
    if (!ctx || !bus) return;
    const now = ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), now);
    bus.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    bus.gain.setValueAtTime(MASTER_GAIN, now + 0.1);
    for (const osc of this.sources.slice()) {
      try {
        osc.stop(now + 0.09);
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
  }

  /* -------------------------------------------------------------- one shots */

  /** Non-critical alerts: a single short figure, no loop. */
  playOnce(tier: Exclude<AlarmTier, "critical">) {
    const ctx = this.ensure();
    if (!ctx || ctx.state !== "running" || this.looping) return; // never layer over the siren
    const t = ctx.currentTime + 0.02;
    if (tier === "urgent") {
      // Three fast double-beeps — clearly "act now", clearly not the evacuation siren.
      for (let i = 0; i < 3; i++) {
        const g = t + i * 0.42;
        this.beep(g, 0.1, 1050, 0.32, "square", 0.3);
        this.beep(g + 0.14, 0.1, 1400, 0.32, "square", 0.3);
      }
    } else {
      // The original calm two-tone chirp, unchanged.
      this.beep(t, 0.2, 880, 0.15, "square");
      this.beep(t + 0.22, 0.2, 660, 0.15, "square");
    }
  }
}

export const alarmAudio = new AlarmAudio();

/**
 * Spoken announcement between siren cycles, the way a real voice-evacuation system
 * works. Degrades silently where no TTS voice is installed.
 */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    u.pitch = 1.0;
    u.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {
    /* TTS unavailable */
  }
}
