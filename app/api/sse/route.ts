// Live event stream. Session-authenticated. Subscribes to the in-process bus fed by
// the mock feeder (or a real PG LISTEN subscriber) and relays typed SSE frames.
// Requires the Node runtime + force-dynamic (persistent stream, no caching).

import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session";
import { subscribe } from "@/lib/realtime/bus";
import { encodeSSE, SSE_HEARTBEAT, SSE_RETRY } from "@/lib/sse/format";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session) return jsonError("UNAUTHORIZED", "Sign in to continue.", 401);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* controller already closed */
        }
      };

      send(SSE_RETRY);
      send(SSE_HEARTBEAT);

      const unsubscribe = subscribe((event) => send(encodeSSE(event)));
      const heartbeat = setInterval(() => send(SSE_HEARTBEAT), 15_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // Client disconnect (tab close / navigation) aborts the request signal.
      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Nginx: do not buffer the stream
    },
  });
}
