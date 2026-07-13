import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/rbac";
import { getZone } from "@/lib/dal";
import { jsonError, toErrorResponse } from "@/lib/http";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/zones/[id]">) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const zone = getZone(Number(id));
    if (!zone) return jsonError("NOT_FOUND", "Zone not found.", 404);
    return Response.json(zone);
  } catch (e) {
    return toErrorResponse(e);
  }
}
