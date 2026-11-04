import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading, card, cardInner } from "@/components/convention/section-heading";
import { MASTERCLASS } from "@/lib/convention-2026";

export function Masterclass() {
  const { coaches, modules, format, specialSession, effectiveness } = MASTERCLASS;

  return (
    <section aria-labelledby="masterclass-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <SectionHeading
          id="masterclass-title"
          level="h3"
          eyebrow={MASTERCLASS.eyebrow}
          title={MASTERCLASS.title}
          description={MASTERCLASS.description}
        />

        {/* Coaches */}
        <h4 className="sr-only">The coaches</h4>
        <ul className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-2 lg:gap-6">
          {coaches.map(({ name, title, bio }) => (
            <li key={name} className={card}>
              <div className={cn(cardInner, "h-full px-4 pt-4 pb-5 sm:px-5")}>
                <p className="text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                  {name}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{title}</p>
                <p className="mt-3 text-pretty text-sm leading-[1.5] text-muted-foreground">
                  {bio}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {/* Modules */}
        <div className="mt-16 lg:mt-20">
          <h4 className="text-base font-semibold text-foreground">Six modules</h4>
          <ol className="mt-5 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ title, body }, index) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden
                  className="w-7 shrink-0 text-2xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-brand-cyan"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold leading-[1.3] text-foreground">{title}</p>
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
            <h4 className="text-base font-semibold text-foreground">How the masterclass ran</h4>
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
              <div className={cn(cardInner, "px-4 pt-4 pb-5 sm:px-5")}>
                <p className="font-semibold text-foreground">{specialSession.title}</p>
                <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                  {specialSession.body}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold text-foreground">What participants said</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Post-masterclass survey of participants.
            </p>
            <dl className="mt-6 flex flex-col gap-6">
              {effectiveness.map(({ value, label }) => (
                <div key={label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="text-2xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-foreground">
                      {value}%
                    </dd>
                  </div>
                  <div
                    aria-hidden
                    className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
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
