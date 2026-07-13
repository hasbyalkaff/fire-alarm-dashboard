import type { SSEEvent } from "@/lib/types";

/** Encode a typed event as an SSE frame: `event:` + `data:` + blank line. */
export function encodeSSE(e: SSEEvent): string {
  return `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`;
}

export const SSE_RETRY = "retry: 5000\n\n";
export const SSE_HEARTBEAT = ": heartbeat\n\n";
