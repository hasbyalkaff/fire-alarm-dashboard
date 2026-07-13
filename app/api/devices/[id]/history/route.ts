import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/rbac";
import { getDeviceHistory } from "@/lib/dal";
import { toErrorResponse } from "@/lib/http";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/devices/[id]/history">) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    return Response.json({ data: getDeviceHistory(Number(id)) });
  } catch (e) {
    return toErrorResponse(e);
  }
}
