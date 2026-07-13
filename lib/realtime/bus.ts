// In-process event bus. Mirrors the architecture's instrumentation LISTEN bus:
// producers (the mock feeder, or a real PG LISTEN subscriber) emit typed SSE events;
// each /api/sse connection subscribes and fans them out to its browser.

import { EventEmitter } from "node:events";
import type { SSEEvent } from "@/lib/types";

const g = globalThis as unknown as { __facpBus?: EventEmitter };

function bus(): EventEmitter {
  if (!g.__facpBus) {
    g.__facpBus = new EventEmitter();
    g.__facpBus.setMaxListeners(0); // many concurrent SSE clients
  }
  return g.__facpBus;
}

export function publish(event: SSEEvent) {
  bus().emit("event", event);
}

export function subscribe(listener: (event: SSEEvent) => void): () => void {
  bus().on("event", listener);
  return () => bus().off("event", listener);
}
