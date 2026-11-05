import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/convention/section-heading";
import { EventCard, ctaLink } from "@/components/events/event-card";
import { ONGOING_EVENTS, UPCOMING_EVENTS } from "@/lib/events";
import { WHATS_ON } from "@/lib/home";

/* The events running now and the ones announced, straight from the events
   page's lists, so moving an entry there moves it here. Renders nothing when
   both lists are empty rather than an empty state on the homepage. */
export function WhatsOn() {
  const events = [...ONGOING_EVENTS, ...UPCOMING_EVENTS];
  if (events.length === 0) return null;

  return (
    <section aria-labelledby="whats-on-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
        {/* The heading stack leads; the link to the full list trails, on the
            description's baseline once there is room for both. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <SectionHeading
            id="whats-on-title"
            eyebrow={WHATS_ON.eyebrow}
            title={WHATS_ON.title}
            description={WHATS_ON.description}
          />
          <Link href={WHATS_ON.action.href} className={cn(ctaLink, "shrink-0")}>
            {WHATS_ON.action.label}
            <ArrowRightIcon
              aria-hidden
              weight="bold"
              className="size-3.5 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
            />
          </Link>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-6">
          {events.map((event) => (
            <EventCard key={event.title} event={event} />
          ))}
        </ul>
      </div>
    </section>
  );
}
