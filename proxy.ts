// Optimistic auth pre-check (Next.js 16 renamed middleware -> proxy). This is NOT the
// security boundary; the DAL's verifySession()/requireRole() are. It only saves a
// round-trip by redirecting obviously-unauthenticated navigations to /login.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login") {
    if (hasSession) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!hasSession) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Run on page routes only. API routes enforce auth themselves and return JSON,
  // and SSE must not be redirected. Exclude static assets and the login API.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|alarm.mp3|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
