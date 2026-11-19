"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowsClockwiseIcon,
  CaretDownIcon,
  CaretUpIcon,
  ClockIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  WarningCircleIcon,
  YoutubeLogoIcon,
  type Icon,
} from "@phosphor-icons/react";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { framedCard, framedCardInner, label } from "@/components/convention/section-heading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { CARD_PATH, COUNTED_SOCIALS, type CountedSocial } from "@/lib/creator-card";
import {
  CREATORS_LEADERBOARD,
  LEADERBOARD_API,
  type Board,
  type BoardRow,
  type BoardSource,
  type BoardViewer,
  type LeaderboardPlace,
} from "@/lib/creators";
import { formatCompact, formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLACE_ICON: Record<CountedSocial, Icon> = {
  youtube: YoutubeLogoIcon,
  instagram: InstagramLogoIcon,
  tiktok: TiktokLogoIcon,
  facebook: FacebookLogoIcon,
};

const placeOf = (place: CountedSocial) => COUNTED_SOCIALS.find(({ value }) => value === place)!;

/** A board's name on its tab. */
const boardLabel = (place: LeaderboardPlace) => (place === "all" ? CREATORS_LEADERBOARD.all : placeOf(place).label);

/** What a board's figures count: "followers", or "subscribers" on YouTube. */
const boardUnit = (place: LeaderboardPlace) => (place === "all" ? "followers" : placeOf(place).audience.toLowerCase());

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/* The leaderboard: one tab for all channels together and one for each
   place a count is kept for. A board opens on its first ten creators;
   the list under the first three is a window of a fixed height, and the
   rest of the board, up to its first hundred, is brought in a stretch at
   a time as the window is scrolled.

   The first three stand apart as cards, with the photo, the figure set
   large and each channel's own share of it. The rest are rows: rank,
   photo, name and country, the figure, and the channels it was read
   from. A channel is a link to the creator there, so the board says
   where every number comes from. From the second monthly reading on, a
   creator also carries what the month did: beside the rank, the places
   gained or lost on the board (a triangle, or "New" for a first
   appearance), and beside the figure, the followers gained or lost (an
   arrow). Up is green and down is red, and each has its sign and its
   words for a screen reader, so colour is never the only carrier.

   Rank order is the order in the markup, on every screen. On a phone a
   row's figure and channels sit under the name, so a long name has the
   row's width; from md a row is one line under column heads, and on the
   board of all channels each channel keeps its own column.

   The visitor's own place (YourPlace) is held at the foot of that window,
   under the rows that scroll, so it is in view wherever they are on the
   board; and where their card is among the creators shown it is marked
   as theirs. */
export function Leaderboard({
  boards,
  viewer,
  updated,
}: {
  boards: Board[];
  viewer: BoardViewer;
  updated: { iso: string; text: string } | null;
}) {
  const [place, setPlace] = useState<LeaderboardPlace>(boards[0].place);

  return (
    <Tabs value={place} onValueChange={(value) => setPlace(value as LeaderboardPlace)}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <TabsList aria-label="Leaderboard by channel">
          {boards.map((board) => {
            const PlaceIcon = board.place === "all" ? null : PLACE_ICON[board.place];
            return (
              <TabsTab key={board.place} value={board.place} className="gap-1.5 px-3 sm:px-4">
                {PlaceIcon && <PlaceIcon aria-hidden className="size-[1.125rem]" />}
                {boardLabel(board.place)}
              </TabsTab>
            );
          })}
        </TabsList>
        {updated && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowsClockwiseIcon aria-hidden weight="bold" className="size-4 shrink-0 text-brand-cyan" />
            <span>
              {CREATORS_LEADERBOARD.updated}{" "}
              <time dateTime={updated.iso} className="font-medium text-foreground">
                {updated.text}
              </time>
            </span>
          </p>
        )}
      </div>
      {boards.map((board) => (
        <TabsPanel key={board.place} value={board.place} className="mt-6">
          <BoardPanel board={board} viewer={viewer} />
        </TabsPanel>
      ))}
    </Tabs>
  );
}

/** A stretch of a board, as the API gives it: its rows, and where the
    stretch after it starts, or null at the board's end. */
type BoardStretch = { rows: BoardRow[]; next: number | null };

async function fetchStretch(place: LeaderboardPlace, offset: number): Promise<BoardStretch> {
  const response = await fetch(`${LEADERBOARD_API}?place=${place}&offset=${offset}`);
  if (!response.ok) throw new Error(`leaderboard ${response.status}`);
  return (await response.json()) as BoardStretch;
}

/** How near the end of the rows a scroll has to come, in pixels, for the
    next stretch to be asked for: about eight rows, so it is usually in
    before the end is reached. */
const LOAD_AHEAD = 600;

const endButton = cn(
  "inline-flex h-9 cursor-pointer items-center rounded-full border border-ink/25 bg-card px-4 text-sm font-medium text-foreground",
  "transition-[background-color,scale] duration-150 ease-out hover:bg-paper-deep motion-safe:active:scale-[0.96]",
  focusRing,
);

function BoardPanel({ board, viewer }: { board: Board; viewer: BoardViewer }) {
  /* The board past what the page was sent. Nothing is asked for until the
     list is scrolled (or its last button pressed), so the query never
     runs by itself. Only the visible board is mounted, so only it asks;
     a board gone back to still has what it had brought in. */
  const further = useInfiniteQuery({
    queryKey: ["leaderboard", board.place, board.rows.length],
    queryFn: ({ pageParam }) => fetchStretch(board.place, pageParam),
    initialPageParam: board.rows.length,
    getNextPageParam: (last) => last.next,
    enabled: false,
    // One more try, then the visitor is told and can ask again.
    retry: 1,
    // The counts change once a month.
    staleTime: 10 * 60 * 1000,
  });
  // A creator who moved between two stretches being read is listed once.
  const rows = [...board.rows];
  const listed = new Set(rows.map((row) => row.id));
  for (const stretch of further.data?.pages ?? []) {
    for (const row of stretch.rows) {
      if (!listed.has(row.id)) rows.push(row);
      listed.add(row.id);
    }
  }
  const hasMore = further.data ? further.hasNextPage : board.size > board.rows.length;
  const loadMore = () => {
    if (hasMore && !further.isFetching) void further.fetchNextPage();
  };

  const unit = boardUnit(board.place);
  const moved = rows.some((row) => row.gain);
  // Anything at all to say about last month, which the line under the board explains.
  const compared = moved || rows.some((row) => row.climbed !== null || row.fresh);
  const first = rows.slice(0, 3);
  const rest = rows.slice(3);
  // The visitor's own card, to mark where it is among the creators shown.
  const mine = viewer.state === "approved" ? viewer.id : null;

  return (
    <>
      {/* The three cards share their rows (who, the figure, the channels),
          so the figures stand on one line however long a name runs. */}
      <ol role="list" className="grid gap-4 lg:grid-cols-3 lg:gap-x-5">
        {first.map((row, index) => (
          <LeadCard key={row.id} row={row} rank={index + 1} unit={unit} board={board.place} own={row.id === mine} />
        ))}
      </ol>

      <div className={cn(framedCard, "mt-4 lg:mt-5")}>
        <div className={cn(framedCardInner, "overflow-hidden")}>
          {rest.length > 0 && (
            /* The window the rows scroll in. Its height is not a whole
               number of rows, so the last one in view is cut and says
               there is more; on a short screen it takes about half the
               height, which leaves the page something to be scrolled by.
               It can be focused, so the arrow keys scroll it. */
            <div
              role="group"
              aria-label="Creators from rank 4"
              tabIndex={0}
              onScroll={(event) => {
                const list = event.currentTarget;
                // After a failure the next try is the visitor's to ask for.
                if (further.isError) return;
                if (list.scrollHeight - list.scrollTop - list.clientHeight < LOAD_AHEAD) loadMore();
              }}
              className="max-h-[min(31rem,55svh)] scroll-pt-12 overflow-y-auto [scrollbar-width:thin] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              {/* The column heads, for the eye: each cell says what it is to
                  a screen reader in its own words. They stay at the head of
                  the window, and inside it, so they are as wide as the rows
                  whatever the scrollbar takes. */}
              <div
                aria-hidden
                className={cn(
                  rowGrid(moved),
                  label,
                  "sticky top-0 z-10 hidden border-b border-border bg-card py-3 text-[0.6875rem] text-muted-foreground md:grid",
                )}
              >
                <span className="text-center">Rank</span>
                <span className="col-span-2">Creator</span>
                <span className="text-right">{unit}</span>
                {moved && <span className="text-right">Change</span>}
                <span className="pl-[0.4375rem]">Channels</span>
              </div>
              <ol role="list" start={4}>
                {rest.map((row, index) => (
                  <li
                    key={row.id}
                    className={cn(
                      rowGrid(moved),
                      "border-border py-3.5",
                      index > 0 && "border-t",
                      // The visitor's own row: the tint of their place below,
                      // and a bar of brand cyan down its leading edge.
                      row.id === mine && "bg-brand-cyan/[0.07] shadow-[inset_3px_0_0_var(--color-brand-cyan)]",
                    )}
                  >
                    <BoardRowCells
                      row={row}
                      rank={index + 4}
                      unit={unit}
                      moved={moved}
                      slots={board.place === "all"}
                      own={row.id === mine}
                    />
                  </li>
                ))}
              </ol>
              {/* The end of the rows while the board has more. Scrolling
                  brings the next stretch in before this is reached; the
                  button is the same thing for anyone who does not scroll. */}
              {hasMore && (
                <div className="flex min-h-14 flex-col items-center justify-center gap-2 border-t border-border px-4 py-2.5 text-center">
                  {further.isError ? (
                    <>
                      <p role="alert" className="max-w-[44ch] text-sm text-pretty text-status-rejected-text">
                        {CREATORS_LEADERBOARD.failed}
                      </p>
                      <button type="button" onClick={loadMore} className={endButton}>
                        {CREATORS_LEADERBOARD.retry}
                      </button>
                    </>
                  ) : further.isFetching ? (
                    <p className="text-sm text-muted-foreground">{CREATORS_LEADERBOARD.loading}</p>
                  ) : (
                    <button type="button" onClick={loadMore} className={endButton}>
                      {CREATORS_LEADERBOARD.more}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <YourPlace
            viewer={viewer}
            place={board.place}
            unit={unit}
            moved={moved}
            slots={board.place === "all"}
            joined={rest.length > 0}
          />
        </div>
      </div>
      {/* Said as the list grows, for a visitor who cannot see it grow. */}
      <p role="status" className="sr-only">
        {further.data ? `Showing the top ${rows.length}.` : ""}
      </p>

      {compared && (
        <p className="mt-3 max-w-[75ch] text-sm text-pretty text-muted-foreground">{CREATORS_LEADERBOARD.change}</p>
      )}
    </>
  );
}

/* A row's columns. On a phone: the rank, the photo, and everything else
   stacked beside them. From md: rank, photo, name, the figure, its change
   when any row has one, and the channels, each column the same width in
   every row so the figures line up. The visitor's own place (`own`) is a
   row in the same columns; on a phone its first is a little wider, for
   the words under the rank. */
const rowGrid = (moved: boolean, own = false) =>
  cn(
    "grid items-center gap-x-3 px-4 sm:px-5 md:gap-x-5 md:px-6",
    own ? "grid-cols-[3rem_auto_minmax(0,1fr)]" : "grid-cols-[2.25rem_auto_minmax(0,1fr)]",
    moved
      ? "md:grid-cols-[3rem_3rem_minmax(0,1fr)_7.5rem_5.5rem_8.5rem]"
      : "md:grid-cols-[3rem_3rem_minmax(0,1fr)_7.5rem_8.5rem]",
  );

function BoardRowCells({
  row,
  rank,
  unit,
  moved,
  slots,
  own,
}: {
  row: BoardRow;
  rank: number;
  unit: string;
  moved: boolean;
  /** Keep a place for every channel, so each has its own column. */
  slots: boolean;
  /** The visitor's own card. */
  own: boolean;
}) {
  return (
    <>
      <div className="row-span-2 flex flex-col items-center gap-1 md:row-span-1">
        <span className="font-display text-xl leading-none text-muted-foreground tabular-nums">
          <span className="sr-only">Rank </span>
          {rank}
        </span>
        <RankMove row={row} />
      </div>
      <CardPhoto src={row.photoUrl} size="row" name={row.displayName} className="row-span-2 md:row-span-1" />
      <div className="min-w-0">
        <p className="wrap-anywhere text-[0.9375rem] leading-[1.35] font-medium text-foreground">
          <bdi>{row.displayName}</bdi>
          {own && <YouTag />}
        </p>
        {row.country && <p className="mt-0.5 text-sm leading-[1.4] text-muted-foreground">{row.country}</p>}
      </div>
      {/* On a phone one line under the name; from md its parts are the
          row's own columns. */}
      <div className="col-start-3 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 md:contents">
        <p className="text-base leading-[1.3] font-semibold text-foreground tabular-nums md:text-right">
          {formatCount(row.followers)}
          <span className="sr-only"> {unit}</span>
        </p>
        {moved && (
          <div className="empty:hidden md:flex md:justify-end md:empty:block">{!!row.gain && <Change gain={row.gain} />}</div>
        )}
        {/* On a phone the channels of the board of all channels take a
            line of their own, pulled left by the icon's inset so the
            first glyph starts on the text's edge. A single channel's
            icon stays beside its figure. */}
        <Channels row={row} slots={slots} className={cn(slots && "-ml-[0.4375rem] basis-full md:ml-0 md:basis-auto")} />
      </div>
    </>
  );
}

/* What each of the first three places wears: gold, silver, bronze (the
   rank tokens in app/globals.css). The medal is the place's number on its
   metal; the card's frame is ringed and filled with it, and the top of
   the card carries a wash of it that fades out under the name. */
const PLACE_STYLE = [
  {
    metal: "gold",
    medal: "bg-rank-first",
    frame: "bg-rank-first/30 shadow-[0_0_0_1.5px_var(--color-rank-first)]",
    wash: "from-rank-first/22",
  },
  {
    metal: "silver",
    medal: "bg-rank-second",
    frame: "bg-rank-second/30 shadow-[0_0_0_1.5px_var(--color-rank-second)]",
    wash: "from-rank-second/22",
  },
  {
    metal: "bronze",
    medal: "bg-rank-third",
    frame: "bg-rank-third/30 shadow-[0_0_0_1.5px_var(--color-rank-third)]",
    wash: "from-rank-third/22",
  },
] as const;

/* One of the first three: a card in its place's metal, with the place's
   number on a medal at the photo's corner. The number says the place; the
   metal only dresses it. */
function LeadCard({
  row,
  rank,
  unit,
  board,
  own,
}: {
  row: BoardRow;
  rank: number;
  unit: string;
  board: LeaderboardPlace;
  /** The visitor's own card. */
  own: boolean;
}) {
  const place = PLACE_STYLE[rank - 1];
  return (
    <li className={cn(framedCard, "row-span-3 grid min-w-0 grid-rows-subgrid gap-y-0", place.frame)}>
      <div
        className={cn(
          framedCardInner,
          "row-span-3 grid grid-rows-subgrid gap-y-0 bg-linear-to-b to-card to-45% p-5 sm:p-6",
          place.wash,
        )}
      >
        <div className="flex items-center gap-4 lg:flex-col lg:items-start">
          <div className="relative shrink-0">
            <CardPhoto src={row.photoUrl} size="field" name={row.displayName} className="lg:size-26" />
            <span
              className={cn(
                "absolute -top-2 -left-2 flex size-11 items-center justify-center rounded-full font-display text-2xl leading-none text-ink tabular-nums",
                // A rim of the card's white sets the medal off the photo;
                // the inner line is the metal's own highlight.
                "shadow-[0_0_0_3px_var(--card),inset_0_1px_0_rgb(255_255_255/0.55)]",
                place.medal,
              )}
            >
              <span className="sr-only">Rank </span>
              {rank}
              <span className="sr-only">, {place.metal}</span>
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-balance wrap-anywhere font-display text-[1.375rem] leading-[1.2] text-foreground">
              <bdi>{row.displayName}</bdi>
              {own && <YouTag />}
            </p>
            {row.country && <p className="mt-1 text-sm leading-[1.4] text-muted-foreground">{row.country}</p>}
          </div>
        </div>
        <div className="mt-5">
          <p className="font-display text-[2.25rem] leading-none text-foreground tabular-nums">
            {formatCount(row.followers)}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm text-muted-foreground">{unit}</p>
            {!!row.gain && <Change gain={row.gain} />}
            <RankMove row={row} words />
          </div>
        </div>
        <div className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {row.sources.map((source) => {
              const PlaceIcon = PLACE_ICON[source.place];
              return (
                <li key={source.place}>
                  <a
                    href={source.link}
                    target="_blank"
                    // The address came from the creator or the team's sheet, not from us.
                    rel="noopener noreferrer nofollow"
                    aria-label={sourceName(row, source)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground tabular-nums",
                      "transition-[border-color,color] duration-150 ease-hover hover:border-brand-cyan hover:text-brand-cyan",
                      focusRing,
                    )}
                  >
                    <PlaceIcon aria-hidden className="size-[1.125rem]" />
                    {/* Each channel's share on the board of all channels;
                        on a channel's own board the figure is above. */}
                    {board === "all" ? formatCompact(source.followers) : placeOf(source.place).label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
}

/* The mark on the visitor's own card, after its name, wherever the card
   is among the creators shown. White on brand cyan is 6.2:1. */
function YouTag() {
  return (
    <span className="ms-2 inline-block rounded-full bg-brand-cyan px-1.5 py-0.5 align-middle font-sans text-[0.6875rem] leading-[1.3] font-semibold tracking-[0.08em] whitespace-nowrap text-white uppercase">
      {CREATORS_LEADERBOARD.yours.you}
    </span>
  );
}

/* The visitor's own place, because a creator comes to the leaderboard to
   see where they stand. It is the last thing in the list's box, under the
   window the rows scroll in, so it stays where it is while they move. It
   is a row in the rows' own columns, set apart by a rule and a tint of
   brand cyan and by its label.

   What it holds follows the visitor (BoardViewer):
   - nobody signed in, or no card yet: the invitation to make one;
   - a card with our team, or one sent back: where the review stands,
     with its mark where a rank would be;
   - a claim waiting on a card the team made: the same, for the claim;
   - an approved card: its rank on this board among every creator on it,
     however far down, with the figure and the channels as a row has
     them; or, when the card has no figure here, what is wanting.

   `joined` is whether rows stand above it; a board of three or fewer has
   none, and the place is then all the box holds. */
function YourPlace({
  viewer,
  place,
  unit,
  moved,
  slots,
  joined,
}: {
  viewer: BoardViewer;
  place: LeaderboardPlace;
  unit: string;
  moved: boolean;
  slots: boolean;
  joined: boolean;
}) {
  const copy = CREATORS_LEADERBOARD.yours;
  const titleId = `your-place-${place}`;
  const title = (
    <h3 id={titleId} className={cn(label, "text-[0.6875rem] text-brand-cyan")}>
      {copy.label}
    </h3>
  );
  const grid = cn(rowGrid(moved, true), "py-3.5");

  let body: ReactNode;
  if (viewer.state === "none") {
    body = (
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-5">
          {/* From sm: on a phone the words have the width. */}
          <CardPhoto src={viewer.photoUrl} size="row" className="max-sm:hidden" />
          <div className="min-w-0">
            {title}
            <p className="mt-1 font-display text-xl leading-[1.2] text-foreground">{copy.none.title}</p>
            <p className="mt-0.5 text-pretty text-sm leading-[1.45] text-muted-foreground">{copy.none.description}</p>
          </div>
        </div>
        <Button
          size="pill"
          nativeButton={false}
          className="h-11 sm:shrink-0"
          // Behind a sign-in: nothing to fetch ahead for a visitor.
          render={<Link href={CARD_PATH} prefetch={false} />}
        >
          {copy.none.action}
          <ArrowRightIcon data-icon="inline-end" weight="bold" />
        </Button>
      </div>
    );
  } else {
    const standing = viewer.state === "approved" ? viewer.standings[place] : undefined;
    const action = (
      <Link
        href={CARD_PATH}
        prefetch={false}
        className={cn(
          "inline-flex min-h-6 items-center gap-1 rounded-sm text-sm font-medium whitespace-nowrap text-brand-cyan",
          "underline decoration-brand-cyan/35 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-brand-cyan",
          focusRing,
        )}
      >
        {copy[viewer.state].action}
        <ArrowRightIcon aria-hidden weight="bold" className="size-3.5" />
      </Link>
    );
    if (standing) {
      const { rank, outOf, row } = standing;
      body = (
        <div className={grid}>
          <div className="row-span-2 flex flex-col items-center gap-1 md:row-span-1">
            <p className="font-display text-2xl leading-none text-brand-cyan tabular-nums">
              <span className="sr-only">Rank </span>
              {formatCount(rank)}
            </p>
            <p className="text-xs leading-[1.3] whitespace-nowrap text-muted-foreground tabular-nums">
              {copy.outOf(formatCount(outOf))}
              <span className="sr-only"> creators</span>
            </p>
            <RankMove row={row} />
          </div>
          <CardPhoto src={row.photoUrl} size="row" name={row.displayName} className="row-span-2 md:row-span-1" />
          <div className="min-w-0">
            {title}
            <p className="mt-1 wrap-anywhere text-[0.9375rem] leading-[1.35] font-medium text-foreground">
              <bdi>{row.displayName}</bdi>
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3">
              {row.country && <p className="text-sm leading-[1.4] text-muted-foreground">{row.country}</p>}
              {action}
            </div>
          </div>
          <div className="col-start-3 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 md:contents">
            <p className="text-base leading-[1.3] font-semibold text-foreground tabular-nums md:text-right">
              {formatCount(row.followers)}
              <span className="sr-only"> {unit}</span>
            </p>
            {moved && (
              <div className="empty:hidden md:flex md:justify-end md:empty:block">
                {!!row.gain && <Change gain={row.gain} />}
              </div>
            )}
            {/* The creator's own channels: from md only, to keep the place
                short on a phone, where it is always on the screen. */}
            <Channels row={row} slots={slots} className="hidden md:flex" />
          </div>
        </div>
      );
    } else {
      const tone = {
        pending: { text: "text-status-submitted-text", Mark: ClockIcon },
        claim: { text: "text-status-submitted-text", Mark: ClockIcon },
        rejected: { text: "text-status-rejected-text", Mark: WarningCircleIcon },
        approved: { text: "text-muted-foreground", Mark: ClockIcon },
      }[viewer.state];
      const line = viewer.state === "approved" ? unrankedLine(viewer, place) : copy[viewer.state].description;
      const said = "text-pretty text-sm leading-[1.45] text-muted-foreground";
      body = (
        <div className={grid}>
          {/* Where a rank would be: the mark of how the card stands instead,
              which the words beside the name say. */}
          <div className="flex justify-center">
            <tone.Mark aria-hidden weight="bold" className={cn("size-6", tone.text)} />
          </div>
          <CardPhoto src={viewer.photoUrl} size="row" name={viewer.displayName} />
          <div className="min-w-0">
            {title}
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <p className="wrap-anywhere text-[0.9375rem] leading-[1.35] font-medium text-foreground">
                <bdi>{viewer.displayName}</bdi>
              </p>
              <p
                className={cn(
                  "inline-flex h-6 items-center rounded-full border border-transparent bg-card px-2.5 text-xs font-semibold whitespace-nowrap shadow-border",
                  tone.text,
                )}
              >
                {copy[viewer.state].status}
              </p>
            </div>
            {/* From md the line is under the name; on a phone it is below,
                with the row's whole width. Only one of the two is shown. */}
            <p className={cn(said, "mt-1 hidden max-w-[64ch] md:block")}>{line}</p>
          </div>
          <div className="col-span-3 mt-2.5 flex flex-col items-start gap-1.5 md:col-[4/-1] md:mt-0 md:justify-self-end">
            <p className={cn(said, "md:hidden")}>{line}</p>
            {action}
          </div>
        </div>
      );
    }
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cn("bg-brand-cyan/10", joined && "border-t-2 border-brand-cyan")}
    >
      {body}
    </section>
  );
}

/** Why an approved card has no rank on a board: the board's place has no
    link on the card, or the link's followers have not been read yet. */
function unrankedLine(viewer: Extract<BoardViewer, { state: "approved" }>, place: LeaderboardPlace) {
  const copy = CREATORS_LEADERBOARD.yours.approved;
  if (place === "all") return viewer.links.length > 0 ? copy.uncounted : copy.unlinked;
  const site = placeOf(place).label;
  return viewer.links.includes(place) ? copy.uncountedOn(site) : copy.unlinkedOn(site);
}

/** A channel's link, said whole: who, where, and what was read there. */
const sourceName = (row: BoardRow, source: BoardSource) => {
  const { label: site, audience } = placeOf(source.place);
  return `${row.displayName} on ${site}, ${formatCount(source.followers)} ${audience.toLowerCase()} (opens in new tab)`;
};

/* The channels a row's figure was read from, each a link to the creator
   there. An icon is 18px in a 32px target. */
function Channels({ row, slots, className }: { row: BoardRow; slots: boolean; className?: string }) {
  // From md, on the board of all channels, a channel the creator is not
  // counted in leaves its place empty, so each channel is one column.
  const places = slots ? COUNTED_SOCIALS.map(({ value }) => value) : row.sources.map(({ place }) => place);
  return (
    <ul className={cn("flex gap-0.5", className)}>
      {places.map((place) => {
        const source = row.sources.find((entry) => entry.place === place);
        if (!source) return <li key={place} aria-hidden className="hidden size-8 md:block" />;
        const PlaceIcon = PLACE_ICON[source.place];
        const { label: site, audience } = placeOf(source.place);
        return (
          <li key={source.place}>
            <a
              href={source.link}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={sourceName(row, source)}
              title={`${site}: ${formatCount(source.followers)} ${audience.toLowerCase()}`}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-full text-muted-foreground",
                "transition-[background-color,color] duration-150 ease-hover hover:bg-paper-deep hover:text-brand-cyan",
                focusRing,
              )}
            >
              <PlaceIcon aria-hidden className="size-[1.125rem]" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

/* The places a creator has gained or lost on the board since last month's
   reading: a filled triangle and the number, green for up and red for
   down. "New" for a first appearance, a dash for the same place, and
   nothing when last month has no place to compare with. `words` spells
   the unit out ("2 places"), for where no column head says it. */
function RankMove({ row, words = false }: { row: BoardRow; words?: boolean }) {
  const small = "text-xs leading-[1.3] font-medium tabular-nums";
  if (row.fresh) {
    return (
      <span className="text-[0.6875rem] leading-[1.3] font-semibold tracking-[0.08em] text-brand-cyan uppercase">
        New<span className="sr-only"> on the board this month</span>
      </span>
    );
  }
  if (row.climbed === null) return null;
  if (row.climbed === 0) {
    return (
      <span className={cn(small, "text-muted-foreground")}>
        {words ? (
          "Same place"
        ) : (
          <>
            <span aria-hidden>–</span>
            <span className="sr-only">Same place as last month</span>
          </>
        )}
      </span>
    );
  }
  const up = row.climbed > 0;
  const places = Math.abs(row.climbed);
  const Triangle = up ? CaretUpIcon : CaretDownIcon;
  const unit = places === 1 ? " place" : " places";
  return (
    <span
      className={cn(
        small,
        "inline-flex items-center gap-0.5",
        up ? "text-status-accepted-text" : "text-status-rejected-text",
      )}
    >
      <Triangle aria-hidden weight="fill" className="size-3" />
      <span className="sr-only">{up ? "Up " : "Down "}</span>
      {places}
      {words ? unit : <span className="sr-only">{unit}</span>}
      <span className="sr-only"> since last month</span>
    </span>
  );
}

/* How far a figure has moved since last month's reading: followers gained
   in green, lost in red. The arrow and the words for a screen reader say
   which, so colour is never the only sign. */
function Change({ gain }: { gain: number }) {
  const up = gain > 0;
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <p
      className={cn(
        "flex items-center gap-0.5 text-sm leading-[1.3] font-medium tabular-nums",
        up ? "text-status-accepted-text" : "text-status-rejected-text",
      )}
    >
      <Arrow aria-hidden weight="bold" className="size-3.5" />
      <span className="sr-only">{up ? "Up " : "Down "}</span>
      {formatCount(Math.abs(gain))}
      <span className="sr-only"> followers since last month</span>
    </p>
  );
}
