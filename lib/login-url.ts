/* Where sign-in starts and where it comes back to. No server imports, so
   the header's sign-in link can build its URL in the browser from the page
   it sits on; lib/auth0.ts re-exports these for server callers. */

/** Our sign-in page. */
export const LOGIN_PATH = "/login";

/** Where sign-in lands when nothing says otherwise: the homepage. */
export const DEFAULT_RETURN_TO = "/";

/** A returnTo we are willing to send someone to: a path on this site. Anything
    else (an absolute URL, a protocol-relative one, nothing at all) falls back
    to the default, so the query string can never become an open redirect.
    The sign-in page itself is never a destination. */
export function safeReturnTo(value: string | string[] | null | undefined): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (!path || !path.startsWith("/") || path.startsWith("//") || /[\\\r\n]/.test(path)) {
    return DEFAULT_RETURN_TO;
  }
  if (path === LOGIN_PATH || path.startsWith(`${LOGIN_PATH}?`)) return DEFAULT_RETURN_TO;
  return path;
}

/** Where to send someone who must be signed in to see `path`, or who clicked
    sign in while on it: our sign-in page, which comes back to `path`. */
export function loginUrl(path: string) {
  const params = new URLSearchParams({ returnTo: safeReturnTo(path) });
  return `${LOGIN_PATH}?${params}`;
}
