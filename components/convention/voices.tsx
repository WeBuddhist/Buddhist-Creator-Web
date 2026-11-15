import Image, { type StaticImageData } from "next/image";
import { QuotesIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { label, panel } from "@/components/convention/section-heading";
import { Carousel } from "@/components/convention/voices-carousel";
import { COLLABORATORS, TESTIMONIALS, VOICES } from "@/lib/convention-2026";

export function Voices() {
  return (
    // The page's last sheet, in brand cyan, which the footer meets directly.
    // White on brand cyan measures 6.2:1.
    // `relative` matters: the carousel's off-screen slides hold
    // visually-hidden text, which is absolutely positioned, and without a
    // positioned ancestor here the sheet's clipping would not reach it and
    // the page would scroll sideways.
    <section
      aria-labelledby="voices-title"
      data-header-tone="dark"
      className={cn(panel, "relative overflow-hidden bg-brand-cyan text-white")}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
        <Carousel
          label="Participant testimonials"
          count={TESTIMONIALS.length}
          intro={
            <>
              <p className={cn(label, "text-gold-soft")}>{VOICES.eyebrow}</p>
              <h2
                id="voices-title"
                className="mt-4 text-balance font-display text-4xl leading-[1.06] sm:text-5xl lg:text-6xl"
              >
                {VOICES.title}
              </h2>
              <p className="mt-5 max-w-[40ch] text-pretty text-lg leading-[1.6] text-white/85">
                {VOICES.description}
              </p>
            </>
          }
        >
          {TESTIMONIALS.map(({ quote, name, role, affiliation, avatar }, i) => (
            <li key={name} aria-label={`${i + 1} of ${TESTIMONIALS.length}`}>
              <figure>
                {/* Saffron, as on the banners. The mark is decorative. */}
                <QuotesIcon aria-hidden weight="fill" className="size-9 -scale-x-100 text-saffron" />
                <blockquote className="mt-5 text-pretty font-display text-2xl leading-[1.35] tracking-[-0.01em] sm:text-[1.75rem] lg:text-[2rem] lg:leading-[1.3]">
                  {quote}
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  {/* The face cut-out on a small round of pale cyan.
                      The name sits beside it, so the image adds nothing a
                      screen reader needs. */}
                  <div className="size-14 shrink-0 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-brand-cyan),white_80%)] sm:size-16">
                    <Image
                      src={avatar}
                      alt=""
                      placeholder="blur"
                      sizes="4rem"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-medium leading-[1.3]">{name}</p>
                    <p className="mt-0.5 text-pretty text-sm leading-[1.4] text-white/85">
                      {role}
                      {affiliation && (
                        <>
                          <span aria-hidden className="mx-1.5 text-white/60">
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
        <h2 id="collaborators-title" className={cn(label, "shrink-0 text-muted-foreground")}>
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
