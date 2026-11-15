import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { EventCard } from "@/components/events/event-card";
import { PastEventList } from "@/components/events/past-event-list";
import { PageIntro } from "@/components/page-intro";
import { FigureBand } from "@/components/figure-band";
import { EVENTS_PAGE, ONGOING_EVENTS, PAST_EVENTS, UPCOMING_EVENTS } from "@/lib/events";
import shrineHallTalk from "@/public/photos/shrine-hall-talk.webp";

export const metadata: Metadata = {
  title: "Program",
  description: EVENTS_PAGE.description,
};

const { groups } = EVENTS_PAGE;
const GROUPS = [
  { id: "ongoing", ...groups.ongoing, events: ONGOING_EVENTS, empty: "Nothing running right now." },
  { id: "upcoming", ...groups.upcoming, events: UPCOMING_EVENTS, empty: "Nothing scheduled yet. Check back soon." },
  { id: "past", ...groups.past, events: PAST_EVENTS, empty: "No past programs yet." },
] as const;

/* The grid follows the count, so a short list never leaves empty columns
   beside it: one event runs the full width as a feature, two share the
   row, three or more fall into threes. */
function gridFor(count: number) {
  if (count === 1) return "grid";
  if (count === 2) return "grid gap-4 sm:grid-cols-2 lg:gap-6";
  return "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6";
}

export default function EventsPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageIntro
        id="events-title"
        eyebrow={EVENTS_PAGE.eyebrow}
        title={EVENTS_PAGE.title}
        description={EVENTS_PAGE.lede}
        photo={{
          src: shrineHallTalk,
          alt: "A speaker presenting from beside a screen in a monastery shrine hall painted with murals, monastics and creators seated on red carpets before him.",
          position: "50% 45%",
        }}
      />

      <FigureBand label="Reach so far" figures={[...EVENTS_PAGE.stats]} note={EVENTS_PAGE.statsNote} />

      {GROUPS.map(({ id, title, description, events, empty }, index) => (
        <section key={id} id={id} aria-labelledby={`${id}-title`} className="bg-background">
          <div
            className={cn(
              "mx-auto w-full max-w-6xl px-5 pt-20 sm:px-6 lg:pt-28",
              index === GROUPS.length - 1 && "pb-24 lg:pb-32",
            )}
          >
            <h2
              id={`${id}-title`}
              className="font-display text-4xl leading-[1.06] text-foreground sm:text-5xl"
            >
              {title}
            </h2>
            <p className="mt-4 max-w-[58ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
              {description}
            </p>

            {events.length === 0 ? (
              <p className="mt-8 rounded-2xl bg-paper-deep px-6 py-8 text-pretty text-base leading-[1.6] text-muted-foreground">
                {empty}
              </p>
            ) : id === "past" ? (
              <PastEventList events={events} />
            ) : (
              <ul className={cn("mt-8 lg:mt-10", gridFor(events.length))}>
                {events.map((event) => (
                  <EventCard
                    key={event.title}
                    event={event}
                    layout={events.length === 1 ? "wide" : events.length === 2 ? "half" : "grid"}
                  />
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}
