import "server-only";
import { countryCode } from "@/lib/countries";
import { COUNTED_SOCIALS } from "@/lib/creator-card";
import { creatorLeaderboard, getMyCard, getMyClaim, type LeaderboardRow } from "@/lib/creator-cards";
import {
  LEADERBOARD_OPENING,
  LEADERBOARD_PAGE,
  LEADERBOARD_PLACES,
  type Board,
  type BoardRow,
  type BoardViewer,
  type LeaderboardPlace,
} from "@/lib/creators";
import { forLog } from "@/lib/log-error";
import { presignedGetUrl } from "@/lib/s3";

/* The leaderboard as a page or the browser is handed it: the rows the
   database gives (creatorLeaderboard in lib/creator-cards.ts), each with
   an address its photo loads from, and, for the page, where the person
   looking at it stands. */

/** A card's photo: its own, or failing that its owner's sign-in picture.
    A picture that cannot be signed for (storage not set up, say) leaves
    the creator with the stand-in rather than taking the page down. */
export async function cardPhotoUrl(card: { photoKey: string | null; ownerPicture: string | null }) {
  try {
    return await presignedGetUrl(card.photoKey ?? card.ownerPicture);
  } catch (error) {
    console.error("[creators] could not sign a card photo", forLog(error));
    return null;
  }
}

async function boardRow({ photoKey, ownerPicture, ...row }: LeaderboardRow): Promise<BoardRow> {
  return {
    ...row,
    countryCode: countryCode(row.country),
    photoUrl: await cardPhotoUrl({ photoKey, ownerPicture }),
  };
}

const boardRows = (rows: LeaderboardRow[]) => Promise.all(rows.map(boardRow));

/** Every board that has anybody on it, opened on its first creators; when
    the counts were last read; and the visitor's own place (BoardViewer in
    lib/creators.ts). `user` is the signed-in person, or null.

    The visitor's card is read by its owner's id and handed only to the
    page being made for that person, so a card that is still with our
    team, which no board or directory shows, reaches nobody but them. */
export async function openingBoards(
  user: { id: string; picture: string | null } | null,
): Promise<{ boards: Board[]; readAt: Date | null; viewer: BoardViewer }> {
  const card = user ? await getMyCard(user.id) : null;
  const [{ boards, sizes, readAt, standings }, claim] = await Promise.all([
    creatorLeaderboard({
      limit: LEADERBOARD_OPENING,
      standingOf: card?.status === "approved" ? card.id : undefined,
    }),
    // A person with a card has no claim waiting.
    user && !card ? getMyClaim(user.id) : null,
  ]);

  let viewer: BoardViewer = { state: "none", photoUrl: user?.picture ?? null };
  if (card) {
    const who = {
      displayName: card.displayName,
      country: card.country,
      photoUrl: await cardPhotoUrl({ photoKey: card.photoKey, ownerPicture: user?.picture ?? null }),
    };
    viewer =
      card.status === "approved"
        ? {
            state: "approved",
            id: card.id,
            ...who,
            links: COUNTED_SOCIALS.filter(({ value }) => card.socials[value]?.trim()).map(({ value }) => value),
            standings: Object.fromEntries(
              await Promise.all(
                Object.entries(standings).map(
                  async ([place, standing]) => [place, { ...standing, row: await boardRow(standing.row) }] as const,
                ),
              ),
            ),
          }
        : { state: card.status, ...who };
  } else if (claim?.status === "pending") {
    viewer = {
      state: "claim",
      displayName: claim.card.displayName,
      country: claim.card.country,
      // The card is not theirs yet, so it shows its own picture, not theirs.
      photoUrl: await cardPhotoUrl({ photoKey: claim.card.photoKey, ownerPicture: null }),
    };
  }

  return {
    boards: await Promise.all(
      LEADERBOARD_PLACES.filter((place) => sizes[place] > 0).map(async (place) => ({
        place,
        rows: await boardRows(boards[place] ?? []),
        size: sizes[place],
      })),
    ),
    readAt,
    viewer,
  };
}

/** The next stretch of one board: the creators after the first `offset`,
    and where the stretch after it starts, or null at the board's end. */
export async function boardPage(
  place: LeaderboardPlace,
  offset: number,
): Promise<{ rows: BoardRow[]; next: number | null }> {
  const { boards, sizes } = await creatorLeaderboard({ places: [place], offset, limit: LEADERBOARD_PAGE });
  const rows = await boardRows(boards[place] ?? []);
  const end = offset + rows.length;
  return { rows, next: rows.length > 0 && end < sizes[place] ? end : null };
}
