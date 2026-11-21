import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { accentButton, ghostButton, label } from "@/components/convention/section-heading";
import { CONVENTION_2027 } from "@/lib/convention-2027";
import { SITE_NAME } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { HeroVideo } from "@/components/hero-video";
import heroPoster from "@/public/photos/hero-video-poster.webp";

/* One fact in the announcement bar's last line. Each carries the dot that
   separates it from the one before in its own leading padding. */
const detail =
  "relative whitespace-nowrap ps-4 before:absolute before:start-[0.40625rem] before:top-1/2 before:size-[0.1875rem] before:-translate-y-1/2 before:rounded-full before:bg-current";

/* The opening sheet: a short looping film of the convention, with the name
   set large across the top: on two lines up to the tablet width, where the
   frame is tall, and on one line from there. The introduction and the two
   ways in sit in the bottom corner, which leaves the middle of the picture,
   where the people are, uncovered, and the next convention is a slim bar
   along the foot. The sheet runs up behind the floating header. The film's first frame is
   laid underneath as a still, so the sheet is whole before the film loads
   and stays whole for anyone it does not play for (see hero-video.tsx).
   The picture is dimmed from the top, where the name and the header sit,
   and from the bottom. */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      data-header-tone="dark"
      data-header-bg="rgb(4 20 27 / 0.7)"
      className="-mt-(--header-height)"
    >
      <div className="relative isolate flex min-h-[min(100svh,62rem)] flex-col overflow-hidden bg-sky-deep text-white">
        <Image
          src={heroPoster}
          alt="Creators, monastics and lay people at the Buddhist Creators Convention, laughing and cheering together on the steps of a temple."
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="-z-30 object-cover"
        />
        <HeroVideo className="absolute inset-0 -z-20 size-full object-cover" />
        <div
          aria-hidden
          // Below the desktop width the introduction sits over the crowd, not
          // the ground, so the bottom shade starts higher and is at full
          // strength by the time the text begins.
          className="absolute inset-0 -z-10 bg-linear-to-b from-[#04202c]/55 via-[#04202c]/0 via-30% to-[#04141b]/72 to-56% lg:via-50% lg:to-100%"
        />

        <div className="flex flex-col items-center px-4 pt-[calc(var(--header-height)+clamp(1.5rem,5svh,3.5rem))] text-center">
          <p className={cn(label, "text-gold-soft text-on-photo")}>A global network of creators</p>
          <h1
            id="hero-title"
            className="mt-4 text-balance font-display text-on-photo text-[clamp(3.75rem,18vw,9rem)] leading-[0.92] tracking-[-0.03em] lg:whitespace-nowrap lg:text-[clamp(7rem,11vw,13.5rem)]"
          >
            {SITE_NAME}
          </h1>
        </div>

        <div className="mt-auto max-w-lg box-content px-5 pt-10 pb-6 sm:px-7 sm:pt-16 sm:pb-8 lg:px-10 lg:pb-10">
          <p className="text-pretty text-base leading-[1.6] text-white/90 text-on-photo sm:text-xl sm:leading-[1.5]">
            A worldwide community of monastics, practitioners, and storytellers
            using digital media to carry the Dharma further than ever before.
          </p>
          {/* On a phone the two buttons share the row and fill it, or,
              where they will not both fit, each takes a row of its own. */}
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-7 max-sm:*:flex-1">
            <Button
              size="pill"
              nativeButton={false}
              className={accentButton}
              render={<Link href="/get-involved" />}
            >
              Get Involved
              <ArrowUpRightIcon data-icon="inline-end" weight="bold" />
            </Button>
            <Button
              variant="outline"
              size="pill"
              nativeButton={false}
              className={ghostButton}
              render={<Link href="/creators" />}
            >
              Meet our creators
            </Button>
          </div>
        </div>

        {/* The next convention, as an announcement bar along the foot of
            the sheet: brand cyan, the status in the soft gold, the name in
            the serif, and a gold arrow that says the whole bar is the link.
            From the desktop width it is one centred line, set so the
            middle of each text's capitals lies on the arrow's centre: the
            two sans texts get there by their boxes, and the serif, whose
            capitals ride high in its box, is let down by the difference
            (measured, 0.0875em). Below that width the
            status and the name are stacked on the page's leading edge with
            the arrow beside them, and the date and place run under both,
            so on a phone it is three short lines and the picture and the
            two buttons above keep the screen. Where the date and the place
            will not share a line the place drops to the next, and the dot
            between them, which sits in the place's own leading padding, is
            clipped away with it. White on brand cyan measures 6.2:1 (4.6:1
            at 80%), gold-soft 4.7:1, and on the sky-deep the bar turns
            under the pointer all three are higher. The focus ring is drawn
            inside the bar because the sheet clips at its edges. */}
        <Link
          href="/convention/2027"
          className="group/next grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 bg-brand-cyan px-5 py-3 text-white transition-[background-color] duration-150 ease-hover hover:bg-sky-deep focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white sm:px-7 lg:flex lg:justify-center lg:gap-6 lg:px-10 lg:py-4"
        >
          <span
            className={cn(
              label,
              "col-start-1 row-start-1 flex items-center gap-2.5 whitespace-nowrap text-gold-soft",
            )}
          >
            {/* A live dot: the gold dot stays put and a second one under
                it swells to twice the size and fades, like a radar ping,
                every two seconds. Only scale and opacity move. */}
            <span aria-hidden className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-saffron opacity-75 [animation-duration:2s]" />
              <span className="relative size-2 rounded-full bg-saffron" />
            </span>
            {CONVENTION_2027.status}
          </span>
          <span className="col-start-1 row-start-2 font-display text-xl leading-[1.15] lg:translate-y-[0.0875em] lg:text-2xl">
            Convention {CONVENTION_2027.year}
          </span>
          <span className="col-span-2 row-start-3 overflow-hidden text-[0.8125rem] leading-[1.4] text-white/85 sm:text-sm lg:text-[0.9375rem]">
            <span className="-ms-4 flex flex-wrap">
              <time dateTime={CONVENTION_2027.dates.start} className={detail}>
                {CONVENTION_2027.dates.label}
              </time>
              <span className={detail}>{CONVENTION_2027.location}</span>
            </span>
          </span>
          <span className="col-start-2 row-span-2 row-start-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-saffron text-ink lg:size-8">
            <ArrowRightIcon
              aria-hidden
              weight="bold"
              className="size-4 transition-transform duration-150 ease-hover motion-safe:group-hover/next:translate-x-0.5"
            />
          </span>
        </Link>
      </div>
    </section>
  );
}
