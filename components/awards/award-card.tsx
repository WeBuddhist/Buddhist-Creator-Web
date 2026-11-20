import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { PREVIOUS_YEAR, AWARDS_2027, type Award } from "@/lib/awards-2027";
import { cn } from "@/lib/utils";
import { AWARD_PHOTOS } from "./photos";

/* One award as a poster: its photograph full bleed, the award's name set
   large across the foot, under it what the award is for, and last year's
   winner or that the award is new.

   The sizes are in container units: the name fills the same share of the
   card on a phone, in the four-up row and on a wide monitor, and the longest
   word on each card ("Influencer", "Creative") still fits inside it.

   While nominations are open the whole card is the link into the form at
   this award; the arrow at the corner says so without a hover. The link is
   the title, stretched over the card, so its name is the award's. */

/* The award's name: the site's title serif, as every title on the page,
   in container units so it fills the same share of the card at any size.
   The longest lines ("Most Creative", "Best Painting /") still fit at
   14cqw. The leading comes after the size: each text size brings its own
   line height, and cn drops a leading set before one. */
const TITLE = "text-[14cqw]";

export function AwardCard({
  award,
  open = AWARDS_2027.open,
  className,
}: {
  award: Award;
  /** Whether the card links into the form. */
  open?: boolean;
  className?: string;
}) {
  const photo = AWARD_PHOTOS[award.slug];
  const href = `${AWARDS_2027.nominatePath}?award=${award.slug}`;
  // The space between lines keeps the link's name "Influencer of the
  // Year", not "Influencerof the Year".
  const title = award.cardTitle.map((line, index) => (
    <span key={line} className="block">
      {index > 0 && " "}
      {line}
    </span>
  ));

  return (
    <article
      className={cn(
        "group/award @container relative isolate flex flex-col justify-end overflow-hidden rounded-lg bg-sky-deep text-white",
        // Tall enough that the longest description leaves the faces clear;
        // and where the words need more than that (a narrow phone), the
        // card grows to hold them rather than cutting them off.
        "aspect-[3/5] min-h-min",
        // The ring for the stretched link, drawn on the card it covers:
        // white on the sky-deep band.
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-white",
        className,
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        placeholder="blur"
        sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 84vw"
        className="-z-20 object-cover saturate-[0.75] transition-[scale] duration-500 ease-out motion-safe:group-hover/award:scale-[1.03]"
        style={{ objectPosition: photo.position }}
      />
      {/* The shade: the lower half of the card dark enough for the name
          and the words under it, the top lightly shaded so the stage
          banners behind last year's winners stay quiet, and a cast of the
          band's cyan over all of it, so eight photographs from different
          rooms read as one set. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-sky-deep/35 mix-blend-multiply" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-[#04141b]/92 via-[#04141b]/70 via-45% to-[#04141b]/15 to-80%"
      />

      {open && (
        <span
          aria-hidden
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white text-ink transition-colors duration-150 ease-hover group-hover/award:bg-saffron"
        >
          <ArrowUpRightIcon weight="bold" className="size-4.5" />
        </span>
      )}

      {/* The top padding keeps the words clear of the arrow. */}
      <div className="px-[7cqw] pt-16 pb-[7cqw] text-center">
        <h4 className={cn("font-display text-on-photo", TITLE, "leading-[1.04]")}>
          {open ? (
            <Link
              href={href}
              className="focus-visible:outline-none after:absolute after:inset-0 after:content-['']"
            >
              {title}
              <span className="sr-only">: nominate someone</span>
            </Link>
          ) : (
            title
          )}
        </h4>
        {/* What the award is for. Inside the card, under the name; the
            words are plain text over the shade, never cut short. */}
        <p className="mx-auto mt-3 max-w-[36ch] text-pretty text-[0.8125rem] leading-[1.5] text-white/85 text-on-photo sm:text-sm">
          {award.cardDescription ?? award.description}
        </p>
        <p className="mt-4 flex justify-center text-sm leading-[1.4] font-medium text-white/90 text-on-photo">
          {award.credit.kind === "winner" ? (
            <span>
              {PREVIOUS_YEAR} winner <span aria-hidden>·</span> {award.credit.name}
            </span>
          ) : (
            <span className="rounded-full bg-saffron px-2.5 py-1 text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.1em] text-ink [text-shadow:none]">
              New for {AWARDS_2027.year}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
