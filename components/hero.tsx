import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { accentButton, ghostButton, label } from "@/components/convention/section-heading";
import { CONVENTION_2027 } from "@/lib/convention-2027";
import { SITE_NAME } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import heroPhoto from "@/public/photos/mahabodhi-gathering.webp";

/* The opening sheet: the 2026 cohort under the Mahabodhi Temple, with the
   name set in the sky above them: on two lines up to the tablet width,
   where the frame is tall, and on one line from there, so it stays in the
   sky and off the faces. The introduction and the two ways in sit in the
   bottom corner and the next convention in the other, which leaves the
   middle of the picture, where the teachers sit, uncovered. The sheet runs
   up behind the floating header. The photograph is dimmed from the top,
   where the name and the header sit, and from the bottom; the people in
   the middle are left as they were shot. */
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
          src={heroPhoto}
          alt="Over a hundred creators, monastics and lay people seated together in front of the Mahabodhi Temple in Bodh Gaya, under a clear blue sky."
          fill
          preload
          placeholder="blur"
          sizes="100vw"
          className="-z-20 object-cover object-[50%_72%]"
        />
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

        <div className="mt-auto flex flex-col gap-6 px-5 pt-10 pb-5 sm:gap-8 sm:px-7 sm:pt-16 sm:pb-7 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:pb-10">
          <div className="max-w-lg">
            <p className="text-pretty text-base leading-[1.6] text-white/90 text-on-photo sm:text-xl sm:leading-[1.5]">
              A worldwide community of monastics, practitioners, and storytellers
              using digital media to carry the Dharma further than ever before.
            </p>
            {/* On a phone the two buttons share the row and fill it, or,
                where they will not both fit, each takes a row of its own,
                as wide as the ticket below. */}
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

          {/* The next convention, as a ticket pinned to the corner of the
              photograph: gold, an ink outline, a perforated stub with the
              arrow, and set a little off true from the desktop width, where
              it straightens under the pointer. The whole ticket is the
              link. It is set in Inter throughout, the one place the public site
              uses it. Ink on saffron measures 8.6:1. */}
          <Link
            href="/convention/2027"
            className="group/ticket flex w-full max-w-sm items-stretch rounded-2xl border-[1.5px] bg-saffron font-(family-name:--font-inter) text-ink transition-transform duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:lg:rotate-2 motion-safe:lg:hover:rotate-0"
          >
            <span className="flex min-w-0 flex-1 flex-col items-start gap-2 p-4">
              <span className="inline-flex items-center rounded-md border-[1.5px] bg-card px-2 py-1 text-[0.6875rem] font-bold uppercase leading-none tracking-[0.08em]">
                {CONVENTION_2027.status}
              </span>
              <span className="text-xl font-extrabold uppercase leading-none tracking-[-0.02em] sm:text-2xl">
                Convention {CONVENTION_2027.year}
              </span>
              <span className="text-sm font-medium leading-[1.35]">
                <time dateTime={CONVENTION_2027.dates.start}>{CONVENTION_2027.dates.label}</time>
                <br />
                {CONVENTION_2027.location}
              </span>
            </span>
            <span className="flex w-12 shrink-0 items-center justify-center border-s-[1.5px] sm:w-14 border-dashed border-ink">
              <ArrowRightIcon
                aria-hidden
                weight="bold"
                className="size-6 transition-transform duration-150 ease-hover motion-safe:group-hover/ticket:translate-x-1"
              />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
