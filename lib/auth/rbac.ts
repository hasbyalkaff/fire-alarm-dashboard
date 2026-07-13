import "server-only";
import { verifySession } from "@/lib/auth/session";
import type { Role, SessionUser } from "@/lib/types";

export class AuthError extends Error {
  constructor(public status: 401 | 403) {
    super(status === 401 ? "UNAUTHORIZED" : "FORBIDDEN");
  }
}

/** Require a valid session. Throws AuthError(401) if absent/invalid. */
export async function requireSession(): Promise<SessionUser> {
  const session = await verifySession();
  if (!session) throw new AuthError(401);
  return session;
}

/** Require the session role to be one of `roles`. Throws 401 or 403. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new AuthError(403);
  return session;
}

export const REPORTS_ROLES: Role[] = ["administrator", "safety_officer"];
export const ADMIN_ROLES: Role[] = ["administrator"];

export function canSeeReports(role: Role) {
  return REPORTS_ROLES.includes(role);
}
export function canManageUsers(role: Role) {
  return ADMIN_ROLES.includes(role);
}
