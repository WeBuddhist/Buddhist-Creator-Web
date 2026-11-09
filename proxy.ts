import { NextResponse, type NextRequest } from "next/server";
import { getAuth0, isAuth0Configured, LOGIN_PATH, loginUrl, safeReturnTo } from "@/lib/auth0";

/* The Auth0 SDK's middleware serves /auth/* and keeps the session cookie
   rolling. On top of that, two areas need a session before they render:
   the registration form and the admin dashboard. Everyone else passes.

   Sign-in happens on our own /login page. Someone without a session is
   sent there with where they were going; someone who already has one is
   sent on from it, so a stale bookmark never shows the sign-in card.

   Roles are not checked here: the proxy only knows the Auth0 session, not
   the users table. Pages and actions check roles themselves (lib/auth.ts). */

const REQUIRES_SESSION = [/^\/convention\/2027\/register(?:\/|$)/, /^\/admin(?:\/|$)/];

let warned = false;

export async function proxy(request: NextRequest) {
  if (!isAuth0Configured()) {
    if (!warned) {
      warned = true;
      console.warn("Auth0 is not configured (see .env.example): sign-in, the registration form and the dashboard are off.");
    }
    return NextResponse.next();
  }
  const auth0 = getAuth0();
  const response = await auth0.middleware(request);
  const { pathname, search, searchParams, origin } = request.nextUrl;

  if (pathname.startsWith("/auth")) return response;

  if (pathname === LOGIN_PATH) {
    const session = await auth0.getSession(request);
    if (session) {
      return NextResponse.redirect(new URL(safeReturnTo(searchParams.get("returnTo")), origin));
    }
    return response;
  }

  if (REQUIRES_SESSION.some((pattern) => pattern.test(pathname))) {
    const session = await auth0.getSession(request);
    if (!session) {
      return NextResponse.redirect(new URL(loginUrl(pathname + search), origin));
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next's own assets, the public files, and the video
    // upload route: that one carries a large body the proxy must not buffer
    // (proxyClientMaxBodySize), and it checks the session itself.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/applications/video|.*\\.(?:png|jpg|jpeg|webp|svg|ico|txt|xml)$).*)",
  ],
};
