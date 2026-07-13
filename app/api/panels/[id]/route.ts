import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth/rbac";
import { getPanel } from "@/lib/dal";
import { jsonError, toErrorResponse } from "@/lib/http";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/panels/[id]">) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const panel = getPanel(Number(id));
    if (!panel) return jsonError("NOT_FOUND", "Panel not found.", 404);
    return Response.json(panel);
  } catch (e) {
    return toErrorResponse(e);
  }
}
