import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (formerly "middleware") — first layer of admin protection.
 *
 * It only checks that a session cookie EXISTS for /admin paths (deep session
 * validation happens in the (dashboard) server layout and in every admin API
 * route — see lib/auth). Without a cookie the visitor never even reaches the
 * admin bundle, which shrinks the attack surface and avoids rendering the
 * login redirect client-side.
 *
 * Next.js 16 renamed the "middleware" file convention to "proxy".
 */

const SESSION_COOKIE = "fch_admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSession) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Everything under /admin except the login page itself.
  matcher: ["/admin", "/admin/((?!login).*)"],
};
