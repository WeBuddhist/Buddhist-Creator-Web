import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react/dist/ssr";
import { formatCount, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

/* What a week did to a creator, as the leaderboard and the creator's own
   page both show it. Up is green and down is red, and each has its sign
   and its words for a screen reader, so colour is never the only carrier.

   No "use client": the leaderboard draws these in the browser and the
   creator's page on the server. */

/* The places a creator has gained or lost on a board since last week's
   reading: a filled triangle and the number, green for up and red for
   down. "New" for a first appearance, a dash for the same place, and
   nothing when last week has no place to compare with. `words` spells
   the unit out ("2 places"), for a card, where no column head says it;
   there a creator who has held their place is given no mark at all. */
export function RankMove({
  row,
  words = false,
}: {
  row: { climbed: number | null; fresh: boolean };
  words?: boolean;
}) {
  const small = "text-xs leading-[1.3] font-medium tabular-nums";
  if (row.fresh) {
    return (
      <span className="text-[0.6875rem] leading-[1.3] font-semibold tracking-[0.08em] text-brand-cyan uppercase">
        New<span className="sr-only"> on the board this week</span>
      </span>
    );
  }
  if (row.climbed === null) return null;
  if (row.climbed === 0) {
    if (words) return null;
    return (
      <span className={cn(small, "text-muted-foreground")}>
        <span aria-hidden>–</span>
        <span className="sr-only">Same place as last week</span>
      </span>
    );
  }
  const up = row.climbed > 0;
  const places = Math.abs(row.climbed);
  const Triangle = up ? CaretUpIcon : CaretDownIcon;
  const unit = ` ${plural(places, "place", "places")}`;
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
      <span className="sr-only"> since last week</span>
    </span>
  );
}

/** The words that say what a change is measured from. The creator's own
    page names the same figure so (app/(site)/creator-card/card-home.tsx). */
export const SINCE = "since last week";

/* How far a figure has moved since last week's reading: followers gained
   in green, lost in red. The arrow and the words for a screen reader say
   which, so colour is never the only sign.

   A bare number beside a count does not say what it is, so the figure
   carries its words, "since last week", wherever nothing else says them:
   `since="always"` on a card, and `since="narrow"` in a row of the board,
   whose column head says them from md and is not shown below that. The
   words are in the page's quiet ink (`quiet`), not the figure's colour. */
export function Change({
  gain,
  since,
  quiet = "text-muted-foreground",
}: {
  gain: number;
  since?: "always" | "narrow";
  quiet?: string;
}) {
  const up = gain > 0;
  const Arrow = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    // Where the two do not fit on a line (a narrow phone), the words go
    // under the number whole.
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 text-sm leading-[1.3] font-medium tabular-nums",
        up ? "text-status-accepted-text" : "text-status-rejected-text",
      )}
    >
      <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
        <Arrow aria-hidden weight="bold" className="size-3.5" />
        <span className="sr-only">{up ? "Up " : "Down "}</span>
        {formatCount(Math.abs(gain))}
        <span className="sr-only"> followers </span>
      </span>
      <span
        className={cn(
          "font-normal whitespace-nowrap",
          quiet,
          !since && "sr-only",
          since === "narrow" && "md:sr-only",
        )}
      >
        {SINCE}
      </span>
    </p>
  );
}
