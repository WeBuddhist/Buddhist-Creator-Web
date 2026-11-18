"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@phosphor-icons/react";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { framedCard, framedCardInner } from "@/components/convention/section-heading";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { CREATORS_LEADERBOARD } from "@/lib/creators";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

export type BoardRow = {
  id: string;
  displayName: string;
  country: string | null;
  photoUrl: string | null;
  followers: number;
  /** Since last month's reading; null when there is nothing to compare. */
  gain: number | null;
  /** The creator's own channel, and the name of the place it is in. */
  link: string | null;
  linkLabel: string | null;
};

export type Board = {
  value: string;
  /** The tab: "All channels", "YouTube". */
  label: string;
  /** What the figures count, said once above the rows. */
  caption: string;
  rows: BoardRow[];
};

/* The leaderboard's boards: one tab for all channels together and one for
   each place a count is kept for, ten creators on each. A row is the
   rank, the creator's picture and name, where they are, and the figure
   they are ranked on; from the second monthly reading on, also how far
   that figure has moved since the one before, as an arrow and a number,
   never as colour alone.

   On a phone the figure sits under the name, so a long name has the
   row's whole width; from sm it stands at the row's right edge. The ten
   rows run down two columns from lg, 1 to 5 beside 6 to 10, so the
   directory under the board stays within reach. Every board is in the
   markup the server sends; switching tabs fetches nothing. */
export function Leaderboard({ boards }: { boards: Board[] }) {
  const moved = boards.some((board) => board.rows.some((row) => row.gain));
  return (
    <Tabs defaultValue={boards[0]?.value}>
      <TabsList aria-label="Leaderboard by channel">
        {boards.map((board) => (
          <TabsTab key={board.value} value={board.value}>
            {board.label}
          </TabsTab>
        ))}
      </TabsList>
      {boards.map((board) => (
        <TabsPanel key={board.value} value={board.value} className="mt-5">
          <div className={framedCard}>
            <div className={cn(framedCardInner, "overflow-hidden")}>
              <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground sm:px-6">{board.caption}</p>
              <ol
                // Safari drops the list's semantics with its markers.
                role="list"
                className={cn(
                  // A column that may be narrower than its longest name.
                  "grid grid-cols-1 lg:grid-flow-col lg:grid-cols-2",
                  // Five rows to a column, however many the board has.
                  "lg:grid-rows-[repeat(5,auto)]",
                )}
              >
                {board.rows.map((row, index) => (
                  <li
                    key={row.id}
                    className={cn(
                      "grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-3 border-border px-4 py-3.5",
                      "sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:gap-x-4 sm:px-6",
                      index > 0 && "border-t",
                      // The second column: a rule on its left, none over its first row.
                      index >= 5 && "lg:border-l",
                      index % 5 === 0 && "lg:border-t-0",
                    )}
                  >
                    <span
                      className={cn(
                        "row-span-2 w-7 text-center font-display text-2xl leading-none tabular-nums sm:row-span-1",
                        index < 3 ? "text-brand-cyan" : "text-muted-foreground",
                      )}
                    >
                      <span className="sr-only">Rank </span>
                      {index + 1}
                    </span>
                    <CardPhoto src={row.photoUrl} size="row" name={row.displayName} className="row-span-2 sm:row-span-1" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 wrap-anywhere text-[0.9375rem] leading-[1.3] font-medium text-foreground">
                        {row.link ? (
                          <a
                            href={row.link}
                            target="_blank"
                            // The address came from the creator or the team's sheet, not from us.
                            rel="noopener noreferrer nofollow"
                            aria-label={`${row.displayName}${row.linkLabel ? ` on ${row.linkLabel}` : ""} (opens in new tab)`}
                            className="rounded-sm underline-offset-4 transition-[color] duration-150 ease-hover hover:text-brand-cyan hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            {row.displayName}
                          </a>
                        ) : (
                          row.displayName
                        )}
                      </p>
                      {row.country && <p className="mt-0.5 truncate text-sm text-muted-foreground">{row.country}</p>}
                    </div>
                    <div className="col-start-3 mt-1 flex items-baseline gap-2 sm:col-start-4 sm:row-start-1 sm:mt-0 sm:block sm:text-right">
                      <p className="text-base leading-[1.3] font-semibold text-foreground tabular-nums">
                        {formatCount(row.followers)}
                      </p>
                      {!!row.gain && <Change gain={row.gain} />}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </TabsPanel>
      ))}
      {moved && <p className="mt-3 text-sm text-muted-foreground">{CREATORS_LEADERBOARD.change}</p>}
    </Tabs>
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
        "flex items-center gap-0.5 text-xs leading-[1.3] font-medium tabular-nums sm:mt-0.5 sm:justify-end",
        up ? "text-status-accepted-text" : "text-muted-foreground",
      )}
    >
      <Arrow aria-hidden weight="bold" className="size-3" />
      <span className="sr-only">{up ? "Up " : "Down "}</span>
      {formatCount(Math.abs(gain))}
    </p>
  );
}
