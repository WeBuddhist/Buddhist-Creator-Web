import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { EventCard } from "@/components/events/event-card";
import { EVENTS_PAGE, PAST_EVENTS, UPCOMING_EVENTS } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description: EVENTS_PAGE.description,
};

const GROUPS = [
  { id: "upcoming", title: "Upcoming", events: UPCOMING_EVENTS, empty: "Nothing scheduled yet. Check back soon." },
  { id: "past", title: "Past", events: PAST_EVENTS, empty: "No past events yet." },
] as const;

export default function EventsPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section aria-labelledby="events-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6 lg:pt-20">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
            {EVENTS_PAGE.eyebrow}
          </p>
          <h1
            id="events-title"
            className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl"
          >
            {EVENTS_PAGE.title}
          </h1>
          <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
            {EVENTS_PAGE.description}
          </p>

          {/* In-page navigation. Counts sit beside the labels so the reader
              knows what each section holds before jumping. */}
          <nav aria-label="Event sections" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {GROUPS.map(({ id, title, events }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="inline-flex h-9 items-center gap-2 rounded-full border border-transparent bg-muted px-3.5 text-sm font-medium text-foreground shadow-ring transition-[background-color] duration-150 ease-hover hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {title}
                    <span className="tabular-nums text-muted-foreground">{events.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {GROUPS.map(({ id, title, events, empty }, index) => (
        <section key={id} id={id} aria-labelledby={`${id}-title`} className="bg-background">
          <div
            className={cn(
              "mx-auto w-full max-w-6xl px-4 pt-14 sm:px-6 lg:pt-20",
              index === GROUPS.length - 1 && "pb-16 lg:pb-24",
            )}
          >
            <h2
              id={`${id}-title`}
              className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-3xl"
            >
              {title}
            </h2>

            {events.length > 0 ? (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3 lg:gap-6">
                {events.map((event) => (
                  <EventCard key={event.title} event={event} />
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-pretty text-base leading-[1.6] text-muted-foreground">
                {empty}
              </p>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
