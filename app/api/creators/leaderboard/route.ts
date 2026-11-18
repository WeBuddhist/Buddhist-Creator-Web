import { NextResponse, type NextRequest } from "next/server";
import { wholeBoard } from "@/lib/creator-leaderboard";
import { LEADERBOARD_PLACES, type LeaderboardPlace } from "@/lib/creators";
import { forLog } from "@/lib/log-error";

/* One whole board of the leaderboard, for the browser to open it in full:
   `?place=youtube`. The page sends only each board's first ten; the rest
   is asked for here when a visitor opens one. Everything in the reply is
   already public on the creators directory. */
export async function GET(request: NextRequest) {
  const asked = request.nextUrl.searchParams.get("place") ?? "all";
  const place = LEADERBOARD_PLACES.find((known) => known === asked) as LeaderboardPlace | undefined;
  if (!place) return NextResponse.json({ error: "UNKNOWN_BOARD" }, { status: 400 });
  try {
    // The photo addresses are signed for this reply; it is not for keeping.
    return NextResponse.json({ rows: await wholeBoard(place) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[leaderboard] could not read a board", forLog(error));
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
