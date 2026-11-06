import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { EventCard } from "@/components/events/event-card";
import { PastEventList } from "@/components/events/past-event-list";
import { AsanohaCorner } from "@/components/asanoha-corner";
import { EVENTS_PAGE, ONGOING_EVENTS, PAST_EVENTS, UPCOMING_EVENTS } from "@/lib/events";

export const metadata: Metadata = {
  title: "Program",
  description: EVENTS_PAGE.description,
};

const GROUPS = [
  { id: "ongoing", title: "Ongoing", events: ONGOING_EVENTS, empty: "Nothing running right now." },
  { id: "upcoming", title: "Upcoming", events: UPCOMING_EVENTS, empty: "Nothing scheduled yet. Check back soon." },
  { id: "past", title: "Past", events: PAST_EVENTS, empty: "No past events yet." },
] as const;

export default function EventsPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* The intro band runs up behind the transparent header and pads its
          top by the header's height, so the header sits on the burgundy and
          takes the brand tone. */}
      <section
        aria-labelledby="events-title"
        className="relative isolate -mt-(--header-height) overflow-hidden bg-brand-maroon pt-(--header-height)"
        data-header-tone="brand"
      >
        <AsanohaCorner className="-top-16 -right-16 -scale-x-100" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-12 sm:px-6 lg:pt-20 lg:pb-20">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-golden">
            {EVENTS_PAGE.eyebrow}
          </p>
          <h1
            id="events-title"
            className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl"
          >
            {EVENTS_PAGE.title}
          </h1>
          <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-white/80">
            {EVENTS_PAGE.description}
          </p>
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

            {events.length === 0 ? (
              <p className="mt-6 text-pretty text-base leading-[1.6] text-muted-foreground">
                {empty}
              </p>
            ) : id === "past" ? (
              <PastEventList events={events} />
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:grid-cols-3 lg:gap-6">
                {events.map((event) => (
                  <EventCard key={event.title} event={event} />
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
