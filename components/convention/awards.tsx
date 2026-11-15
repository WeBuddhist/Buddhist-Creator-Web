import Image from "next/image";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading, card, cardInner, label, photo } from "@/components/convention/section-heading";
import { AWARDS } from "@/lib/convention-2026";

export function Awards() {
  const { featured, winners, closing } = AWARDS;

  return (
    <section id="awards" aria-labelledby="awards-title" className="bg-background">
      {/* No top padding: the masterclass's bottom padding above is the gap,
          one section gap rather than two. */}
      <div className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-6 lg:pb-32">
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
          <div className={cn(cardInner, "grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10")}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper-deep">
              <Image
                src={featured.photo}
                alt={`${featured.honorific} ${featured.name} receiving the Buddhist Influencer of the Year award`}
                placeholder="blur"
                sizes="(min-width: 1024px) 32rem, 100vw"
                className={cn("size-full object-cover", photo)}
              />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-saffron px-3 py-1.5 text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.1em] text-ink">
                <TrophyIcon aria-hidden weight="fill" className="size-3.5" />
                Winner 2026
              </span>
            </div>
            <div className="flex flex-col justify-center px-1 pb-2 sm:px-2 lg:py-4">
              <p className={cn(label, "text-brand-cyan")}>{featured.category}</p>
              <p className="mt-4 text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl">
                {featured.honorific} {featured.name}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{featured.affiliation}</p>
              <p className="mt-5 text-pretty text-lg leading-[1.55] text-foreground">
                {featured.citation}
              </p>
              <p className="mt-3 text-pretty text-[0.9375rem] leading-[1.6] text-muted-foreground">
                {featured.story}
              </p>
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
                {featured.stats.map(({ value, label: name }) => (
                  <div key={name} className="flex flex-col-reverse">
                    <dt className="mt-1.5 text-xs text-muted-foreground">{name}</dt>
                    <dd className="font-display text-4xl tabular-nums leading-none text-brand-cyan">
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
              <article className={cn(cardInner, "flex h-full flex-col p-3")}>
                <div className="aspect-[4/3] overflow-hidden rounded-xl bg-paper-deep">
                  <Image
                    src={src}
                    alt={`${name} receiving the ${category} award`}
                    placeholder="blur"
                    sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 100vw"
                    className={cn("size-full object-cover", photo)}
                  />
                </div>
                <div className="px-3 pt-4 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">
                    {category}
                  </p>
                  <p className="mt-2 font-display text-2xl leading-[1.15] text-foreground">
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
        <div className="mt-16 grid gap-4 border-t border-border pt-6 lg:mt-20 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 lg:pt-8">
          <h4 className="font-display text-2xl leading-[1.15] text-foreground">The closing</h4>
          <ol className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {closing.map(({ title, body }) => (
              <li key={title}>
                <p className="text-lg font-medium leading-[1.3] text-foreground">{title}</p>
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
