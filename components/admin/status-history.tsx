import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import { STATUS_LABEL } from "@/components/admin/status-badge";
import type { ApplicationStatus } from "@/lib/db/schema";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type StatusEvent = {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  note: string | null;
  createdAt: Date;
  actor: { id: string; name: string | null; email: string } | null;
};

/* How many changes show before the rest fold away. The card sits in a
   sticky sidebar, so a long history would otherwise push past the fold. */
const RECENT = 5;

/* The dot takes the same hue the status badge uses, so the rail reads as
   the badge's own history. Draft and withdrawn are not decisions, so they
   get a hollow neutral dot. The label still carries the meaning. */
const dot: Record<ApplicationStatus, string> = {
  draft: "border-2 border-muted-foreground/40 bg-card",
  withdrawn: "border-2 border-muted-foreground/40 bg-card",
  submitted: "bg-status-submitted-solid",
  accepted: "bg-status-accepted-solid",
  rejected: "bg-status-rejected-solid",
  waitlisted: "bg-status-waitlisted-solid",
};

export function StatusHistory({ events, viewerId }: { events: StatusEvent[]; viewerId: string }) {
  if (events.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">No changes yet.</p>;
  }

  // Newest first: the latest change is what a reviewer opens the card for.
  const newestFirst = [...events].reverse();
  const recent = newestFirst.slice(0, RECENT);
  const earlier = newestFirst.slice(RECENT);

  return (
    <div className="mt-4">
      <Rail events={recent} viewerId={viewerId} continues={earlier.length > 0} />
      {earlier.length > 0 && (
        <details className="group mt-4">
          <summary
            className={cn(
              "relative flex cursor-pointer list-none items-center gap-1.5 ps-6 text-sm font-medium text-brand-cyan",
              "underline decoration-brand-cyan/30 underline-offset-4 hover:decoration-brand-cyan",
              "[&::-webkit-details-marker]:hidden",
              // A hollow node on the rail, so the control reads as part of the timeline.
              "before:absolute before:start-0 before:top-[5px] before:size-2.5 before:rounded-full before:border-2 before:border-muted-foreground/40 before:bg-card",
              // The rail continues below the node once the earlier changes are open.
              "after:absolute after:start-[4.5px] after:top-[15px] after:-bottom-4 after:hidden after:w-px after:bg-border group-open:after:block",
            )}
          >
            <span className="group-open:hidden">Show {earlier.length} earlier {earlier.length === 1 ? "change" : "changes"}</span>
            <span className="hidden group-open:inline">Hide earlier changes</span>
            <CaretDownIcon
              aria-hidden
              weight="bold"
              className="size-3.5 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out group-open:rotate-180"
            />
          </summary>
          <div className="mt-4">
            <Rail events={earlier} viewerId={viewerId} continues={false} />
          </div>
        </details>
      )}
    </div>
  );
}

function Rail({ events, viewerId, continues }: { events: StatusEvent[]; viewerId: string; continues: boolean }) {
  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, index) => {
        const day = formatDate(event.createdAt);
        const previousDay = index > 0 ? formatDate(events[index - 1].createdAt) : null;
        const newDay = day !== previousDay;
        const last = index === events.length - 1;
        const actor = event.actor
          ? event.actor.id === viewerId
            ? "you"
            : event.actor.name ?? event.actor.email
          : null;

        return (
          <li
            key={event.id}
            className={cn(
              "relative ps-6",
              // Rail from this dot down to the next one, or to the disclosure below.
              (!last || continues) && "before:absolute before:start-[4.5px] before:top-[15px] before:-bottom-4 before:w-px before:bg-border",
            )}
          >
            <span aria-hidden="true" className={cn("absolute start-0 top-[5px] size-2.5 rounded-full", dot[event.toStatus])} />
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 text-sm font-medium text-foreground">{STATUS_LABEL[event.toStatus]}</span>
              <time
                dateTime={event.createdAt.toISOString()}
                className="shrink-0 text-xs text-muted-foreground tabular-nums"
              >
                {newDay ? `${day}, ` : <span className="sr-only">{day}, </span>}
                {formatTime(event.createdAt)}
              </time>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {event.fromStatus ? `from ${STATUS_LABEL[event.fromStatus]}` : "Created"}
              {actor ? ` · by ${actor}` : ""}
            </p>
            {event.note && (
              <p className="mt-1.5 border-s-2 border-border ps-2.5 text-sm text-foreground/80 whitespace-pre-line">
                {event.note}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
