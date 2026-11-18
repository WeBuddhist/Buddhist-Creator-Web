import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon, ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { card, cardInner, label } from "@/components/convention/section-heading";
import type { EventEntry } from "@/lib/events";

/* A text link that leads somewhere: medium weight, in the colour of the
   text around it, on a fine underline that firms up under the pointer. */
export const ctaLink =
  "group/link inline-flex items-center gap-1.5 rounded-sm text-[0.9375rem] font-medium text-current underline decoration-current/35 decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-150 ease-hover hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current";

/* How the card sits in its list. `grid` is a third of the row; `half`
   shares the row with one other card, so its picture runs a little
   wider than tall; `wide` is the only card in its list and, from lg,
   puts the picture beside the text instead of over it. */
type EventCardLayout = "grid" | "half" | "wide";

/* One event, as a listing card: the picture, when and where on one quiet
   line under it, the title in the serif, and the way in as a link at the
   foot. When the event has nowhere to go yet there is no link. */
export function EventCard({ event, layout = "grid" }: { event: EventEntry; layout?: EventCardLayout }) {
  const { title, date, location, description, href, external, cta, image, featured, stats } = event;
  const wide = layout === "wide";

  return (
    <li className={card}>
      <article
        className={cn(
          cardInner,
          "flex h-full flex-col p-3",
          wide && "lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center",
        )}
      >
        <div
          className={cn(
            "relative aspect-[4/3] min-h-0 shrink-0 overflow-hidden rounded-xl bg-paper-deep",
            layout === "half" && "lg:aspect-[16/10]",
          )}
        >
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              placeholder="blur"
              sizes={
                layout === "grid"
                  ? "(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
                  : "(min-width: 1024px) 36rem, 100vw"
              }
              className="size-full object-cover"
            />
          ) : (
            <Placeholder />
          )}
          {featured && (
            <span className="absolute start-3 top-3 inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.1em] text-brand-cyan">
              Featured
            </span>
          )}
        </div>

        <div className={cn("flex flex-1 flex-col px-3 pt-5 pb-3", wide && "lg:px-10 lg:py-8")}>
          <dl className={cn(label, "flex flex-wrap gap-x-2 gap-y-1 text-[0.75rem] text-brand-cyan")}>
            {date && (
              <div>
                <dt className="sr-only">Date</dt>
                <dd>
                  {/* datetime takes one date, so a range carries its start;
                      a label with no date behind it is plain text. */}
                  {date.start ? <time dateTime={date.start}>{date.label}</time> : date.label}
                  <span aria-hidden className="ms-2 text-brand-cyan/50">
                    ·
                  </span>
                </dd>
              </div>
            )}
            <div>
              <dt className="sr-only">Location</dt>
              <dd>{location}</dd>
            </div>
          </dl>
          <h3
            className={cn(
              "mt-3 text-balance font-display text-[1.625rem] leading-[1.15] text-foreground",
              wide && "lg:text-4xl lg:leading-[1.08]",
            )}
          >
            {title}
          </h3>

          {/* The figures sit under the title as one row of equal columns,
              so they never wrap and line up from card to card. */}
          {stats && stats.length > 0 && (
            <dl className="mt-4 grid auto-cols-fr grid-flow-col gap-x-3">
              {stats.map(({ value, label: name }) => (
                <div key={name} className="flex min-w-0 flex-col-reverse">
                  <dt className="mt-1 truncate text-xs text-muted-foreground">{name}</dt>
                  <dd className="font-display text-xl tabular-nums leading-none text-brand-cyan sm:text-2xl">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {description && (
            <p
              className={cn(
                "mt-3 text-pretty text-[0.9375rem] leading-[1.55] text-muted-foreground",
                wide && "lg:mt-4 lg:max-w-[46ch] lg:text-lg lg:leading-[1.6]",
              )}
            >
              {description}
            </p>
          )}

          {href && (
            <p className={cn("mt-auto pt-6 text-brand-cyan", wide && "lg:mt-0 lg:pt-8")}>
              {/* The link names the event so it reads out of context in a
                  list of the page's links. */}
              {external ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className={ctaLink}>
                  {cta ?? "View details"}
                  <span className="sr-only">: {title} (opens in new tab)</span>
                  <ArrowUpRightIcon aria-hidden weight="bold" className="size-4" />
                </a>
              ) : (
                <Link href={href} className={ctaLink}>
                  {cta ?? "View details"}
                  <span className="sr-only">: {title}</span>
                  <ArrowRightIcon
                    aria-hidden
                    weight="bold"
                    className="size-4 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
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
