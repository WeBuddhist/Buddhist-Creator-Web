import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  ImageIcon,
  MapPinIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { card, cardInner, photo } from "@/components/convention/section-heading";
import type { EventEntry } from "@/lib/events";

/* One event. The media sits flush at the top of the inner surface, the text
   below it on a shared left edge. When the event has somewhere to go, the
   title is the link and a pseudo-element stretches its hit area over the
   whole card, so the card is one target with one accessible name. */
export function EventCard({ event }: { event: EventEntry }) {
  const { title, date, location, description, href, cta, image, featured } = event;

  return (
    <li className={cn(card, "group/card relative", href && "transition-[background-color] duration-150 ease-hover hover:bg-muted")}>
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
            {href ? (
              <Link
                href={href}
                className="rounded-sm after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
              >
                {title}
              </Link>
            ) : (
              title
            )}
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

          {href && (
            <p
              aria-hidden
              className="mt-auto flex items-center gap-1 pt-5 text-sm font-medium text-brand-cyan"
            >
              {cta ?? "View details"}
              <ArrowRightIcon
                weight="bold"
                className="size-3.5 transition-transform duration-150 ease-hover motion-safe:group-hover/card:translate-x-0.5"
              />
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
