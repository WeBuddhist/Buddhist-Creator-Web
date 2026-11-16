import "server-only";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { CreatorCard, CreatorCardStatus } from "@/lib/db/schema";
import { COUNTED_SOCIALS, type CardFollowers, type CardValues, type CountedSocial } from "@/lib/creator-card";

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
   neither the status nor the revision moves. */

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
