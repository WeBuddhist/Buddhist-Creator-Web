import "server-only";
import { creatorLeaderboard, type LeaderboardRow } from "@/lib/creator-cards";
import { LEADERBOARD_OPENING, LEADERBOARD_PLACES, type Board, type BoardRow, type LeaderboardPlace } from "@/lib/creators";
import { forLog } from "@/lib/log-error";
import { presignedGetUrl } from "@/lib/s3";

/* The leaderboard as a page or the browser is handed it: the rows the
   database gives (creatorLeaderboard in lib/creator-cards.ts), each with
   an address its photo loads from. */

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

function boardRows(rows: LeaderboardRow[]): Promise<BoardRow[]> {
  return Promise.all(
    rows.map(async ({ photoKey, ownerPicture, ...row }) => ({
      ...row,
      photoUrl: await cardPhotoUrl({ photoKey, ownerPicture }),
    })),
  );
}

/** Every board that has anybody on it, opened on its first creators, and
    when the counts were last read. */
export async function openingBoards(): Promise<{ boards: Board[]; readAt: Date | null }> {
  const { boards, sizes, readAt } = await creatorLeaderboard({ limit: LEADERBOARD_OPENING });
  return {
    boards: await Promise.all(
      LEADERBOARD_PLACES.filter((place) => sizes[place] > 0).map(async (place) => ({
        place,
        rows: await boardRows(boards[place] ?? []),
        size: sizes[place],
      })),
    ),
    readAt,
  };
}

/** One whole board. */
export async function wholeBoard(place: LeaderboardPlace): Promise<BoardRow[]> {
  const { boards } = await creatorLeaderboard({ places: [place] });
  return boardRows(boards[place] ?? []);
}
