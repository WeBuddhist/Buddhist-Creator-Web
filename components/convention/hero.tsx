import { FilePdfIcon } from "@phosphor-icons/react/dist/ssr";
import { PageIntro } from "@/components/page-intro";
import { CONVENTION, HERO_STATS } from "@/lib/convention-2026";
import panelMonastics from "@/public/photos/panel-monastics.webp";

/* Report-style opening over a photograph from the week: the panel of
   monastics in front of the convention banner. The link to the full
   report leads, then the dateline as the label, the title, and the two
   figures in the serif. The cohort's group photograph opens the
   homepage, so it is not repeated here. */
export function ConventionHero() {
  return (
    <PageIntro
      id="convention-hero-title"
      eyebrow={
        <>
          {CONVENTION.location}
          <span aria-hidden className="mx-2 opacity-50">
            ·
          </span>
          {CONVENTION.dates}
        </>
      }
      lead={
        <a
          href={CONVENTION.reportHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-saffron px-6 text-[0.9375rem] font-medium text-ink transition-[background-color] duration-150 ease-hover hover:bg-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <FilePdfIcon weight="bold" className="size-4" />
          Download the full report
          <span className="sr-only">(PDF, opens in new tab)</span>
        </a>
      }
      title={CONVENTION.title}
      photo={{
        src: panelMonastics,
        alt: "Three monastics laughing on stage during a panel at the 2026 convention, one holding a microphone, the convention banner behind them.",
        position: "60% 30%",
      }}
    >
      <dl className="mt-10 flex flex-wrap items-end gap-x-12 gap-y-6 border-t border-white/20 pt-8 text-on-photo">
        {HERO_STATS.map(({ value, label }) => (
          <div key={label} className="flex flex-col-reverse">
            <dt className="mt-2 text-sm text-white/85">{label}</dt>
            <dd className="font-display text-6xl tabular-nums leading-[0.9] tracking-[-0.03em] sm:text-7xl">{value}</dd>
          </div>
        ))}
      </dl>
    </PageIntro>
  );
}
