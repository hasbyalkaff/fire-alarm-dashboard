import { createSessionCookie } from "@/lib/auth/session";
import { findByUsername, markLogin, toDTO } from "@/lib/auth/users";
import { verifyPassword } from "@/lib/auth/password";
import { jsonError } from "@/lib/http";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("BAD_REQUEST", "Invalid request body.", 400);
  }
  const username = body.username?.trim();
  const password = body.password ?? "";
  if (!username || !password) {
    return jsonError("BAD_REQUEST", "Enter your username and password.", 400);
  }

  const user = findByUsername(username);
  // Generic message: never reveal whether the username exists.
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return jsonError("INVALID_CREDENTIALS", "Incorrect username or password.", 401);
  }

  await createSessionCookie(user);
  markLogin(user.id);
  return Response.json({ user: toDTO(user) });
}
