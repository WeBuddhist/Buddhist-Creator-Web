import { NextResponse, type NextRequest } from "next/server";
import { boardPage } from "@/lib/creator-leaderboard";
import { LEADERBOARD_PLACES, type LeaderboardPlace } from "@/lib/creators";
import { forLog } from "@/lib/log-error";

/* The next stretch of one board of the leaderboard, for the browser to
   bring in as its list is scrolled: `?place=youtube&offset=10`. The page
   sends each board's first ten; the rest, down to the board's last
   creator, is asked for here, a stretch at a time, and the reply says
   where the stretch after it starts. Everything in it is already public
   on the creators directory. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const asked = params.get("place") ?? "all";
  const place = LEADERBOARD_PLACES.find((known) => known === asked) as LeaderboardPlace | undefined;
  if (!place) return NextResponse.json({ error: "UNKNOWN_BOARD" }, { status: 400 });
  const offset = Number(params.get("offset") ?? 0);
  // Past a board's end the reply is an empty stretch, which is its end.
  if (!Number.isSafeInteger(offset) || offset < 0) {
    return NextResponse.json({ error: "BAD_OFFSET" }, { status: 400 });
  }
  try {
    // The photo addresses are signed for this reply; it is not for keeping.
    return NextResponse.json(await boardPage(place, offset), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[leaderboard] could not read a board", forLog(error));
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
