// Stateless session: a jose-signed JWT held in an HttpOnly cookie (architecture §6).
// verifySession() is the authoritative auth check called by Server Components,
// Route Handlers, and the DAL. proxy.ts only does an optimistic cookie-presence check.

import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { findById } from "@/lib/auth/users";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import type { Role, SessionUser } from "@/lib/types";

export { SESSION_COOKIE };
const MAX_AGE = 60 * 60 * 8; // 8h sliding session

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me-fire-alarm-dashboard",
);

export async function createSessionCookie(user: { id: string; username: string; role: Role }) {
  const token = await new SignJWT({ username: user.username, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Authoritative check: verify signature, expiry, and that the account is still active. */
export async function verifySession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const id = payload.sub as string;
    const user = findById(id);
    if (!user || !user.isActive) return null;
    return { sub: id, username: user.username, role: user.role };
  } catch {
    return null;
  }
}
