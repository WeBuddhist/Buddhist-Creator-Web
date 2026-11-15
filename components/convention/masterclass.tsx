import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import tentCohort from "@/public/photos/tent-cohort.webp";
import Image from "next/image";
import { SectionHeading, card, cardInner, photo } from "@/components/convention/section-heading";
import { MASTERCLASS } from "@/lib/convention-2026";

export function Masterclass() {
  const { coaches, modules, format, specialSession, effectiveness } = MASTERCLASS;

  return (
    <section id="masterclass" aria-labelledby="masterclass-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-6 lg:py-32">
        <SectionHeading
          id="masterclass-title"
          level="h3"
          eyebrow={MASTERCLASS.eyebrow}
          title={MASTERCLASS.title}
          description={MASTERCLASS.description}
        />

        <figure className="mt-12 lg:mt-16">
          <Image
            src={tentCohort}
            alt="The 2026 cohort, monastics and lay creators, at round tables under the convention tent in Bodh Gaya, laptops and notebooks open."
            placeholder="blur"
            sizes="(min-width: 1152px) 72rem, 100vw"
            className={cn("aspect-[3/2] w-full rounded-2xl object-cover sm:aspect-[21/9]", photo)}
            style={{ objectPosition: "50% 75%" }}
          />
          <figcaption className="mt-3 text-sm text-muted-foreground">Convention 2026, Bodh Gaya.</figcaption>
        </figure>

        {/* Coaches */}
        <h4 className="sr-only">The coaches</h4>
        <ul className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-2 lg:gap-6">
          {coaches.map(({ name, title, bio }) => (
            <li key={name} className={card}>
              <div className={cn(cardInner, "h-full p-5 sm:p-6")}>
                <p className="font-display text-[1.75rem] leading-[1.12] text-foreground">
                  {name}
                </p>
                <p className="mt-1.5 text-sm text-brand-cyan">{title}</p>
                <p className="mt-3 text-pretty text-sm leading-[1.5] text-muted-foreground">
                  {bio}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Modules */}
        <div className="mt-16 lg:mt-20">
          <h4 className="font-display text-2xl leading-[1.15] text-foreground">Six modules</h4>
          <ol className="mt-6 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ title, body }, index) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden
                  className="w-10 shrink-0 font-display text-4xl tabular-nums leading-[0.9] text-brand-cyan"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-medium leading-[1.3] text-foreground">{title}</p>
                  <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Format, special session, and how it landed */}
        <div className="mt-16 grid gap-10 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <h4 className="font-display text-2xl leading-[1.15] text-foreground">How the masterclass ran</h4>
            <ul className="mt-5 flex flex-col gap-3">
              {format.map((item) => (
                <li key={item} className="flex gap-3 text-pretty text-base leading-[1.6] text-muted-foreground">
                  <CheckIcon
                    aria-hidden
                    weight="bold"
                    className="mt-1.5 size-4 shrink-0 text-brand-cyan"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className={cn(card, "mt-8")}>
              <div className={cn(cardInner, "p-5")}>
                <p className="font-display text-[1.375rem] leading-[1.2] text-foreground">{specialSession.title}</p>
                <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                  {specialSession.body}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-display text-2xl leading-[1.15] text-foreground">What participants said</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Post-masterclass survey of participants.
            </p>
            <dl className="mt-6 flex flex-col gap-6">
              {effectiveness.map(({ value, label }) => (
                <div key={label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="font-display text-4xl tabular-nums leading-none text-foreground">
                      {value}%
                    </dd>
                  </div>
                  <div
                    aria-hidden
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper-deep"
                  >
                    <div
                      className="h-full rounded-full bg-brand-cyan"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
