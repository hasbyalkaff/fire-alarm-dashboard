import type { NextRequest } from "next/server";
import { requireRole, ADMIN_ROLES } from "@/lib/auth/rbac";
import { updateUser } from "@/lib/auth/users";
import { jsonError, toErrorResponse } from "@/lib/http";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["administrator", "safety_officer", "viewer"];

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  try {
    await requireRole(...ADMIN_ROLES);
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));
    const patch: { email?: string; role?: Role; isActive?: boolean; password?: string } = {};
    if (typeof body.email === "string") patch.email = body.email.trim();
    if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
    if (typeof body.password === "string" && body.password) patch.password = body.password;
    if (body.role && ROLES.includes(body.role)) patch.role = body.role;

    const user = updateUser(id, patch);
    if (!user) return jsonError("NOT_FOUND", "User not found.", 404);
    return Response.json({ user });
  } catch (e) {
    return toErrorResponse(e);
  }
}

// Deactivate (soft delete) — the dashboard never hard-deletes accounts.
export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  try {
    await requireRole(...ADMIN_ROLES);
    const { id } = await ctx.params;
    const user = updateUser(id, { isActive: false });
    if (!user) return jsonError("NOT_FOUND", "User not found.", 404);
    return Response.json({ user });
  } catch (e) {
    return toErrorResponse(e);
  }
}
