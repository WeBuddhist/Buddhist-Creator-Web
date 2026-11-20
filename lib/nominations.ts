import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { Nomination, NominationBallot } from "@/lib/db/schema";
import { AWARDS, AWARDS_2027, type AwardSlug, type BallotValues } from "@/lib/awards-2027";

/* Everything that reads or writes award nominations. Callers pass the
   current user in, and check roles for the dashboard's reads; the rule of
   one person per award is the unique index on (ballot, category). */

const { nominationBallots, nominations, users } = schema;
const YEAR = AWARDS_2027.year;

export type MyBallot = NominationBallot & { nominations: Nomination[] };

/** What to do with the picture of an award that takes one. */
export type ImageChange = { kind: "keep" } | { kind: "replace"; key: string } | { kind: "remove" };

/** Where an uploaded picture of a nominated work is stored. */
export function nominationImageKey(userId: string, extension: string) {
  return `award-nominations/${YEAR}/${userId}/${randomUUID()}.${extension}`;
}

/** The person's nominations for this year's awards, or null before they
    first send any. Looking at the form stores nothing. */
export async function getMyBallot(userId: string): Promise<MyBallot | null> {
  const ballot = await db().query.nominationBallots.findFirst({
    where: and(eq(nominationBallots.userId, userId), eq(nominationBallots.awardYear, YEAR)),
    with: { nominations: true },
  });
  return ballot ?? null;
}

/** Stores a set of nominations in full: the nominator's details, a row for
    each award in `values`, and no row for any other award, so an award left
    blank this time loses the nomination it had. The first save creates the
    ballot and is its submission; later ones are edits. The caller has
    checked `values` (parseBallot) and that nominations are open, and has
    uploaded any new picture named in `images` (an award missing there keeps
    its picture).

    Returns the keys of pictures nothing points at any more (replaced,
    removed, or on a nomination taken away), for the caller to delete once
    this has committed. */
export async function saveMyBallot(
  userId: string,
  values: BallotValues,
  images: Partial<Record<AwardSlug, ImageChange>> = {},
): Promise<{ ballot: NominationBallot; firstSubmission: boolean; staleImageKeys: string[] }> {
  const chosen = Object.keys(values.nominations) as AwardSlug[];
  if (chosen.length === 0) throw new Error("saveMyBallot: no nominations to save");

  return db().transaction(async (tx) => {
    const now = new Date();
    // Two first saves at once (two tabs) both reach the insert; the unique
    // index lets one through and the other updates the row it wrote.
    const [created] = await tx
      .insert(nominationBallots)
      .values({ userId, awardYear: YEAR, nominatorName: values.nominatorName, nominatorCountry: values.nominatorCountry })
      .onConflictDoNothing({ target: [nominationBallots.userId, nominationBallots.awardYear] })
      .returning();
    let ballot = created;
    if (!ballot) {
      [ballot] = await tx
        .update(nominationBallots)
        .set({ nominatorName: values.nominatorName, nominatorCountry: values.nominatorCountry, updatedAt: now })
        .where(and(eq(nominationBallots.userId, userId), eq(nominationBallots.awardYear, YEAR)))
        .returning();
    }

    const staleImageKeys: string[] = [];
    const removed = await tx
      .delete(nominations)
      .where(and(eq(nominations.ballotId, ballot.id), notInArray(nominations.category, chosen)))
      .returning({ imageKey: nominations.imageKey });
    for (const { imageKey } of removed) if (imageKey) staleImageKeys.push(imageKey);

    const before = await tx
      .select({ category: nominations.category, imageKey: nominations.imageKey })
      .from(nominations)
      .where(eq(nominations.ballotId, ballot.id));
    const storedImage = new Map(before.map((row) => [row.category, row.imageKey]));

    for (const slug of chosen) {
      const change = images[slug] ?? { kind: "keep" };
      const row = {
        ...values.nominations[slug]!,
        ...(change.kind === "replace" && { imageKey: change.key }),
        ...(change.kind === "remove" && { imageKey: null }),
      };
      const old = storedImage.get(slug);
      if (change.kind !== "keep" && old) staleImageKeys.push(old);
      // A row that exists is updated, not upserted: Postgres checks an
      // upsert's insert first, and a nomination keeping its stored picture
      // with no link would fail the link-or-picture check there.
      if (storedImage.has(slug)) {
        await tx
          .update(nominations)
          .set({ ...row, updatedAt: now })
          .where(and(eq(nominations.ballotId, ballot.id), eq(nominations.category, slug)));
        continue;
      }
      await tx
        .insert(nominations)
        .values({ ballotId: ballot.id, category: slug, ...row })
        .onConflictDoUpdate({
          target: [nominations.ballotId, nominations.category],
          set: { ...row, updatedAt: now },
        });
    }

    return { ballot, firstSubmission: Boolean(created), staleImageKeys };
  });
}

/* ---------------------------------------------------------------------- */
/* Dashboard                                                               */
/* ---------------------------------------------------------------------- */

export type NominationRow = Nomination & {
  nominatorName: string;
  nominatorCountry: string;
  nominatorEmail: string;
};

/** Every nomination for this year's awards, grouped by award in the order
    of AWARDS. Within an award they are sorted by the nominee's name as
    typed, case and spacing aside, so several nominations of one person sit
    together. With how many people have sent nominations. The caller checks
    the role. */
export async function listNominations() {
  const rows = await db()
    .select({
      nomination: nominations,
      nominatorName: nominationBallots.nominatorName,
      nominatorCountry: nominationBallots.nominatorCountry,
      nominatorEmail: users.email,
    })
    .from(nominations)
    .innerJoin(nominationBallots, eq(nominations.ballotId, nominationBallots.id))
    .innerJoin(users, eq(nominationBallots.userId, users.id))
    .where(eq(nominationBallots.awardYear, YEAR))
    .orderBy(asc(sql`lower(regexp_replace(${nominations.nomineeName}, '\\s+', ' ', 'g'))`), asc(nominations.createdAt));

  const [{ nominators }] = await db()
    .select({ nominators: sql<number>`count(*)::int` })
    .from(nominationBallots)
    .where(eq(nominationBallots.awardYear, YEAR));

  const byAward = AWARDS.map((award) => ({
    award,
    rows: rows
      .filter((row) => row.nomination.category === award.slug)
      .map(
        ({ nomination, ...nominator }): NominationRow => ({ ...nomination, ...nominator }),
      ),
  }));
  return { byAward, nominators, total: rows.length };
}
