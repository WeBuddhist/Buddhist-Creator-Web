import Image, { type StaticImageData } from "next/image";
import { QuotesIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { WaveCorner } from "@/components/mission";
import { Carousel } from "@/components/convention/voices-carousel";
import { COLLABORATORS, TESTIMONIALS, VOICES } from "@/lib/convention-2026";

export function Voices() {
  return (
    <section
      aria-labelledby="voices-title"
      className="relative isolate overflow-hidden bg-brand-cyan"
      data-header-tone="brand"
    >
      <WaveCorner className="-top-16 -left-16" />
      <WaveCorner className="-right-16 -bottom-16 -scale-100" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <Carousel
          label="Participant testimonials"
          count={TESTIMONIALS.length}
          intro={
            <>
              <p className="text-xs font-medium uppercase tracking-[0.05em] text-white/80">
                {VOICES.eyebrow}
              </p>
              <h2
                id="voices-title"
                className="mt-4 text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
              >
                {VOICES.title}
              </h2>
              <p className="mt-5 max-w-[40ch] text-pretty text-lg leading-[1.6] text-white/80">
                {VOICES.description}
              </p>
            </>
          }
        >
          {TESTIMONIALS.map(({ quote, name, role, affiliation, avatar }, i) => (
            <li key={name} aria-label={`${i + 1} of ${TESTIMONIALS.length}`}>
              <figure>
                {/* Brand golden measures 2.98:1 on brand cyan; the 10% lift
                    reaches 3.21:1. The mark is decorative either way. */}
                <QuotesIcon
                  aria-hidden
                  weight="fill"
                  className="size-8 -scale-x-100 text-[color-mix(in_oklch,var(--color-brand-golden),white_10%)]"
                />
                <blockquote className="mt-4 text-pretty text-xl leading-[1.4] text-white sm:text-2xl lg:text-[1.75rem]">
                  {quote}
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  {/* The face cut-out on a small square of the pale cyan well.
                      The name sits beside it, so the image adds nothing a
                      screen reader needs. */}
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-cyan),white_94%)] to-[color-mix(in_oklch,var(--color-brand-cyan),white_86%)] sm:size-16">
                    <Image
                      src={avatar}
                      alt=""
                      placeholder="blur"
                      sizes="4rem"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold leading-[1.3] tracking-[-0.01em] text-white">{name}</p>
                    <p className="mt-0.5 text-pretty text-sm leading-[1.4] text-white/80">
                      {role}
                      {affiliation && (
                        <>
                          <span aria-hidden className="mx-1.5 text-white/50">
                            ·
                          </span>
                          <span className="sr-only">, </span>
                          {affiliation}
                        </>
                      )}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </li>
          ))}
        </Carousel>
      </div>
    </section>
  );
}

/* Logo row under the hero. Names stay in the DOM for screen readers and as
   the link's accessible name; only the mark is drawn. Collaborators with no
   logo on file are left out. */
export function Collaborators() {
  const withLogo = COLLABORATORS.filter(
    (c): c is typeof c & { logo: StaticImageData } => c.logo !== null,
  );

  return (
    <section aria-labelledby="collaborators-title" className="bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:py-10">
        <h2
          id="collaborators-title"
          className="shrink-0 text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground"
        >
          Organisations behind the convention
        </h2>

        <ul className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {withLogo.map(({ name, logo, href }) => {
            const mark = (
              <>
                <Image
                  src={logo}
                  alt=""
                  placeholder="blur"
                  sizes="3.5rem"
                  className="size-14 mix-blend-multiply"
                />
                <span className="sr-only">{name}</span>
              </>
            );
            return (
              <li key={name}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block rounded-lg transition-opacity duration-150 ease-hover hover:opacity-80",
                      "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                    )}
                  >
                    {mark}
                    <span className="sr-only">(opens in new tab)</span>
                  </a>
                ) : (
                  mark
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
