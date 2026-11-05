import Image from "next/image";
import { FilePdfIcon, YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { WaveCorner } from "@/components/mission";
import { CONVENTION, HERO_STATS } from "@/lib/convention-2026";
import heroPhoto from "@/public/convention/2026/hero.webp";

/* Byline links: underlined white text with a leading icon. */
const bylineLink =
  "inline-flex items-center gap-1.5 rounded-sm font-medium text-white underline decoration-white/40 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

/* Report-style header: one cyan band carrying the dateline, title, a byline
   of key figures and the cohort photo as the article's lead image. */
export function ConventionHero() {
  return (
    <section
      aria-labelledby="convention-hero-title"
      // The band runs up behind the translucent header, so the header reads
      // as part of it. The top padding gives the header's height back.
      className="relative isolate -mt-(--header-height) overflow-hidden bg-brand-cyan pt-(--header-height)"
      data-header-tone="brand"
    >
      <WaveCorner className="-top-16 -right-16 -scale-x-100" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-12 sm:px-6 lg:pt-16 lg:pb-16">
        <p className="reveal text-xs font-medium uppercase tracking-[0.05em] text-white/80">
          {CONVENTION.location}
          <span aria-hidden className="mx-2 text-white/40">
            ·
          </span>
          {CONVENTION.dates}
        </p>

        <h1
          id="convention-hero-title"
          className="reveal mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl lg:text-7xl"
          style={{ animationDelay: "100ms" }}
        >
          {CONVENTION.title}
        </h1>

        <dl
          className="reveal mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80"
          style={{ animationDelay: "200ms" }}
        >
          {HERO_STATS.map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <dd className="font-semibold tabular-nums text-white">{value}</dd>
              <dt>{label}</dt>
            </div>
          ))}
          <div className="flex items-baseline">
            <dt className="sr-only">Documentary</dt>
            <dd>
              <a
                href={CONVENTION.documentary.href}
                target="_blank"
                rel="noopener noreferrer"
                className={bylineLink}
              >
                <YoutubeLogoIcon weight="bold" className="size-4" />
                Watch the documentary
                <span className="sr-only">(YouTube, opens in new tab)</span>
              </a>
            </dd>
          </div>
          <div className="flex items-baseline">
            <dt className="sr-only">Report</dt>
            <dd>
              <a
                href={CONVENTION.reportHref}
                target="_blank"
                rel="noopener noreferrer"
                className={bylineLink}
              >
                <FilePdfIcon weight="bold" className="size-4" />
                Download the full report
                <span className="sr-only">(PDF, opens in new tab)</span>
              </a>
            </dd>
          </div>
        </dl>

        <figure className="reveal mt-10 lg:mt-14" style={{ animationDelay: "300ms" }}>
          <Image
            src={heroPhoto}
            alt="Over a hundred creators seated together on the grounds of the Mahabodhi Temple in Bodh Gaya, the temple's spire rising behind them."
            placeholder="blur"
            priority
            sizes="(min-width: 1152px) 72rem, 100vw"
            className="aspect-[3/2] w-full object-cover outline-1 -outline-offset-1 outline-white/10 sm:aspect-[2/1]"
          />
          <figcaption className="mt-3 text-sm text-white/70">
            The 2026 cohort at the Mahabodhi Temple, Bodh Gaya.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
