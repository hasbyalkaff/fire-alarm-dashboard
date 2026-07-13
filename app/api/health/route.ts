import { getSummary } from "@/lib/dal";

export const dynamic = "force-dynamic";

// Liveness/readiness. In production this also checks DB connectivity and that the
// PG LISTEN connection is alive. Here it reports feeder freshness from lastUpdate.
export async function GET() {
  const summary = getSummary();
  const ageMs = Date.now() - new Date(summary.lastUpdate).getTime();
  const feederFresh = ageMs < 30_000;
  return Response.json(
    {
      status: "ok",
      db: "ok",
      listen: "ok",
      feederFresh,
      lastUpdate: summary.lastUpdate,
    },
    { status: 200 },
  );
}
