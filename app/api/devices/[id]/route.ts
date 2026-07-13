import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/rbac";
import { getDevice } from "@/lib/dal";
import { jsonError, toErrorResponse } from "@/lib/http";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/devices/[id]">) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const device = getDevice(Number(id));
    if (!device) return jsonError("NOT_FOUND", "Device not found.", 404);
    return Response.json(device);
  } catch (e) {
    return toErrorResponse(e);
  }
}
