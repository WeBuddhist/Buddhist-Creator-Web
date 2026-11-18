"use client";

import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsClockwiseIcon,
  CaretDownIcon,
  CaretUpIcon,
  FacebookLogoIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  YoutubeLogoIcon,
  type Icon,
} from "@phosphor-icons/react";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { framedCard, framedCardInner, label } from "@/components/convention/section-heading";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { COUNTED_SOCIALS, type CountedSocial } from "@/lib/creator-card";
import {
  CREATORS_LEADERBOARD,
  LEADERBOARD_API,
  LEADERBOARD_OPENING,
  type Board,
  type BoardRow,
  type BoardSource,
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
   place a count is kept for. A board opens on its first ten creators and
   can be opened to its first hundred, which are asked for only then.

   The first three stand apart as cards, with the photo, the figure set
   large and each channel's own share of it. The rest are rows: rank,
   photo, name and country, the figure, and the channels it was read
   from. A channel is a link to the creator there, so the board says
   where every number comes from. From the second monthly reading on, a
   figure also carries how far it has moved since the one before, as an
   arrow and a number, never as colour alone.

   Rank order is the order in the markup, on every screen. On a phone a
   row's figure and channels sit under the name, so a long name has the
   row's width; from md a row is one line under column heads, and on the
   board of all channels each channel keeps its own column. */
export function Leaderboard({ boards, updated }: { boards: Board[]; updated: { iso: string; text: string } | null }) {
  const [place, setPlace] = useState<LeaderboardPlace>(boards[0].place);
  // One answer for every board: a visitor who opened one wants them open.
  const [open, setOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  return (
    <Tabs ref={top} value={place} onValueChange={(value) => setPlace(value as LeaderboardPlace)} className="scroll-mt-24">
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
          <BoardPanel
            board={board}
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => {
              setOpen(false);
              // Back to the head of the board, which the long list pushed away.
              top.current?.scrollIntoView({ block: "start" });
            }}
          />
        </TabsPanel>
      ))}
    </Tabs>
  );
}

async function fetchBoard(place: LeaderboardPlace): Promise<BoardRow[]> {
  const response = await fetch(`${LEADERBOARD_API}?place=${place}`);
  if (!response.ok) throw new Error(`leaderboard ${response.status}`);
  return ((await response.json()) as { rows: BoardRow[] }).rows;
}

function BoardPanel({
  board,
  open,
  onOpen,
  onClose,
}: {
  board: Board;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const more = board.size > board.rows.length;
  // Only the visible board is mounted, so only it asks.
  const whole = useQuery({
    queryKey: ["leaderboard", board.place],
    queryFn: () => fetchBoard(board.place),
    enabled: open && more,
    // The counts change once a month.
    staleTime: 10 * 60 * 1000,
  });
  const rows = open && whole.data ? whole.data : board.rows;
  const loading = open && more && whole.isPending;
  const unit = boardUnit(board.place);
  const moved = rows.some((row) => row.gain);
  const first = rows.slice(0, 3);
  const rest = rows.slice(3);
  const listId = `leaderboard-${board.place}`;

  return (
    <>
      {/* The three cards share their rows (who, the figure, the channels),
          so the figures stand on one line however long a name runs. */}
      <ol role="list" className="grid gap-4 lg:grid-cols-3 lg:gap-x-5">
        {first.map((row, index) => (
          <LeadCard key={row.id} row={row} rank={index + 1} unit={unit} board={board.place} />
        ))}
      </ol>

      {rest.length > 0 && (
        <div className={cn(framedCard, "mt-4 lg:mt-5")}>
          <div className={cn(framedCardInner, "overflow-hidden")}>
            {/* The column heads, for the eye: each cell says what it is to
                a screen reader in its own words. */}
            <div
              aria-hidden
              className={cn(
                rowGrid(moved),
                label,
                "hidden border-b border-border py-3 text-[0.6875rem] text-muted-foreground md:grid",
              )}
            >
              <span className="text-center">Rank</span>
              <span className="col-span-2">Creator</span>
              <span className="text-right">{unit}</span>
              {moved && <span className="text-right">Change</span>}
              <span className="pl-[0.4375rem]">Channels</span>
            </div>
            <ol id={listId} role="list" start={4}>
              {rest.map((row, index) => (
                <li key={row.id} className={cn(rowGrid(moved), "border-border py-3.5", index > 0 && "border-t")}>
                  <BoardRowCells row={row} rank={index + 4} unit={unit} moved={moved} slots={board.place === "all"} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {moved && <p className="mt-3 text-sm text-muted-foreground">{CREATORS_LEADERBOARD.change}</p>}

      {more && (
        <div className="mt-6 flex flex-col items-center gap-3">
          {whole.isError && open && (
            <p role="alert" className="max-w-[44ch] text-center text-sm text-pretty text-status-rejected-text">
              {CREATORS_LEADERBOARD.failed}
            </p>
          )}
          <button
            type="button"
            aria-expanded={open && !!whole.data}
            aria-controls={listId}
            aria-busy={loading || undefined}
            disabled={loading}
            onClick={() => {
              if (open && whole.data) onClose();
              else if (open && whole.isError) void whole.refetch();
              else onOpen();
            }}
            className={cn(
              "inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-ink/25 bg-card px-5 text-[0.9375rem] font-medium text-foreground",
              "transition-[background-color,scale] duration-150 ease-out hover:bg-paper-deep motion-safe:enabled:active:scale-[0.96] disabled:cursor-default disabled:text-muted-foreground",
              focusRing,
            )}
          >
            {loading ? (
              "Loading the leaderboard…"
            ) : open && whole.data ? (
              <>
                Show the top {LEADERBOARD_OPENING} only
                <CaretUpIcon aria-hidden weight="bold" className="size-4" />
              </>
            ) : open && whole.isError ? (
              "Try again"
            ) : (
              <>
                {board.size >= 100 ? `Show the top ${board.size}` : `Show all ${board.size}`}
                <CaretDownIcon aria-hidden weight="bold" className="size-4" />
              </>
            )}
          </button>
          {/* Said once the longer list is in, for a visitor who cannot see it grow. */}
          <p role="status" className="sr-only">
            {open && whole.data ? `Showing the top ${whole.data.length}.` : ""}
          </p>
        </div>
      )}
    </>
  );
}

/* A row's columns. On a phone: the rank, the photo, and everything else
   stacked beside them. From md: rank, photo, name, the figure, its change
   when any row has one, and the channels, each column the same width in
   every row so the figures line up. */
const rowGrid = (moved: boolean) =>
  cn(
    "grid grid-cols-[1.75rem_auto_minmax(0,1fr)] items-center gap-x-3 px-4 sm:px-5 md:gap-x-5 md:px-6",
    moved
      ? "md:grid-cols-[2.25rem_3rem_minmax(0,1fr)_7.5rem_5.5rem_8.5rem]"
      : "md:grid-cols-[2.25rem_3rem_minmax(0,1fr)_7.5rem_8.5rem]",
  );

function BoardRowCells({
  row,
  rank,
  unit,
  moved,
  slots,
}: {
  row: BoardRow;
  rank: number;
  unit: string;
  moved: boolean;
  /** Keep a place for every channel, so each has its own column. */
  slots: boolean;
}) {
  return (
    <>
      <span className="row-span-2 text-center font-display text-xl leading-none text-muted-foreground tabular-nums md:row-span-1">
        <span className="sr-only">Rank </span>
        {rank}
      </span>
      <CardPhoto src={row.photoUrl} size="row" name={row.displayName} className="row-span-2 md:row-span-1" />
      <div className="min-w-0">
        <p className="wrap-anywhere text-[0.9375rem] leading-[1.35] font-medium text-foreground">
          <bdi>{row.displayName}</bdi>
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
function LeadCard({ row, rank, unit, board }: { row: BoardRow; rank: number; unit: string; board: LeaderboardPlace }) {
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

/* How far a figure has moved since last month's reading: up in the green
   the site keeps for good news, down in plain muted ink. The arrow and the
   words for a screen reader say which, so colour is never the only sign. */
function Change({ gain }: { gain: number }) {
  const up = gain > 0;
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <p
      className={cn(
        "flex items-center gap-0.5 text-sm leading-[1.3] font-medium tabular-nums",
        up ? "text-status-accepted-text" : "text-muted-foreground",
      )}
    >
      <Arrow aria-hidden weight="bold" className="size-3.5" />
      <span className="sr-only">{up ? "Up " : "Down "}</span>
      {formatCount(Math.abs(gain))}
      <span className="sr-only"> since last month</span>
    </p>
  );
}
