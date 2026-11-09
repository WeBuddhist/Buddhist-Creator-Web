import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { DEFAULT_RETURN_TO } from "@/lib/login-url";

/* One Auth0 client for the proxy, server components, server actions and
   route handlers. Built on first use rather than at import, so a build or a
   dev server without the Auth0 variables set still starts; the first request
   that needs a session is what fails, with the SDK's own message.

   Required env: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET,
   AUTH0_SECRET (openssl rand -hex 32), APP_BASE_URL. The SDK mounts
   /auth/login, /auth/logout, /auth/callback and /auth/profile itself.

   Sign-in starts on our own /login page (app/login/page.tsx), not on
   Auth0's hosted one: each button there opens /auth/login with a
   `connection`, and the SDK forwards every query parameter except
   returnTo to Auth0's /authorize, so Google and Apple open the provider
   directly and the hosted "identifier" screen is never shown. */

let client: Auth0Client | undefined;

export { DEFAULT_RETURN_TO, LOGIN_PATH, loginUrl, safeReturnTo } from "@/lib/login-url";

/** Auth0 connection names as enabled on the application. Social only:
    a first sign-in creates the account, so there is no sign-up step. */
export const CONNECTIONS = {
  google: "google-oauth2",
  apple: "apple",
} as const;

/** Whether the Auth0 variables are present. The proxy lets requests through
    without them so the public site still runs in a fresh checkout; anything
    that needs a session then fails with the SDK's own message. */
export function isAuth0Configured() {
  return !!(
    process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_SECRET &&
    process.env.APP_BASE_URL
  );
}

export function getAuth0(): Auth0Client {
  client ??= new Auth0Client({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    secret: process.env.AUTH0_SECRET,
    appBaseUrl: process.env.APP_BASE_URL,
    authorizationParameters: {
      scope: "openid profile email",
    },
    // Where /auth/login lands when it is opened without a returnTo.
    signInReturnToPath: DEFAULT_RETURN_TO,
  });
  return client;
}

/** The SDK's login endpoint for one connection: Auth0 skips its own chooser
    and opens that provider. */
export function authLoginUrl(returnTo: string, connection: string) {
  const search = new URLSearchParams({ returnTo, connection });
  return `/auth/login?${search}`;
}
