// Runs once per server start (Next.js 16 `register` hook). In production this is where
// the PG LISTEN subscriber boots. Here we boot the mock feeder so live events flow.

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMockFeeder } = await import("@/lib/realtime/feeder");
    startMockFeeder();
  }
}
