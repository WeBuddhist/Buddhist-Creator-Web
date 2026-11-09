import Image from "next/image";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading, card, cardInner, photo } from "@/components/convention/section-heading";
import { AWARDS } from "@/lib/convention-2026";

export function Awards() {
  const { featured, winners, closing } = AWARDS;

  return (
    <section id="awards" aria-labelledby="awards-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <SectionHeading
          id="awards-title"
          level="h3"
          eyebrow={AWARDS.eyebrow}
          title={AWARDS.title}
          description={AWARDS.description}
        />

        {/* Buddhist Influencer of the Year */}
        <h4 className="sr-only">Buddhist Influencer of the Year 2026</h4>
        <article className={cn(card, "mt-12 lg:mt-16")}>
          <div className={cn(cardInner, "grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8")}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <Image
                src={featured.photo}
                alt={`${featured.honorific} ${featured.name} receiving the Buddhist Influencer of the Year award`}
                placeholder="blur"
                sizes="(min-width: 1024px) 32rem, 100vw"
                className={cn("size-full object-cover", photo)}
              />
              {/* Same surface recipe as the primary button, in brand golden: a 14%
                  lighter top fading to the base, a 1px highlight along the top
                  edge, a soft drop and a 10% darker ring, with no border for the
                  reason given at primaryButton. Black text measures 10.1:1 on it. */}
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full forced-colors:border bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-golden),white_14%)] to-brand-golden px-2.5 py-1 text-xs font-semibold text-black shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--color-brand-golden),white_30%),0_1.5px_2px_0_--alpha(var(--color-black)/12%),0_0_0_1px_color-mix(in_oklch,var(--color-brand-golden),black_10%)]">
                <TrophyIcon aria-hidden weight="fill" className="size-3.5" />
                Winner 2026
              </span>
            </div>
            <div className="flex flex-col justify-center px-1 pb-2 sm:px-2 lg:py-4">
              <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
                {featured.category}
              </p>
              <p className="mt-3 text-balance text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-3xl">
                {featured.honorific} {featured.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{featured.affiliation}</p>
              <p className="mt-4 text-pretty text-base leading-[1.6] text-foreground/85">
                {featured.citation}
              </p>
              <p className="mt-3 text-pretty text-sm leading-[1.5] text-muted-foreground">
                {featured.story}
              </p>
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                {featured.stats.map(({ value, label }) => (
                  <div key={label} className="flex flex-col-reverse">
                    <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-2xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-brand-cyan">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </article>

        {/* The other four awards */}
        <h4 className="sr-only">Other awards</h4>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:mt-6 lg:grid-cols-4 lg:gap-6">
          {winners.map(({ category, name, affiliation, photo: src, citation }) => (
            <li key={name} className={card}>
              <article className={cn(cardInner, "flex h-full flex-col overflow-hidden")}>
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <Image
                    src={src}
                    alt={`${name} receiving the ${category} award`}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 100vw"
                    className={cn("size-full object-cover", photo)}
                  />
                </div>
                <div className="px-4 pt-4 pb-5">
                  <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
                    {category}
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                    {name}
                  </p>
                  {affiliation && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{affiliation}</p>
                  )}
                  <p className="mt-3 text-pretty text-sm leading-[1.5] text-muted-foreground">
                    {citation}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-pretty text-sm leading-[1.5] text-muted-foreground">
          Awards presented by {AWARDS.presentedBy} on {AWARDS.date} at {AWARDS.venue}, in the
          presence of {AWARDS.witness}.
        </p>

        {/* Closing */}
        <div className="mt-16 grid gap-4 lg:mt-20 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
          <h4 className="text-base font-semibold text-foreground">The closing</h4>
          <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {closing.map(({ title, body }) => (
              <li key={title}>
                <p className="font-semibold leading-[1.3] text-foreground">{title}</p>
                <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
