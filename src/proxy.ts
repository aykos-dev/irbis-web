import { NextResponse, type NextRequest } from "next/server";

import { SESSION_HINT_COOKIE } from "@/features/auth/session-hint";

/**
 * UX-only redirect (ADR-001): the real refresh cookie is httpOnly and scoped to the API path,
 * so this reads the non-secret session hint the client sets after sign-in. Never a security
 * boundary — every admin call is checked by the API.
 */
export function proxy(request: NextRequest) {
  const hasHint = request.cookies.has(SESSION_HINT_COOKIE);
  const isLogin = request.nextUrl.pathname === "/login";

  if (!hasHint && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (hasHint && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\..*).*)"],
};
