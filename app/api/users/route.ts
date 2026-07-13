import { requireRole, ADMIN_ROLES } from "@/lib/auth/rbac";
import { createUser, findByUsername, listUsers } from "@/lib/auth/users";
import { jsonError, toErrorResponse } from "@/lib/http";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["administrator", "safety_officer", "viewer"];

export async function GET() {
  try {
    await requireRole(...ADMIN_ROLES);
    return Response.json({ data: listUsers() });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(...ADMIN_ROLES);
    const body = await request.json().catch(() => ({}));
    const username = String(body.username ?? "").trim();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    const role = body.role as Role;
    if (!username || !email || password.length < 8 || !ROLES.includes(role)) {
      return jsonError("BAD_REQUEST", "Provide a username, email, role, and a password of at least 8 characters.", 400);
    }
    if (findByUsername(username)) {
      return jsonError("CONFLICT", "That username is already taken.", 409);
    }
    return Response.json({ user: createUser({ username, email, password, role }) }, { status: 201 });
  } catch (e) {
    return toErrorResponse(e);
  }
}
