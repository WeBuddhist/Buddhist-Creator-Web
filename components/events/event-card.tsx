import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CalendarBlankIcon,
  ImageIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { card, cardInner, photo } from "@/components/convention/section-heading";
import type { EventEntry } from "@/lib/events";

/* The labelled link at the bottom of a card. */
const ctaLink =
  "group/link inline-flex items-center gap-1 rounded-sm text-sm font-medium text-brand-cyan underline decoration-brand-cyan/30 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/* One event. The media sits flush at the top of the inner surface, the text
   below it on a shared left edge. When the event has somewhere to go, the
   link is the labelled line at the bottom of the card, not the card. */
export function EventCard({ event }: { event: EventEntry }) {
  const { title, date, location, description, href, external, cta, image, featured, stats } = event;

  return (
    <li className={card}>
      <article className={cn(cardInner, "flex h-full flex-col overflow-hidden")}>
        <div className="relative aspect-[3/2] bg-muted">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
              className={cn("size-full object-cover", photo)}
            />
          ) : (
            <Placeholder />
          )}
          {featured && (
            <span className="absolute top-3 start-3 inline-flex items-center rounded-full border border-transparent bg-background px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-brand-cyan shadow-border">
              Featured
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-5 pt-5 pb-6">
          <h3 className="text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
            {title}
          </h3>

          <dl className="mt-3 flex flex-col gap-1.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <dt className="sr-only">Date</dt>
              <CalendarBlankIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <dd>
                {/* datetime takes one date, so a range carries its start. */}
                <time dateTime={date.start}>{date.label}</time>
              </dd>
            </div>
            <div className="flex items-start gap-2">
              <dt className="sr-only">Location</dt>
              <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
              <dd className="text-pretty">{location}</dd>
            </div>
          </dl>

          <p className="mt-4 text-pretty text-sm leading-[1.5] text-muted-foreground">
            {description}
          </p>

          {stats && (
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
              {stats.map(({ value, label }) => (
                <div key={label} className="flex flex-col-reverse">
                  <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-brand-cyan">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {href && (
            <p className="mt-auto pt-5">
              {/* The link names the event so it reads out of context in a
                  list of the page's links. */}
              {external ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ctaLink}
                >
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
        </div>
      </article>
    </li>
  );
}

/* Stand-in until the event has a photo: the muted surface with a faint
   image glyph, hidden from assistive tech. */
function Placeholder() {
  return (
    <div aria-hidden className="flex size-full items-center justify-center">
      <ImageIcon className="size-8 text-foreground/20" />
    </div>
  );
}
