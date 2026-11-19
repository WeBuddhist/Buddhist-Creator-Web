import { Suspense } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { connection } from "next/server";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { SectionHeading, accentButton, ghostButton } from "@/components/convention/section-heading";
import { Leaderboard } from "@/components/creators/leaderboard";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { CARD_PATH } from "@/lib/creator-card";
import { openingBoards } from "@/lib/creator-leaderboard";
import { CREATORS_LEADERBOARD, CREATORS_PATH, DIRECTORY_ID } from "@/lib/creators";
import { formatDate } from "@/lib/format";
import { forLog } from "@/lib/log-error";
import { cn } from "@/lib/utils";

/* The leaderboard as a section of a page: on the home page, right under
   its opening photograph, and at the top of the creators page. The
   heading is static and prerenders; the boards are read from the database
   on each visit and stream in behind the boundary. They are made for the
   person looking: each board's list ends on their own place, which is
   their rank, their card's review, or an invitation to make a card.

   `invite` closes the section with a sheet of brand cyan, for the home
   page: a creator who is not on the board is asked to make a card, the
   one filled button, and beside it is the way on to the whole directory.
   On the creators page the directory, with the same invitation at its
   head, is the next thing down. */
export function LeaderboardSection({
  size = "h2",
  invite = false,
  className,
}: {
  /** The title's size: a page's first section, or one set more quietly. */
  size?: "h2" | "h3";
  invite?: boolean;
  /** The section's vertical padding. */
  className?: string;
}) {
  return (
    <section aria-labelledby="leaderboard-title" className="bg-background">
      <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-6", className)}>
        <SectionHeading
          id="leaderboard-title"
          eyebrow={CREATORS_LEADERBOARD.eyebrow}
          title={CREATORS_LEADERBOARD.title}
          description={CREATORS_LEADERBOARD.description}
          size={size}
        />
        <div className="mt-8 lg:mt-10">
          <Suspense fallback={<LeaderboardFallback />}>
            <Boards />
          </Suspense>
        </div>
        {invite && (
          <div
            data-header-tone="dark"
            className="mt-12 grid gap-8 rounded-3xl bg-brand-cyan px-6 py-10 text-white sm:px-8 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 lg:px-12 lg:py-12"
          >
            <SectionHeading
              id="leaderboard-invite-title"
              level="h3"
              eyebrow={CREATORS_LEADERBOARD.invite.eyebrow}
              title={CREATORS_LEADERBOARD.invite.title}
              description={CREATORS_LEADERBOARD.invite.description}
              onPanel
            />
            {/* One filled button, the gold: making a card. The other is an outline. */}
            {/* The two share their edges: full width on a phone, a column of
                one width beside the words from lg. */}
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start lg:flex-col lg:items-stretch">
              <Button
                size="pill"
                nativeButton={false}
                className={accentButton}
                // Behind a sign-in: nothing to fetch ahead for a visitor.
                render={<Link href={CARD_PATH} prefetch={false} />}
              >
                {CREATORS_LEADERBOARD.invite.create}
                <ArrowRightIcon data-icon="inline-end" weight="bold" />
              </Button>
              <Button
                size="pill"
                variant="outline"
                nativeButton={false}
                className={ghostButton}
                render={<Link href={`${CREATORS_PATH}#${DIRECTORY_ID}`} />}
              >
                {CREATORS_LEADERBOARD.invite.browse}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

async function Boards() {
  // The counts change with every reading: read them at request time.
  // Outside the try, as in components/user-menu.tsx: a render Next
  // abandons must not be caught and logged as a failure below.
  await connection();
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    unstable_rethrow(error);
    // The board is public: without a session it is shown as to a visitor.
    console.error("[leaderboard] could not read the session", forLog(error));
  }
  const { boards, readAt, viewer } = await openingBoards(user);
  if (boards.length === 0) {
    return (
      <p className="rounded-2xl bg-paper-deep px-6 py-8 text-base leading-[1.6] text-muted-foreground">
        {CREATORS_LEADERBOARD.empty}
      </p>
    );
  }
  return (
    <Leaderboard
      boards={boards}
      viewer={viewer}
      updated={readAt && { iso: readAt.toISOString(), text: formatDate(readAt) }}
    />
  );
}

/* Holds about the height the board takes on a desktop, so the page under
   it does not jump far when the board arrives. */
function LeaderboardFallback() {
  return (
    <div className="min-h-[43rem]" aria-busy="true">
      <p className="border-y border-border py-5 text-sm text-muted-foreground">Loading the leaderboard…</p>
    </div>
  );
}
