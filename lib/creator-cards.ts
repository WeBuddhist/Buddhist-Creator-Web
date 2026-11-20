import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type {
  CardClaimStatus,
  CreatorCard,
  CreatorCardStatus,
  CreatorFollowerCheck,
  FollowerCheckStatus,
} from "@/lib/db/schema";
import {
  AUDIENCE_BANDS,
  COUNTED_SOCIALS,
  PROFILE_PICTURE_PREFIX,
  socialLinkKey,
  type CardFollowers,
  type CardSocials,
  type CardValues,
  type CountedSocial,
  type TeamCardValues,
} from "@/lib/creator-card";
import {
  LEADERBOARD_PLACES,
  LEADERBOARD_SIZE,
  type BoardSource,
  type CreatorsView,
  type LeaderboardPlace,
} from "@/lib/creators";
import type { FollowerReading } from "@/lib/follower-reading";

/* Everything that reads or writes creator cards. Callers pass the current
   user in and check the role; the status rules live here, not in the UI.

   A card's content only ever reaches `approved` through a review of that
   exact content: a creator's change puts the card back to pending and
   moves its revision on, and a review that read an older revision is
   refused.

   The follower counts are the one part of a card that is not reviewed.
   The review is there to say that this is a creator and the card is
   theirs, and a number says nothing about that; it is kept to rank
   creators by. Nobody types one: each is read from the place itself every
   week, or every three months on Douyin (lib/follower-refresh.ts), and
   saved where the card stands, and neither the status nor the revision
   moves. See "Follower readings".

   The team also makes cards itself, for creators it knows. Those are
   approved from the start and belong to nobody. A signed-in person can
   claim one, and the team reads the claim before the card changes hands
   (see "Claiming a card the team made" below). */

const { creatorCards, creatorCardClaims, creatorFollowerChecks, users } = schema;

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
  douyin: "douyinFollowers",
} as const satisfies Record<CountedSocial, keyof CreatorCard>;

type FollowerColumns = Record<(typeof FOLLOWER_COLUMN)[CountedSocial], number | null>;

/** A stored card's follower counts, keyed by place. */
export function cardFollowers(card: FollowerColumns): CardFollowers {
  return Object.fromEntries(
    COUNTED_SOCIALS.map(({ value }) => [value, card[FOLLOWER_COLUMN[value]]]),
  ) as CardFollowers;
}

/** A counted link in the form links are compared in, or null for none. */
const linkKeyOf = (socials: CardSocials, place: CountedSocial) => {
  const link = socials[place]?.trim();
  return link ? socialLinkKey(place, link) : null;
};

/** The counts a save must drop: those of a counted place whose link the
    save changes or takes away. The figure was the old account's, and
    left in place it would stay in the card's total until the new account
    had been read, or for good where there is no new one. */
function staleCounts(stored: CardSocials, next: CardSocials): Partial<FollowerColumns> {
  return Object.fromEntries(
    COUNTED_SOCIALS.filter(({ value }) => linkKeyOf(stored, value) !== linkKeyOf(next, value)).map(({ value }) => [
      FOLLOWER_COLUMN[value],
      null,
    ]),
  );
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
  const stored: CardValues = {
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
    or nothing. */
export type SubmitOutcome = "created" | "resubmitted" | "unchanged";

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

    A save never carries a follower count. It only drops the count of a
    place whose link it changes, which was another account's.

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
          ...values,
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
      return { card: current, outcome: "unchanged", replacedPhotoKey: null };
    }
    const [updated] = await tx
      .update(creatorCards)
      .set({
        ...values,
        ...staleCounts(current.socials, values.socials),
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
    filter holds in all. `q` narrows it to the names that contain it. */
export async function listCards(filter: CardFilter, page = 1, q = "") {
  const where = and(
    filter === "all" ? undefined : eq(creatorCards.status, filter),
    q ? sql`${creatorCards.displayName} ilike ${likePattern(q)}` : undefined,
  );
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

/* ---------------------------------------------------------------------- */
/* The team's own cards                                                    */
/* ---------------------------------------------------------------------- */

/* A card nobody owns is the team's to keep: an admin makes one for a
   creator the team knows, puts right its name, country, line, links and
   photo, and can take it off the list (app/admin/creator-cards). Such a
   card is approved as it is made and stays approved through an edit: the
   admin is the reviewer. A card with an owner is the creator's, and none
   of this touches it.

   As with a creator's own save, no count is written here. A link that is
   changed or removed takes its count with it, and the new one is read
   afterwards (readCardLinks in lib/follower-refresh.ts). */

/** The card belongs to a creator, so the team does not edit or remove it. */
export class CardOwned extends Error {
  constructor() {
    super("CARD_OWNED");
    this.name = "CardOwned";
  }
}

/** Where a picture the team gives a card is stored: beside the profile
    pictures it took from creators' public profiles. */
export function teamPhotoKey(extension: string) {
  return `${PROFILE_PICTURE_PREFIX}${randomUUID()}.${extension}`;
}

/** The cards, other than `exceptId`, that already carry one of these
    links, by the place: the same account is one creator, and a second
    card for it would list them twice. */
export async function cardsSharingLinks(
  socials: CardSocials,
  exceptId: string | null,
): Promise<Partial<Record<CountedSocial, string>>> {
  const wanted = new Map(
    COUNTED_SOCIALS.flatMap(({ value }) => {
      const key = linkKeyOf(socials, value);
      return key ? [[`${value} ${key}`, value] as const] : [];
    }),
  );
  if (wanted.size === 0) return {};
  const rows = await db()
    .select({ id: creatorCards.id, displayName: creatorCards.displayName, socials: creatorCards.socials })
    .from(creatorCards);
  const taken: Partial<Record<CountedSocial, string>> = {};
  for (const row of rows) {
    if (row.id === exceptId) continue;
    for (const { value } of COUNTED_SOCIALS) {
      const key = linkKeyOf(row.socials, value);
      if (key && wanted.has(`${value} ${key}`)) taken[value] ??= row.displayName;
    }
  }
  return taken;
}

/** Make a card for a creator the team knows: approved, and nobody's. */
export async function createTeamCard(args: {
  actorId: string;
  values: TeamCardValues;
  photoKey: string | null;
}): Promise<CreatorCard> {
  const now = new Date();
  const [created] = await db()
    .insert(creatorCards)
    .values({
      ...args.values,
      photoKey: args.photoKey,
      status: "approved",
      reviewedBy: args.actorId,
      reviewedAt: now,
    })
    .returning();
  return created;
}

/** Change a card nobody owns. Its standing stays as it is; the revision
    moves on, so a review opened on the older version is refused.
    `replacedPhotoKey` is the object the card no longer points at, for the
    caller to delete once this has committed. */
export async function updateTeamCard(args: {
  cardId: string;
  values: TeamCardValues;
  photo: PhotoChange;
}): Promise<{ card: CreatorCard; replacedPhotoKey: string | null }> {
  return db().transaction(async (tx) => {
    const [current] = await tx.select().from(creatorCards).where(eq(creatorCards.id, args.cardId)).for("update");
    if (!current) throw new CardNotFound();
    if (current.userId) throw new CardOwned();
    const photoKey =
      args.photo.kind === "keep" ? current.photoKey : args.photo.kind === "replace" ? args.photo.key : null;
    const [updated] = await tx
      .update(creatorCards)
      .set({
        ...args.values,
        ...staleCounts(current.socials, args.values.socials),
        photoKey,
        revision: current.revision + 1,
        updatedAt: new Date(),
      })
      .where(eq(creatorCards.id, current.id))
      .returning();
    return { card: updated, replacedPhotoKey: photoKey === current.photoKey ? null : current.photoKey };
  });
}

/** Give a card nobody owns the picture it does not have yet. False when
    it has one by now, or an owner, or is gone. */
export async function giveTeamCardPhoto(cardId: string, photoKey: string): Promise<boolean> {
  const updated = await db()
    .update(creatorCards)
    .set({ photoKey })
    .where(and(eq(creatorCards.id, cardId), isNull(creatorCards.userId), isNull(creatorCards.photoKey)))
    .returning({ id: creatorCards.id });
  return updated.length > 0;
}

/** Take a card nobody owns off the list for good, with its readings and
    any claims on it. Returns the photo it had, for the caller to delete. */
export async function deleteTeamCard(cardId: string): Promise<{ displayName: string; photoKey: string | null }> {
  return db().transaction(async (tx) => {
    const [current] = await tx.select().from(creatorCards).where(eq(creatorCards.id, cardId)).for("update");
    if (!current) throw new CardNotFound();
    if (current.userId) throw new CardOwned();
    await tx.delete(creatorCards).where(eq(creatorCards.id, cardId));
    return { displayName: current.displayName, photoKey: current.photoKey };
  });
}

/* ---------------------------------------------------------------------- */
/* Follower readings                                                       */
/* ---------------------------------------------------------------------- */

/* The counts are read from each place every week (Douyin every three
   months) by lib/follower-refresh.ts, which decides what is due and asks
   the services; what is here is its reading and writing of the tables, and
   what the pages show of it. */

/** One counted link of one card. */
export type CountedLink = { cardId: string; platform: CountedSocial; link: string; linkKey: string };

/** Every counted link there is to read: those of the approved cards,
    which are the ones the directory lists. A card waiting for a review is
    not read, and neither is a rejected one: a reading costs a credit, and
    it would be thrown away if the card were turned down. Once a card is
    approved its links are due, and the next daily run reads them. */
export async function listCountedLinks(): Promise<CountedLink[]> {
  const rows = await db()
    .select({ id: creatorCards.id, socials: creatorCards.socials })
    .from(creatorCards)
    .where(eq(creatorCards.status, "approved"))
    .orderBy(asc(creatorCards.id));
  return rows.flatMap(({ id, socials }) =>
    COUNTED_SOCIALS.flatMap(({ value }) => {
      const link = socials[value]?.trim();
      return link ? [{ cardId: id, platform: value, link, linkKey: socialLinkKey(value, link) }] : [];
    }),
  );
}

/** The latest reading of each card's each place, whatever link it was of. */
export async function listLatestChecks(): Promise<CreatorFollowerCheck[]> {
  return db()
    .selectDistinctOn([creatorFollowerChecks.cardId, creatorFollowerChecks.platform])
    .from(creatorFollowerChecks)
    .orderBy(creatorFollowerChecks.cardId, creatorFollowerChecks.platform, desc(creatorFollowerChecks.week));
}

/** The id each account of one place was last read under, keyed as
    accountKey keys it. */
export async function knownAccountIds(platform: CountedSocial): Promise<Map<string, string>> {
  const rows = await db()
    .selectDistinctOn([creatorFollowerChecks.cardId, creatorFollowerChecks.linkKey], {
      cardId: creatorFollowerChecks.cardId,
      linkKey: creatorFollowerChecks.linkKey,
      externalId: creatorFollowerChecks.externalId,
    })
    .from(creatorFollowerChecks)
    .where(
      and(
        eq(creatorFollowerChecks.platform, platform),
        eq(creatorFollowerChecks.status, "ok"),
        sql`${creatorFollowerChecks.externalId} is not null`,
      ),
    )
    .orderBy(creatorFollowerChecks.cardId, creatorFollowerChecks.linkKey, desc(creatorFollowerChecks.week));
  return new Map(rows.map((row) => [accountKey(row), row.externalId!]));
}

export const accountKey = ({ cardId, linkKey }: { cardId: string; linkKey: string }) => `${cardId} ${linkKey}`;

/** Keep one reading: the week's row for that card and place, and, when
    there is a figure, the card's own count. Nothing else on the card
    moves: not its status, its revision, or the dates that say when a
    person last changed or sent it.

    The card is locked and its link looked at again first. If the creator
    changed the link while the service was being asked, the reading is for
    an account the card no longer names, and is dropped ("moved"). */
export async function saveFollowerCheck(args: {
  link: CountedLink;
  week: string;
  reading: FollowerReading;
  at: Date;
}): Promise<"saved" | "moved"> {
  const { link, week, reading, at } = args;
  return db().transaction(async (tx) => {
    const [card] = await tx
      .select({ socials: creatorCards.socials })
      .from(creatorCards)
      .where(eq(creatorCards.id, link.cardId))
      .for("update");
    if (!card || card.socials[link.platform]?.trim() !== link.link) return "moved";
    const ok = reading.status === "ok";
    const row = {
      linkKey: link.linkKey,
      status: reading.status,
      followers: ok ? reading.followers : null,
      externalId: ok ? reading.externalId : null,
      handle: ok ? reading.handle : null,
      checkedAt: at,
    };
    await tx
      .insert(creatorFollowerChecks)
      .values({ cardId: link.cardId, platform: link.platform, week, ...row })
      .onConflictDoUpdate({
        target: [creatorFollowerChecks.cardId, creatorFollowerChecks.platform, creatorFollowerChecks.week],
        set: row,
      });
    if (ok) {
      await tx
        .update(creatorCards)
        .set({ [FOLLOWER_COLUMN[link.platform]]: reading.followers })
        .where(eq(creatorCards.id, link.cardId));
    }
    return "saved";
  });
}

/** Where the reading of one link stands, for a page to say. */
export type LinkCheck = { status: FollowerCheckStatus; checkedAt: Date };

/** The latest reading of each counted link a card has now. A place whose
    link has not been read yet, or has changed since it was, has none. */
export async function cardLinkChecks(card: {
  id: string;
  socials: CardSocials;
}): Promise<Partial<Record<CountedSocial, LinkCheck>>> {
  const rows = await db()
    .selectDistinctOn([creatorFollowerChecks.platform])
    .from(creatorFollowerChecks)
    .where(eq(creatorFollowerChecks.cardId, card.id))
    .orderBy(creatorFollowerChecks.platform, desc(creatorFollowerChecks.week));
  return Object.fromEntries(
    rows
      .filter((row) => row.linkKey === linkKeyOf(card.socials, row.platform))
      .map((row) => [row.platform, { status: row.status, checkedAt: row.checkedAt }]),
  );
}

export type UnreadLink = {
  cardId: string;
  displayName: string;
  platform: CountedSocial;
  link: string;
  status: Exclude<FollowerCheckStatus, "ok">;
  checkedAt: Date;
  /** The count the card still shows for it, from before. */
  followers: number | null;
};

/** The links whose latest reading gave no figure, for the team to look
    at: a mistyped address, an account that is gone, a personal profile.
    By creator name. */
export async function listUnreadLinks(): Promise<UnreadLink[]> {
  const rows = await db()
    .selectDistinctOn([creatorFollowerChecks.cardId, creatorFollowerChecks.platform], {
      check: creatorFollowerChecks,
      card: creatorCards,
    })
    .from(creatorFollowerChecks)
    .innerJoin(creatorCards, eq(creatorCards.id, creatorFollowerChecks.cardId))
    // Only approved cards are read, so only theirs can be waiting on a fix.
    .where(eq(creatorCards.status, "approved"))
    .orderBy(creatorFollowerChecks.cardId, creatorFollowerChecks.platform, desc(creatorFollowerChecks.week));
  return rows
    .flatMap(({ check, card }) => {
      const link = card.socials[check.platform]?.trim();
      if (check.status === "ok" || !link || socialLinkKey(check.platform, link) !== check.linkKey) return [];
      return [
        {
          cardId: card.id,
          displayName: card.displayName,
          platform: check.platform,
          link,
          status: check.status,
          checkedAt: check.checkedAt,
          followers: card[FOLLOWER_COLUMN[check.platform]],
        },
      ];
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName) || a.platform.localeCompare(b.platform));
}

/* ---------------------------------------------------------------------- */
/* Leaderboard                                                             */
/* ---------------------------------------------------------------------- */

/* The creators with the largest audiences: in all their counted places
   together, and in each place by itself. It is made of what the weekly
   reading keeps (lib/follower-refresh.ts): the card's own counts rank
   it, and two weeks of readings set beside each other say how far a
   creator has moved since the last one. A place read less often than
   weekly (Douyin, every three months) counts at its latest figure in the
   weeks between, so it shows no change then, and moves in the week it is
   read. */

export type LeaderboardRow = {
  id: string;
  displayName: string;
  country: string | null;
  photoKey: string | null;
  ownerPicture: string | null;
  /** The audience the board ranks on: in that place, or in all of them. */
  followers: number;
  /** How far that figure has moved since last week's reading. Null
      until there are two readings of the same account to compare. */
  gain: number | null;
  /** How many places the creator has moved up the board since last
      week's reading, less than nothing for places lost. Null when last
      week has no place for them to compare with. */
  climbed: number | null;
  /** On the board for the first time: there is no reading of theirs from
      last week or before. */
  fresh: boolean;
  /** The channels the figure is made of: the one place, or, on the board
      of all places, every place the creator has a count in. */
  sources: BoardSource[];
};

export type Leaderboard = {
  /** The boards asked for, each with its first `limit` creators. */
  boards: Partial<Record<LeaderboardPlace, LeaderboardRow[]>>;
  /** How many creators each whole board has, LEADERBOARD_SIZE at most. */
  sizes: Record<LeaderboardPlace, number>;
  /** When the counts were last read (lastReadingDay). */
  readAt: Date | null;
  /** Where the card named by `standingOf` stands on each board asked for
      that it has a figure on. Empty when no card was named, or it is not
      an approved one. */
  standings: Partial<Record<LeaderboardPlace, LeaderboardStanding>>;
};

/** One card's place on one board: among everybody with a figure there,
    not only the hundred a board shows. */
export type LeaderboardStanding = {
  rank: number;
  /** How many creators have a figure there. */
  outOf: number;
  row: LeaderboardRow;
};

/** The Monday of the week before `week` ("2026-11-23" → "2026-11-16"). */
function weekBefore(week: string) {
  const day = new Date(`${week}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 7);
  return day.toISOString().slice(0, 10);
}

/** Each account's figure as it stood at the end of `week`: its latest
    reading with a figure, from that week or before. So a place read
    every three months keeps its figure through the weeks between, and a
    link that failed one week keeps the one before. Only `cardIds`' when
    given. */
function figuresAsOf(week: string, cardIds?: string[]) {
  return db()
    .selectDistinctOn([creatorFollowerChecks.cardId, creatorFollowerChecks.platform, creatorFollowerChecks.linkKey], {
      cardId: creatorFollowerChecks.cardId,
      platform: creatorFollowerChecks.platform,
      linkKey: creatorFollowerChecks.linkKey,
      followers: creatorFollowerChecks.followers,
    })
    .from(creatorFollowerChecks)
    .where(
      and(
        lte(creatorFollowerChecks.week, week),
        eq(creatorFollowerChecks.status, "ok"),
        cardIds ? inArray(creatorFollowerChecks.cardId, cardIds) : undefined,
      ),
    )
    .orderBy(
      creatorFollowerChecks.cardId,
      creatorFollowerChecks.platform,
      creatorFollowerChecks.linkKey,
      desc(creatorFollowerChecks.week),
    );
}

/** When the counts were last read: the day most of the latest week's
    readings were taken, which is the day the reading ran. A few links
    read later in the week (a new card's, a retry) do not move it. Null
    before the first reading. */
async function lastReadingDay(): Promise<Date | null> {
  const [day] = await db()
    .select({ at: sql<Date>`max(${creatorFollowerChecks.checkedAt})`.mapWith(creatorFollowerChecks.checkedAt) })
    .from(creatorFollowerChecks)
    .where(sql`${creatorFollowerChecks.week} = (select max(${creatorFollowerChecks.week}) from ${creatorFollowerChecks})`)
    .groupBy(sql`(${creatorFollowerChecks.checkedAt} at time zone 'UTC')::date`)
    .orderBy(desc(sql`count(*)`), desc(sql`max(${creatorFollowerChecks.checkedAt})`))
    .limit(1);
  return day?.at ?? null;
}

/** Everybody the listed creators reach, as their counts add up: the
    followers of every approved card in all its counted places, and how
    many creators that is. One person who follows two creators, or one
    creator in two places, is counted twice; it is an audience, not a
    head count. */
export async function networkAudience(): Promise<{ followers: number; creators: number; readAt: Date | null }> {
  const [[total], readAt] = await Promise.all([
    db()
      .select({
        followers: sql<number>`coalesce(sum(${creatorCards.totalFollowers}), 0)::float8`,
        creators: sql<number>`count(*)::int`,
      })
      .from(creatorCards)
      .where(eq(creatorCards.status, "approved")),
    lastReadingDay(),
  ]);
  return { followers: Number(total.followers), creators: total.creators, readAt };
}

/** How the creators on the board of all channels are spread over the
    audience bands (AUDIENCE_BANDS in lib/creator-card.ts): how many are in
    each, in the bands' order. A card with no figure is on no board, so it
    is in no band. */
export async function audienceSpread(): Promise<number[]> {
  const total = creatorCards.totalFollowers;
  const within = AUDIENCE_BANDS.map((band, index) => {
    const next = AUDIENCE_BANDS[index + 1];
    return next
      ? sql<number>`count(*) filter (where ${total} >= ${band.from} and ${total} < ${next.from})::int`
      : sql<number>`count(*) filter (where ${total} >= ${band.from})::int`;
  });
  const [row] = await db()
    .select(Object.fromEntries(within.map((count, index) => [`band${index}`, count])))
    .from(creatorCards)
    .where(and(eq(creatorCards.status, "approved"), sql`${total} > 0`));
  return within.map((_, index) => Number(row[`band${index}`] ?? 0));
}

/** Where a card stands among the creators of its own country, on all its
    counted places together: its place, and how many of them have a figure.
    Null for a card that is not approved, has no country or has no figure.
    The order is the boards' own: the figure, then the name, then the id. */
export async function countryStanding(card: {
  id: string;
  status: CreatorCardStatus;
  displayName: string;
  country: string | null;
  totalFollowers: number;
}): Promise<{ rank: number; outOf: number } | null> {
  const mine = Number(card.totalFollowers);
  if (card.status !== "approved" || !card.country || mine <= 0) return null;
  const total = creatorCards.totalFollowers;
  const [row] = await db()
    .select({
      outOf: sql<number>`count(*)::int`,
      ahead: sql<number>`count(*) filter (where ${total} > ${mine} or (${total} = ${mine} and (lower(${creatorCards.displayName}), ${creatorCards.id}) < (lower(${card.displayName}), ${card.id}::uuid)))::int`,
    })
    .from(creatorCards)
    .where(and(eq(creatorCards.status, "approved"), eq(creatorCards.country, card.country), sql`${total} > 0`));
  return { rank: row.ahead + 1, outOf: row.outOf };
}

/* Where every approved card stood on each board at the end of `week`
   (last week), worked out from the figures then (figuresAsOf): its place
   among the cards that had a figure, in the order the boards use. A
   card's figure then is that of the link it has now; on the board of all
   places it is those added up, and only when every place the card is
   counted in now had a figure then, so that a channel added since does
   not pass for a climb. Null when there is no reading from then or
   before, which is the first week. */
async function ranksBefore(
  week: string,
  places: readonly LeaderboardPlace[],
): Promise<{ rank: Map<string, number>; known: Set<string> } | null> {
  const [cards, readings] = await Promise.all([
    db()
      .select({
        id: creatorCards.id,
        displayName: creatorCards.displayName,
        socials: creatorCards.socials,
        youtubeFollowers: creatorCards.youtubeFollowers,
        instagramFollowers: creatorCards.instagramFollowers,
        tiktokFollowers: creatorCards.tiktokFollowers,
        facebookFollowers: creatorCards.facebookFollowers,
        douyinFollowers: creatorCards.douyinFollowers,
      })
      .from(creatorCards)
      .where(eq(creatorCards.status, "approved")),
    figuresAsOf(week),
  ]);
  if (readings.length === 0) return null;

  const read = new Map(readings.map((row) => [`${row.cardId} ${row.platform} ${row.linkKey}`, row.followers ?? 0]));
  const then = (card: (typeof cards)[number], place: CountedSocial) => {
    const key = linkKeyOf(card.socials, place);
    return key ? read.get(`${card.id} ${place} ${key}`) : undefined;
  };
  const rank = new Map<string, number>();
  for (const place of places) {
    const stood = cards.flatMap((card) => {
      let figure: number | undefined;
      if (place === "all") {
        const counted = COUNTED_SOCIALS.filter(
          ({ value }) => card.socials[value]?.trim() && (card[FOLLOWER_COLUMN[value]] ?? 0) > 0,
        ).map(({ value }) => then(card, value));
        figure = counted.length > 0 && counted.every((value) => value !== undefined)
          ? counted.reduce<number>((sum, value) => sum + (value ?? 0), 0)
          : undefined;
      } else {
        figure = then(card, place);
      }
      return figure !== undefined && figure > 0 ? [{ card, figure }] : [];
    });
    // As the boards order: the figure, then the name, then the id.
    stood.sort(
      (a, b) =>
        b.figure - a.figure ||
        a.card.displayName.toLowerCase().localeCompare(b.card.displayName.toLowerCase()) ||
        a.card.id.localeCompare(b.card.id),
    );
    stood.forEach(({ card }, index) => rank.set(`${place} ${card.id}`, index + 1));
  }
  return { rank, known: new Set(readings.map((row) => row.cardId)) };
}

const boardFigure = (place: LeaderboardPlace) =>
  place === "all" ? creatorCards.totalFollowers : creatorCards[FOLLOWER_COLUMN[place]];

/* What a board needs of a card. */
const boardCard = {
  id: creatorCards.id,
  displayName: creatorCards.displayName,
  country: creatorCards.country,
  photoKey: creatorCards.photoKey,
  socials: creatorCards.socials,
  youtubeFollowers: creatorCards.youtubeFollowers,
  instagramFollowers: creatorCards.instagramFollowers,
  tiktokFollowers: creatorCards.tiktokFollowers,
  facebookFollowers: creatorCards.facebookFollowers,
  douyinFollowers: creatorCards.douyinFollowers,
  totalFollowers: creatorCards.totalFollowers,
  ownerPicture: users.picture,
};

type BoardCard = {
  id: string;
  displayName: string;
  country: string | null;
  photoKey: string | null;
  socials: CardSocials;
  totalFollowers: number;
  ownerPicture: string | null;
} & FollowerColumns;

/** The figure a board ranks a card on. */
const figureOf = (card: BoardCard, place: LeaderboardPlace) =>
  place === "all" ? Number(card.totalFollowers) : (card[FOLLOWER_COLUMN[place]] ?? 0);

/** The boards, and with `standingOf` the place one card has on them: a
    creator's own, which may be far below the hundred a board shows.
    `offset` and `limit` take a stretch of each board, for the list that
    grows as it is scrolled; nothing past the hundredth place is given. */
export async function creatorLeaderboard(
  options: { places?: readonly LeaderboardPlace[]; limit?: number; offset?: number; standingOf?: string } = {},
): Promise<Leaderboard> {
  const places = options.places ?? LEADERBOARD_PLACES;
  const offset = Math.min(Math.max(0, options.offset ?? 0), LEADERBOARD_SIZE);
  const limit = Math.max(0, Math.min(options.limit ?? LEADERBOARD_SIZE, LEADERBOARD_SIZE - offset));
  const approved = eq(creatorCards.status, "approved");
  const cards = () => db().select(boardCard).from(creatorCards).leftJoin(users, eq(users.id, creatorCards.userId));
  const top = (place: LeaderboardPlace): Promise<BoardCard[]> => {
    const figure = boardFigure(place);
    return (
      cards()
        .where(and(approved, sql`${figure} > 0`))
        // As the directory orders: the name and the id settle a tie.
        .orderBy(desc(figure), asc(sql`lower(${creatorCards.displayName})`), asc(creatorCards.id))
        .limit(limit)
        .offset(offset)
    );
  };
  const onBoard = (place: LeaderboardPlace) => sql<number>`count(*) filter (where ${boardFigure(place)} > 0)::int`;
  const [lists, [counts], [{ week }], [own = null]] = await Promise.all([
    Promise.all(places.map(top)),
    db()
      .select({
        all: onBoard("all"),
        youtube: onBoard("youtube"),
        instagram: onBoard("instagram"),
        tiktok: onBoard("tiktok"),
        facebook: onBoard("facebook"),
        douyin: onBoard("douyin"),
      })
      .from(creatorCards)
      .where(approved),
    db().select({ week: sql<string | null>`max(${creatorFollowerChecks.week})::text` }).from(creatorFollowerChecks),
    // A card that is not approved is on no board, so it has no standing.
    options.standingOf
      ? (cards().where(and(approved, eq(creatorCards.id, options.standingOf))).limit(1) as Promise<BoardCard[]>)
      : [],
  ]);

  /* How many cards a board puts before the one asked about: those with a
     larger figure, and those level with it that the board's order (the
     name, then the id) lists first. */
  const ahead = (card: BoardCard, place: LeaderboardPlace) => {
    const figure = boardFigure(place);
    const mine = figureOf(card, place);
    return sql<number>`count(*) filter (where ${figure} > ${mine} or (${figure} = ${mine} and (lower(${creatorCards.displayName}), ${creatorCards.id}) < (lower(${card.displayName}), ${card.id}::uuid)))::int`;
  };

  const ids = [...new Set([...lists.flat(), ...(own ? [own] : [])].map((card) => card.id))];
  const [[figuresNow, figuresThen], readAt, before, [placesAhead = null]] = await Promise.all([
    week && ids.length > 0 ? Promise.all([figuresAsOf(week, ids), figuresAsOf(weekBefore(week), ids)]) : [[], []],
    lastReadingDay(),
    week && ids.length > 0 ? ranksBefore(weekBefore(week), places) : null,
    own
      ? db()
          .select({
            all: ahead(own, "all"),
            youtube: ahead(own, "youtube"),
            instagram: ahead(own, "instagram"),
            tiktok: ahead(own, "tiktok"),
            facebook: ahead(own, "facebook"),
            douyin: ahead(own, "douyin"),
          })
          .from(creatorCards)
          .where(approved)
      : [],
  ]);

  /* A place's gain: its figure now less its figure at the end of last
     week, when both are readings of the link the card has now. */
  const byAccount = (rows: typeof figuresNow) =>
    new Map(rows.map((row) => [`${row.cardId} ${row.platform} ${row.linkKey}`, row.followers]));
  const [now, then] = [byAccount(figuresNow), byAccount(figuresThen)];
  const gainIn = (card: BoardCard, place: CountedSocial) => {
    const key = linkKeyOf(card.socials, place);
    if (!key) return null;
    const after = now.get(`${card.id} ${place} ${key}`);
    const before = then.get(`${card.id} ${place} ${key}`);
    return after == null || before == null ? null : after - before;
  };

  /** A card as a board's row, at the rank it holds there. */
  const toRow = (place: LeaderboardPlace, card: BoardCard, rank: number): LeaderboardRow => {
    const stoodAt = before?.rank.get(`${place} ${card.id}`);
    // The channels with a figure, in the order the places are listed.
    const counted = COUNTED_SOCIALS.flatMap(({ value }) => {
      const link = card.socials[value]?.trim();
      const followers = card[FOLLOWER_COLUMN[value]] ?? 0;
      return link && followers > 0 ? [{ place: value, link, followers, gain: gainIn(card, value) }] : [];
    });
    const channels = place === "all" ? counted : counted.filter((entry) => entry.place === place);
    const gains = channels.flatMap(({ gain }) => (gain === null ? [] : [gain]));
    return {
      id: card.id,
      displayName: card.displayName,
      country: card.country,
      photoKey: card.photoKey,
      ownerPicture: card.ownerPicture,
      followers: figureOf(card, place),
      gain: gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) : null,
      climbed: stoodAt === undefined ? null : stoodAt - rank,
      fresh: !!before && !before.known.has(card.id),
      sources: channels.map(({ place: source, link, followers }) => ({ place: source, link, followers })),
    };
  };

  const boards = Object.fromEntries(
    places.map((place, index) => [
      place,
      // A row's rank is its position on the board, counted from the first place.
      lists[index].map((card, position) => toRow(place, card, offset + position + 1)),
    ]),
  ) as Partial<Record<LeaderboardPlace, LeaderboardRow[]>>;

  const sizes = Object.fromEntries(
    LEADERBOARD_PLACES.map((place) => [place, Math.min(counts[place], LEADERBOARD_SIZE)]),
  ) as Record<LeaderboardPlace, number>;

  const standings = Object.fromEntries(
    places.flatMap((place) => {
      if (!own || !placesAhead || figureOf(own, place) <= 0) return [];
      const rank = placesAhead[place] + 1;
      return [[place, { rank, outOf: counts[place], row: toRow(place, own, rank) }]];
    }),
  ) as Partial<Record<LeaderboardPlace, LeaderboardStanding>>;

  return { boards, sizes, readAt, standings };
}
