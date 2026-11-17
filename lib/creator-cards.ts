import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { CardClaimStatus, CreatorCard, CreatorCardStatus } from "@/lib/db/schema";
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
   approved from the start and belong to nobody. A signed-in person can
   claim one, and the team reads the claim before the card changes hands
   (see "Claiming a card the team made" below). */

const { creatorCards, creatorCardClaims, users } = schema;

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

/* A claim is a request, never a transfer. Signing in proves an email
   address; it does not prove that its owner runs the channel on the card,
   and anyone could sign in and say they are a well-known teacher. So a
   claim only records who is asking, with a code made here, and the card
   stays as it is, unowned and in the directory. The claimant shows the
   code on the channel the card links to; an admin looks for it there and
   approves or rejects (reviewClaim). Only an approval gives the card an
   owner.

   Several people may claim one card; approving one rejects the others. A
   person can have one claim waiting, and none while they have a card. */

/** A card that can still be claimed: approved, and nobody's yet. */
export async function getClaimableCard(id: string): Promise<CreatorCard | null> {
  const row = await db().query.creatorCards.findFirst({
    where: and(eq(creatorCards.id, id), isNull(creatorCards.userId), eq(creatorCards.status, "approved")),
  });
  return row ?? null;
}

/* What a claimant reads when their claim was turned away without anyone
   deciding against them in particular. */
const SUPERSEDED_NOTE = "This card has been claimed by its creator.";
const UNDONE_NOTE = "Our team approved this claim by mistake and has taken the approval back.";

/* No 0, O, 1, I or L: the code is typed by hand into a profile. */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A code no one could guess or already have on their profile: "BC-" and
    eight characters, about 10^12 possibilities. */
function claimCode() {
  let code = "";
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return `BC-${code}`;
}

/** What a request did: it is with the team ("requested"); the card is
    someone's already or gone ("taken"); this person has a card of their
    own ("has-card"); or they already have a claim waiting ("has-claim"). */
export type ClaimRequestOutcome = "requested" | "taken" | "has-card" | "has-claim";

/** Record that `userId` says the card is theirs. Nothing about the card
    changes. The index that allows one waiting claim per person settles two
    presses of the button: the second inserts nothing. */
export async function requestClaim(userId: string, cardId: string, note: string | null): Promise<ClaimRequestOutcome> {
  return db().transaction(async (tx) => {
    const [mine] = await tx.select({ id: creatorCards.id }).from(creatorCards).where(eq(creatorCards.userId, userId));
    if (mine) return "has-card";
    const [card] = await tx
      .select({ id: creatorCards.id })
      .from(creatorCards)
      .where(and(eq(creatorCards.id, cardId), isNull(creatorCards.userId), eq(creatorCards.status, "approved")));
    if (!card) return "taken";
    const [created] = await tx
      .insert(creatorCardClaims)
      .values({ cardId, userId, code: claimCode(), note })
      .onConflictDoNothing()
      .returning({ id: creatorCardClaims.id });
    return created ? "requested" : "has-claim";
  });
}

/** The person's most recent claim, with the card it is on: the one that is
    waiting if there is one, otherwise the last one decided. */
export async function getMyClaim(userId: string) {
  const row = await db().query.creatorCardClaims.findFirst({
    where: eq(creatorCardClaims.userId, userId),
    orderBy: [desc(creatorCardClaims.createdAt), desc(creatorCardClaims.id)],
    with: { card: true },
  });
  return row ?? null;
}

/** Take back a claim that is still waiting. True if there was one. */
export async function withdrawClaim(userId: string): Promise<boolean> {
  const gone = await db()
    .delete(creatorCardClaims)
    .where(and(eq(creatorCardClaims.userId, userId), eq(creatorCardClaims.status, "pending")))
    .returning({ id: creatorCardClaims.id });
  return gone.length > 0;
}

/* Admin side. */

export type ClaimFilter = "all" | CardClaimStatus;

export const CLAIM_STATUSES: readonly CardClaimStatus[] = ["pending", "approved", "rejected"];

export const CLAIMS_PAGE_SIZE = 50;

/** One page of claims for the dashboard, newest first, with how many the
    filter holds in all. */
export async function listClaims(filter: ClaimFilter, page = 1) {
  const where = filter === "all" ? undefined : eq(creatorCardClaims.status, filter);
  const offset = Math.max(0, page - 1) * CLAIMS_PAGE_SIZE;
  const [rows, [{ total }]] = await Promise.all([
    db()
      .select({
        id: creatorCardClaims.id,
        status: creatorCardClaims.status,
        createdAt: creatorCardClaims.createdAt,
        cardId: creatorCardClaims.cardId,
        cardName: creatorCards.displayName,
        claimantName: users.name,
        claimantEmail: users.email,
      })
      .from(creatorCardClaims)
      .innerJoin(creatorCards, eq(creatorCards.id, creatorCardClaims.cardId))
      .innerJoin(users, eq(users.id, creatorCardClaims.userId))
      .where(where)
      .orderBy(desc(creatorCardClaims.createdAt), desc(creatorCardClaims.id))
      .limit(CLAIMS_PAGE_SIZE)
      .offset(offset),
    db().select({ total: sql<number>`count(*)::int` }).from(creatorCardClaims).where(where),
  ]);
  return { rows, total, page, pageSize: CLAIMS_PAGE_SIZE };
}

export async function countClaimsByStatus() {
  const rows = await db()
    .select({ status: creatorCardClaims.status, count: sql<number>`count(*)::int` })
    .from(creatorCardClaims)
    .groupBy(creatorCardClaims.status);
  const counts: Record<CardClaimStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) counts[row.status] = row.count;
  return counts;
}

/** Every claim on one card, the waiting ones first, then newest first. */
export async function listCardClaims(cardId: string) {
  return db().query.creatorCardClaims.findMany({
    where: eq(creatorCardClaims.cardId, cardId),
    orderBy: [sql`${creatorCardClaims.status} = 'pending' desc`, desc(creatorCardClaims.createdAt)],
    with: { claimant: true, reviewer: true },
  });
}

/** What a review of a claim did. "decided": it had been decided already.
    "card-taken": the card has an owner now, so nobody else can have it.
    "claimant-has-card": the claimant has made a card of their own since. */
export type ClaimReviewOutcome = "approved" | "rejected" | "decided" | "card-taken" | "claimant-has-card" | "missing";

/** An admin's decision on a claim. Approving is the one place a card the
    team made gets an owner: the card and the claim are locked together, so
    two admins approving two claims on one card cannot both succeed, and
    every other claim waiting on that card is rejected in the same step. */
export async function reviewClaim(args: {
  claimId: string;
  actorId: string;
  decision: "approved" | "rejected";
  note: string | null;
}): Promise<{ outcome: ClaimReviewOutcome; cardId: string | null }> {
  return db().transaction(async (tx) => {
    const [claim] = await tx
      .select()
      .from(creatorCardClaims)
      .where(eq(creatorCardClaims.id, args.claimId))
      .for("update");
    if (!claim) return { outcome: "missing", cardId: null };
    const cardId = claim.cardId;
    if (claim.status !== "pending") return { outcome: "decided", cardId };
    const now = new Date();
    const decided = { reviewedBy: args.actorId, reviewedAt: now, updatedAt: now };

    if (args.decision === "rejected") {
      await tx
        .update(creatorCardClaims)
        .set({ status: "rejected", reviewNote: args.note, ...decided })
        .where(eq(creatorCardClaims.id, claim.id));
      return { outcome: "rejected", cardId };
    }

    const [card] = await tx.select().from(creatorCards).where(eq(creatorCards.id, cardId)).for("update");
    if (!card || card.userId) return { outcome: "card-taken", cardId };
    const [theirs] = await tx
      .select({ id: creatorCards.id })
      .from(creatorCards)
      .where(eq(creatorCards.userId, claim.userId));
    if (theirs) return { outcome: "claimant-has-card", cardId };

    // The owner changes and nothing on the card does: it stays approved,
    // at the same revision. What the owner changes later goes to review.
    await tx
      .update(creatorCards)
      .set({ userId: claim.userId, claimedAt: now, updatedAt: now })
      .where(eq(creatorCards.id, cardId));
    await tx
      .update(creatorCardClaims)
      .set({ status: "approved", reviewNote: args.note, ...decided })
      .where(eq(creatorCardClaims.id, claim.id));
    await tx
      .update(creatorCardClaims)
      .set({ status: "rejected", reviewNote: SUPERSEDED_NOTE, ...decided })
      .where(and(eq(creatorCardClaims.cardId, cardId), eq(creatorCardClaims.status, "pending")));
    return { outcome: "approved", cardId };
  });
}

/** What undoing an approval did. "not-approved": the claim is not an
    approved one. "moved-on": the card is no longer this claimant's by
    that claim, so there is nothing of theirs to take back. */
export type ClaimUndoOutcome = "undone" | "not-approved" | "moved-on" | "missing";

/** Take back an approval that was a mistake: the card loses the owner the
    claim gave it and can be claimed again.

    - The claim becomes a rejected one, with the admin's note or a line
      saying the approval was taken back, which is what the person now
      reads on their card page.
    - The claims the approval turned away on its own are put back in the
      queue, since one of them may be the real creator's. One whose
      claimant has since claimed something else, or made a card, stays
      rejected: a person has one claim waiting, and one card.
    - If the person changed the card while it was theirs, those words and
      links are not the team's and may not be the creator's, so the card
      goes back to pending, out of the directory, until an admin has read
      it. A card they never changed stays approved as the team made it.

    Only a card that got its owner through a claim can be undone here. A
    card a creator made themselves is theirs. */
export async function undoClaimApproval(args: {
  claimId: string;
  actorId: string;
  note: string | null;
}): Promise<{ outcome: ClaimUndoOutcome; cardId: string | null; edited: boolean; reopened: number }> {
  return db().transaction(async (tx) => {
    const none = { edited: false, reopened: 0 };
    const [claim] = await tx
      .select()
      .from(creatorCardClaims)
      .where(eq(creatorCardClaims.id, args.claimId))
      .for("update");
    if (!claim) return { outcome: "missing", cardId: null, ...none };
    const cardId = claim.cardId;
    if (claim.status !== "approved") return { outcome: "not-approved", cardId, ...none };
    const [card] = await tx.select().from(creatorCards).where(eq(creatorCards.id, cardId)).for("update");
    if (!card || card.userId !== claim.userId || !card.claimedAt) return { outcome: "moved-on", cardId, ...none };

    const now = new Date();
    // A card the team made has never been submitted; an owner's change
    // submits it.
    const edited = card.submittedAt !== null;
    await tx
      .update(creatorCards)
      .set({
        userId: null,
        claimedAt: null,
        updatedAt: now,
        ...(edited ? { status: "pending" as const, revision: card.revision + 1, reviewedBy: null, reviewedAt: null } : {}),
      })
      .where(eq(creatorCards.id, cardId));
    await tx
      .update(creatorCardClaims)
      .set({
        status: "rejected",
        reviewNote: args.note ?? UNDONE_NOTE,
        reviewedBy: args.actorId,
        reviewedAt: now,
        updatedAt: now,
      })
      .where(eq(creatorCardClaims.id, claim.id));
    // The claims that approval rejected carry its note and its exact time.
    const reopened = claim.reviewedAt
      ? await tx
          .update(creatorCardClaims)
          .set({ status: "pending", reviewNote: null, reviewedBy: null, reviewedAt: null, updatedAt: now })
          .where(
            and(
              eq(creatorCardClaims.cardId, cardId),
              eq(creatorCardClaims.status, "rejected"),
              eq(creatorCardClaims.reviewNote, SUPERSEDED_NOTE),
              eq(creatorCardClaims.reviewedAt, claim.reviewedAt),
              sql`not exists (select 1 from ${creatorCardClaims} as waiting where waiting.user_id = ${creatorCardClaims.userId} and waiting.status = 'pending')`,
              sql`not exists (select 1 from ${creatorCards} as theirs where theirs.user_id = ${creatorCardClaims.userId})`,
            ),
          )
          .returning({ id: creatorCardClaims.id })
      : [];
    return { outcome: "undone", cardId, edited, reopened: reopened.length };
  });
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
