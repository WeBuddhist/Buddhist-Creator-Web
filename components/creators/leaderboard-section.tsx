import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { SectionHeading } from "@/components/convention/section-heading";
import { Leaderboard } from "@/components/creators/leaderboard";
import { openingBoards } from "@/lib/creator-leaderboard";
import { CREATORS_LEADERBOARD, CREATORS_PATH, DIRECTORY_ID } from "@/lib/creators";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* The leaderboard as a section of a page: on the home page, right under
   its opening photograph, and at the top of the creators page. The
   heading is static and prerenders; the boards are read from the database
   on each visit and stream in behind the boundary.

   `browse` adds the way on to the directory, for the home page; on the
   creators page the directory is the next thing down. */
export function LeaderboardSection({
  size = "h2",
  browse = false,
  className,
}: {
  /** The title's size: a page's first section, or one set more quietly. */
  size?: "h2" | "h3";
  browse?: boolean;
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
        {browse && (
          <p className="mt-8">
            <Link
              href={`${CREATORS_PATH}#${DIRECTORY_ID}`}
              className="group inline-flex items-center gap-1.5 rounded-sm text-base font-medium text-brand-cyan underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {CREATORS_LEADERBOARD.browse}
              <ArrowRightIcon
                aria-hidden
                weight="bold"
                className="size-4 transition-[translate] duration-150 ease-out motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

async function Boards() {
  // The counts change with every reading: read them at request time.
  await connection();
  const { boards, readAt } = await openingBoards();
  if (boards.length === 0) {
    return (
      <p className="rounded-2xl bg-paper-deep px-6 py-8 text-base leading-[1.6] text-muted-foreground">
        {CREATORS_LEADERBOARD.empty}
      </p>
    );
  }
  return <Leaderboard boards={boards} updated={readAt && { iso: readAt.toISOString(), text: formatDate(readAt) }} />;
}

/* Holds about the height the board takes on a desktop, so the page under
   it does not jump far when the board arrives. */
function LeaderboardFallback() {
  return (
    <div className="min-h-[36rem]" aria-busy="true">
      <p className="border-y border-border py-5 text-sm text-muted-foreground">Loading the leaderboard…</p>
    </div>
  );
}
