import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ctaLink } from "@/components/events/event-card";
import type { EventEntry } from "@/lib/events";

/* Past events as a disclosure list rather than cards. Each row carries the
   title, when and where and the outcome figures, and opens to the
   campaign's full write-up. Everything inside the trigger is
   a span, since a button only takes phrasing content. */
export function PastEventList({ events }: { events: EventEntry[] }) {
  return (
    <Accordion className="mt-4 border-t border-border lg:mt-6">
      {events.map(({ title, date, location, gist, href, external, cta, stats }) => (
        <AccordionItem key={title} value={title}>
          <AccordionTrigger className="py-5 lg:py-6">
            <span className="flex min-w-0 flex-col">
              <span className="text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                {title}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">
                {date && (date.start ? <time dateTime={date.start}>{date.label}</time> : date.label)}
                {date && " · "}
                {location}
              </span>
              {stats && stats.length > 0 && (
                <span className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  {stats.map(({ value, label }) => (
                    <span key={label}>
                      <span className="font-semibold tabular-nums text-foreground">{value}</span>{" "}
                      {label.toLowerCase()}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-6 lg:pb-7">
            {gist && (
              <p className="max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
                {gist}
              </p>
            )}
            {href && (
              <p className={gist ? "mt-4" : undefined}>
                {external ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className={ctaLink}>
                    {cta ?? "View details"}
                    <span className="sr-only">: {title} (opens in new tab)</span>
                    <ArrowUpRightIcon aria-hidden weight="bold" className="size-3.5" />
                  </a>
                ) : (
                  <Link href={href} className={ctaLink}>
                    {cta ?? "View details"}
                    <span className="sr-only">: {title}</span>
                    <ArrowRightIcon
                      aria-hidden
                      weight="bold"
                      className="size-3.5 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
                    />
                  </Link>
                )}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
