import { ArrowDownIcon, ArrowUpIcon, CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react/dist/ssr";
import { formatCount, plural } from "@/lib/format";
import { cn } from "@/lib/utils";

/* What a month did to a creator, as the leaderboard and the creator's own
   page both show it. Up is green and down is red, and each has its sign
   and its words for a screen reader, so colour is never the only carrier.

   No "use client": the leaderboard draws these in the browser and the
   creator's page on the server. */

/* The places a creator has gained or lost on a board since last month's
   reading: a filled triangle and the number, green for up and red for
   down. "New" for a first appearance, a dash for the same place, and
   nothing when last month has no place to compare with. `words` spells
   the unit out ("2 places"), for where no column head says it. */
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
      <span className="sr-only"> since last month</span>
    </span>
  );
}

/* How far a figure has moved since last month's reading: followers gained
   in green, lost in red. The arrow and the words for a screen reader say
   which, so colour is never the only sign. */
export function Change({ gain }: { gain: number }) {
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
