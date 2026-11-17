import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { CreatorCard, CreatorCardStatus } from "@/lib/db/schema";
import { COUNTED_SOCIALS, type CardFollowers, type CardValues, type CountedSocial } from "@/lib/creator-card";
import type { CreatorsView } from "@/lib/creators";

/* Everything that reads or writes creator cards. Callers pass the current
   user in and check the role; the status rules live here, not in the UI.

   A card's content only ever reaches `approved` through a review of that
   exact content: a creator's change puts the card back to pending and
   moves its revision on, and a review that read an older revision is
   refused.

   The follower counts are the one part of a card that is not reviewed.
   The review is there to say that this is a creator and the card is
   theirs, and a number says nothing about that; it is kept to rank
   creators by. So a changed count is saved where the card stands, and
   neither the status nor the revision moves.

   The team also makes cards itself, for creators it knows. Those are
   approved from the start and belong to nobody; the first signed-in person
   to claim one becomes its owner (claimCard), and from then on it is their
   card like any other. */

const { creatorCards, users } = schema;

export const CARD_STATUSES: readonly CreatorCardStatus[] = ["pending", "approved", "rejected"];

export class CardNotFound extends Error {
  constructor() {
    super("CARD_NOT_FOUND");
    this.name = "CardNotFound";
  }
}

/** The card was changed after the reviewer's page was loaded. */
export class CardChanged extends Error {
  constructor() {
    super("CARD_CHANGED");
    this.name = "CardChanged";
  }
}

/* ---------------------------------------------------------------------- */
/* Follower counts                                                         */
/* ---------------------------------------------------------------------- */

/* The card's content names a count by its place ("youtube"); the table
   keeps each in a column of its own. */
const FOLLOWER_COLUMN = {
  youtube: "youtubeFollowers",
  instagram: "instagramFollowers",
  tiktok: "tiktokFollowers",
  facebook: "facebookFollowers",
} as const satisfies Record<CountedSocial, keyof CreatorCard>;

type FollowerColumns = Record<(typeof FOLLOWER_COLUMN)[CountedSocial], number | null>;

/** A stored card's follower counts, keyed by place. */
export function cardFollowers(card: FollowerColumns): CardFollowers {
  return Object.fromEntries(
    COUNTED_SOCIALS.map(({ value }) => [value, card[FOLLOWER_COLUMN[value]]]),
  ) as CardFollowers;
}

function followerColumns(followers: CardFollowers): FollowerColumns {
  return Object.fromEntries(
    COUNTED_SOCIALS.map(({ value }) => [FOLLOWER_COLUMN[value], followers[value]]),
  ) as FollowerColumns;
}

/** A card's content as the table's columns. */
function cardColumns({ followers, ...content }: CardValues) {
  return { ...content, ...followerColumns(followers) };
}

/* ---------------------------------------------------------------------- */
/* Creator                                                                 */
/* ---------------------------------------------------------------------- */

export async function getMyCard(userId: string): Promise<CreatorCard | null> {
  const row = await db().query.creatorCards.findFirst({ where: eq(creatorCards.userId, userId) });
  return row ?? null;
}

const sameEntries = (a: object, b: object) =>
  JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

/* What the team reviews: everything but the follower counts. Arrays
   compare in order, so both sides are in the order they are stored. */
function sameContent(card: CreatorCard, values: CardValues) {
  const stored: Omit<CardValues, "followers"> = {
    displayName: card.displayName,
    country: card.country ?? "",
    creatorType: card.creatorType as CardValues["creatorType"],
    languages: (card.languages ?? []) as CardValues["languages"],
    languagesOther: card.languagesOther,
    contentTypes: (card.contentTypes ?? []) as CardValues["contentTypes"],
    contentTypesOther: card.contentTypesOther,
    tagline: card.tagline ?? "",
    socials: card.socials,
  };
  const keys = Object.keys(stored) as (keyof typeof stored)[];
  return keys.every((key) =>
    key === "socials"
      ? sameEntries(stored.socials, values.socials)
      : JSON.stringify(stored[key]) === JSON.stringify(values[key]),
  );
}

/** What a save did: made the card, sent a changed one back for review,
    kept new follower counts without a review ("counts"), or nothing. */
export type SubmitOutcome = "created" | "resubmitted" | "counts" | "unchanged";

/** What a save does about the card's photo: leave it, go back to the
    picture from the sign-in account, or take a newly uploaded one, whose
    object is already in S3 under `key`. */
export type PhotoChange = { kind: "keep" } | { kind: "remove" } | { kind: "replace"; key: string };

/** Where a creator's uploaded card photo is stored. A new key for every
    upload, so a photo's URL always means that photo and a reviewer never
    reads one picture and approves another. */
export function cardPhotoKey(userId: string, extension: string) {
  return `creator-cards/${userId}/${randomUUID()}.${extension}`;
}

/** Save the creator's card and send it for review. The first time makes
    the card; after that every change, to a pending, approved or rejected
    card alike, sends the new version back for review. The photo counts as
    part of the card: a new one, or going back to the account's picture,
    is a change like any other. Saving a card exactly as it stands changes
    nothing, so an approved card is not put back in the queue by an idle
    press of the button; a rejected one may be sent again as it is.

    The follower counts stand apart: when they are all that changed, they
    are saved and the card stays as it was, approved or in review.

    The caller has validated `values` and, for a new photo, has already
    stored it. `replacedPhotoKey` is the object the card no longer points
    at, for the caller to delete once this has committed. */
export async function submitMyCard(
  userId: string,
  values: CardValues,
  photo: PhotoChange = { kind: "keep" },
): Promise<{ card: CreatorCard; outcome: SubmitOutcome; replacedPhotoKey: string | null }> {
  return db().transaction(async (tx) => {
    const mine = () => tx.select().from(creatorCards).where(eq(creatorCards.userId, userId)).for("update");
    const now = new Date();
    let [current] = await mine();
    if (!current) {
      const [created] = await tx
        .insert(creatorCards)
        .values({
          userId,
          ...cardColumns(values),
          photoKey: photo.kind === "replace" ? photo.key : null,
          status: "pending",
          submittedAt: now,
        })
        .onConflictDoNothing({ target: creatorCards.userId })
        .returning();
      if (created) return { card: created, outcome: "created", replacedPhotoKey: null };
      // A second press of the button got here while the first was still
      // writing. That insert has committed by now, so the row is there.
      [current] = await mine();
      if (!current) throw new Error("creator_cards: the insert conflicted, but no row has this user_id");
    }
    const photoKey = photo.kind === "keep" ? current.photoKey : photo.kind === "replace" ? photo.key : null;
    const samePhoto = photoKey === current.photoKey;
    if (current.status !== "rejected" && samePhoto && sameContent(current, values)) {
      if (sameEntries(cardFollowers(current), values.followers)) {
        return { card: current, outcome: "unchanged", replacedPhotoKey: null };
      }
      const [counted] = await tx
        .update(creatorCards)
        .set({ ...followerColumns(values.followers), updatedAt: now })
        .where(eq(creatorCards.id, current.id))
        .returning();
      return { card: counted, outcome: "counts", replacedPhotoKey: null };
    }
    const [updated] = await tx
      .update(creatorCards)
      .set({
        ...cardColumns(values),
        photoKey,
        status: "pending",
        revision: current.revision + 1,
        submittedAt: now,
        updatedAt: now,
      })
      .where(eq(creatorCards.id, current.id))
      .returning();
    return { card: updated, outcome: "resubmitted", replacedPhotoKey: samePhoto ? null : current.photoKey };
  });
}

/* ---------------------------------------------------------------------- */
/* Claiming a card the team made                                           */
/* ---------------------------------------------------------------------- */

/** A card that can still be claimed: approved, and nobody's yet. */
export async function getClaimableCard(id: string): Promise<CreatorCard | null> {
  const row = await db().query.creatorCards.findFirst({
    where: and(eq(creatorCards.id, id), isNull(creatorCards.userId), eq(creatorCards.status, "approved")),
  });
  return row ?? null;
}

/** What a claim did: the card is now this person's ("claimed"), somebody
    else got there first or the card is gone ("taken"), or this person
    already has a card of their own ("has-card"). */
export type ClaimOutcome = "claimed" | "taken" | "has-card";

const isUniqueViolation = (error: unknown): boolean => {
  // Drizzle wraps the driver's error; the code is on the cause.
  for (let e = error as { code?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === "23505") return true;
  }
  return false;
};

/** Make `userId` the owner of a card nobody owns. One statement, so of two
    people claiming the same card at once exactly one gets it: the second
    update waits for the first, then finds the card taken. The index that
    allows one card per person turns away someone who already has a card.

    A claim changes who owns the card and nothing on it, so the card stays
    approved and its revision stays where it was. Whatever the new owner
    changes afterwards goes to review like any other change. */
export async function claimCard(userId: string, cardId: string): Promise<ClaimOutcome> {
  const now = new Date();
  try {
    const [claimed] = await db()
      .update(creatorCards)
      .set({ userId, claimedAt: now, updatedAt: now })
      .where(and(eq(creatorCards.id, cardId), isNull(creatorCards.userId), eq(creatorCards.status, "approved")))
      .returning({ id: creatorCards.id });
    if (claimed) return "claimed";
  } catch (error) {
    if (isUniqueViolation(error)) return "has-card";
    throw error;
  }
  // Nothing was written. A second press of the button finds the card
  // already theirs; otherwise it is someone else's, or not there.
  const mine = await getMyCard(userId);
  return mine?.id === cardId ? "claimed" : mine ? "has-card" : "taken";
}

/* ---------------------------------------------------------------------- */
/* The public directory                                                    */
/* ---------------------------------------------------------------------- */

export const CREATORS_PAGE_SIZE = 30;

export type PublicCard = Pick<
  CreatorCard,
  | "id"
  | "displayName"
  | "country"
  | "creatorType"
  | "languages"
  | "languagesOther"
  | "contentTypes"
  | "contentTypesOther"
  | "tagline"
  | "photoKey"
  | "socials"
  | "totalFollowers"
> & {
  /** Nobody owns it yet, so it can be claimed. */
  unclaimed: boolean;
  /** The owner's sign-in picture, which the card shows without an upload. */
  ownerPicture: string | null;
};

/* `%` and `_` mean "anything" to LIKE; a name typed with one means itself. */
const likePattern = (text: string) => `%${text.replace(/[\\%_]/g, "\\$&")}%`;

/** One page of the approved cards, the most followed first, narrowed by a
    part of the name and by country. With it, what the filters need: how
    many approved cards there are in all, and how many in each country. A
    card with no country is counted in the total and in no country.

    Only what the public card shows is read: never the owner's name or
    address, the review note, or a card that is not approved. */
export async function listPublicCards(view: CreatorsView, page = 1) {
  const approved = eq(creatorCards.status, "approved");
  const where = and(
    approved,
    view.country ? eq(creatorCards.country, view.country) : undefined,
    view.q ? sql`${creatorCards.displayName} ilike ${likePattern(view.q)}` : undefined,
  );
  const offset = Math.max(0, page - 1) * CREATORS_PAGE_SIZE;
  const [rows, [{ matching }], countries] = await Promise.all([
    db()
      .select({
        id: creatorCards.id,
        displayName: creatorCards.displayName,
        country: creatorCards.country,
        creatorType: creatorCards.creatorType,
        languages: creatorCards.languages,
        languagesOther: creatorCards.languagesOther,
        contentTypes: creatorCards.contentTypes,
        contentTypesOther: creatorCards.contentTypesOther,
        tagline: creatorCards.tagline,
        photoKey: creatorCards.photoKey,
        socials: creatorCards.socials,
        totalFollowers: creatorCards.totalFollowers,
        unclaimed: sql<boolean>`${creatorCards.userId} is null`,
        ownerPicture: users.picture,
      })
      .from(creatorCards)
      .leftJoin(users, eq(users.id, creatorCards.userId))
      .where(where)
      // The id settles a tie, so a card never shows on two pages.
      .orderBy(desc(creatorCards.totalFollowers), asc(sql`lower(${creatorCards.displayName})`), asc(creatorCards.id))
      .limit(CREATORS_PAGE_SIZE)
      .offset(offset),
    db().select({ matching: sql<number>`count(*)::int` }).from(creatorCards).where(where),
    db()
      .select({ country: creatorCards.country, count: sql<number>`count(*)::int` })
      .from(creatorCards)
      .where(approved)
      .groupBy(creatorCards.country),
  ]);
  return {
    rows: rows as PublicCard[],
    /** How many cards the filters leave. */
    matching,
    /** How many approved cards there are, whatever the filters. */
    total: countries.reduce((sum, { count }) => sum + count, 0),
    /** The countries that have a card, the fullest first, then A to Z. */
    countries: countries
      .filter((entry): entry is { country: string; count: number } => entry.country !== null)
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country)),
    page,
    pageSize: CREATORS_PAGE_SIZE,
  };
}

/* ---------------------------------------------------------------------- */
/* Admin                                                                   */
/* ---------------------------------------------------------------------- */

export type CardFilter = "all" | CreatorCardStatus;

export const CARDS_PAGE_SIZE = 50;

export type CardListRow = {
  id: string;
  status: CreatorCardStatus;
  displayName: string;
  country: string | null;
  creatorType: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  /** The owner's sign-in address; null for a card nobody has claimed. */
  email: string | null;
};

/** One page of cards for the dashboard, newest first, with how many the
    filter holds in all. */
export async function listCards(filter: CardFilter, page = 1) {
  const where = filter === "all" ? undefined : eq(creatorCards.status, filter);
  const offset = Math.max(0, page - 1) * CARDS_PAGE_SIZE;
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select({
        id: creatorCards.id,
        status: creatorCards.status,
        displayName: creatorCards.displayName,
        country: creatorCards.country,
        creatorType: creatorCards.creatorType,
        submittedAt: creatorCards.submittedAt,
        createdAt: creatorCards.createdAt,
        email: users.email,
      })
      .from(creatorCards)
      .leftJoin(users, eq(users.id, creatorCards.userId))
      .where(where)
      // A card the team made has no submitted date and sorts by when it was
      // made. The id settles a tie, so a row never shows on two pages.
      .orderBy(desc(sql`coalesce(${creatorCards.submittedAt}, ${creatorCards.createdAt})`), desc(creatorCards.id))
      .limit(CARDS_PAGE_SIZE)
      .offset(offset),
    db().select({ total: sql<number>`count(*)::int` }).from(creatorCards).where(where),
  ]);
  return { rows: rows as CardListRow[], total, page, pageSize: CARDS_PAGE_SIZE };
}

export async function countCardsByStatus() {
  const rows = await db()
    .select({ status: creatorCards.status, count: sql<number>`count(*)::int` })
    .from(creatorCards)
    .groupBy(creatorCards.status);
  const counts: Record<CreatorCardStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

export async function getCard(id: string) {
  return db().query.creatorCards.findFirst({
    where: eq(creatorCards.id, id),
    with: { user: true, reviewer: true },
  });
}

/** An admin's review: approve, reject, or take a decision back to pending.
    `revision` is the version of the card the admin was looking at. If the
    creator has changed the card since, nothing is written and CardChanged
    is thrown, so what gets approved is what was read. */
export async function reviewCard(args: {
  cardId: string;
  actorId: string;
  status: CreatorCardStatus;
  revision: number;
  note: string | null;
}): Promise<CreatorCard> {
  const decided = args.status !== "pending";
  const now = new Date();
  const [updated] = await db()
    .update(creatorCards)
    .set({
      status: args.status,
      reviewNote: args.note,
      reviewedBy: decided ? args.actorId : null,
      reviewedAt: decided ? now : null,
      updatedAt: now,
    })
    .where(and(eq(creatorCards.id, args.cardId), eq(creatorCards.revision, args.revision)))
    .returning();
  if (updated) return updated;
  const exists = await db().query.creatorCards.findFirst({
    where: eq(creatorCards.id, args.cardId),
    columns: { id: true },
  });
  throw exists ? new CardChanged() : new CardNotFound();
}
