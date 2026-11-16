/* For client code whose call to the server failed outright. The proxy
   turns a request without a session away before a server action runs, so
   a session that ended while a page was open looks, from the browser, like
   any other failed request. The Auth0 SDK's own /auth/profile tells the
   two apart: it answers 401 when nobody is signed in. Anything else,
   including no answer at all, is not a signed-out session. */
export async function sessionEnded(): Promise<boolean> {
  try {
    const response = await fetch("/auth/profile", { cache: "no-store" });
    return response.status === 401;
  } catch {
    return false;
  }
}

export const SIGNED_OUT = "You have been signed out. Sign in again in another tab, then try again.";
export const UNREACHABLE = "We could not reach the site. Check your connection and try again.";

/** A server action's result, or, when the request itself failed, a refusal
    in the same shape that says why: signed out, or unreachable. For the
    dashboard's actions, which all answer `{ ok, message }`. */
export async function settled<T>(request: Promise<T>): Promise<T | { ok: false; message: string }> {
  try {
    return await request;
  } catch {
    return { ok: false, message: (await sessionEnded()) ? SIGNED_OUT : UNREACHABLE };
  }
}
