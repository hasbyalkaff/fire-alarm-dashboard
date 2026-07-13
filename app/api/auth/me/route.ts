import { verifySession } from "@/lib/auth/session";
import { findById, toDTO } from "@/lib/auth/users";
import { jsonError } from "@/lib/http";

export async function GET() {
  const session = await verifySession();
  if (!session) return jsonError("UNAUTHORIZED", "Sign in to continue.", 401);
  const user = findById(session.sub);
  if (!user) return jsonError("UNAUTHORIZED", "Sign in to continue.", 401);
  return Response.json({ user: toDTO(user) });
}
