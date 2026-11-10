import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getAuth0, loginUrl } from "@/lib/auth0";
import { db, schema } from "@/lib/db";
import type { UserRole } from "@/lib/db/schema";
import { hasRole } from "@/lib/auth-roles";

/* The data access layer for identity. Every page, server action and route
   handler that needs to know who is calling goes through here; nothing
   reads the Auth0 session directly. With Cache Components on, the session
   is request data, so callers must sit inside a <Suspense> boundary (or be
   an action or a handler). A component that reads it inside a try/catch
   awaits connection() first, outside the try; see components/user-menu.tsx. */

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: UserRole;
};

export { hasRole } from "@/lib/auth-roles";

/** The signed-in person, as a row in `users`, or null when nobody is signed
    in. A first sign-in creates the row (role member); later ones refresh
    the name, picture and email from Auth0. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getAuth0().getSession();
  const profile = session?.user;
  if (!profile?.sub || !profile.email) return null;
  // The form and the dashboard both rely on the address being real.
  if (profile.email_verified === false) return null;

  const email = profile.email.trim().toLowerCase();
  const name = profile.name ?? profile.nickname ?? null;
  const picture = profile.picture ?? null;
  const now = new Date();

  const row = await db().transaction(async (tx) => {
    const bySub = await tx.query.users.findFirst({ where: eq(schema.users.auth0Sub, profile.sub) });
    if (bySub) {
      if (bySub.email !== email || bySub.name !== name || bySub.picture !== picture) {
        const [updated] = await tx
          .update(schema.users)
          .set({ email, name, picture, updatedAt: now })
          .where(eq(schema.users.id, bySub.id))
          .returning();
        return updated;
      }
      return bySub;
    }
    // The same person arriving through another connection (Google after
    // email/password, say) keeps their row and their role.
    const byEmail = await tx.query.users.findFirst({ where: eq(schema.users.email, email) });
    if (byEmail) {
      const [updated] = await tx
        .update(schema.users)
        .set({ auth0Sub: profile.sub, name, picture, updatedAt: now })
        .where(eq(schema.users.id, byEmail.id))
        .returning();
      return updated;
    }
    // A first sign-in arrives as several requests at once (the page and the
    // links it prefetches), and each of them gets this far. The unique
    // indexes let one insert through; the others insert nothing and take
    // the row the first one wrote, which this statement can see because it
    // waited for that insert to commit.
    const [created] = await tx
      .insert(schema.users)
      .values({ auth0Sub: profile.sub, email, name, picture })
      .onConflictDoNothing()
      .returning();
    if (created) return created;
    const existing = await tx.query.users.findFirst({ where: eq(schema.users.auth0Sub, profile.sub) });
    if (!existing) throw new Error("users: the insert conflicted, but no row has this auth0_sub");
    return existing;
  });

  return { id: row.id, email: row.email, name: row.name, picture: row.picture, role: row.role };
});

/** For pages: the current user, or a redirect to sign in and come back. */
export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(returnTo));
  return user;
}

/** For pages: the current user if they hold `role` (or a higher one).
    Signed-out visitors go to sign in; signed-in members without the role
    see the 403 page. */
export async function requireRole(role: UserRole, returnTo: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!hasRole(user, role)) redirect("/forbidden");
  return user;
}

export class Unauthorized extends Error {
  constructor(message = "UNAUTHORIZED") {
    super(message);
    this.name = "Unauthorized";
  }
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function assertRole(role: UserRole): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Unauthorized("UNAUTHENTICATED");
  if (!hasRole(user, role)) throw new Unauthorized("FORBIDDEN");
  return user;
}
