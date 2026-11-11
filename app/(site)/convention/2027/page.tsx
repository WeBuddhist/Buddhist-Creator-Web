import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  GlobeHemisphereEastIcon,
  HandshakeIcon,
  LightbulbIcon,
  MapPinIcon,
  MicrophoneStageIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ConventionFlyer } from "@/components/convention-flyer";
import {
  ClosingAction,
  ClosingCallToAction,
  RegisterCallToAction,
  RegistrationAction,
} from "@/components/convention/registration-action";
import { SectionHeading, card, cardInner, primaryButton } from "@/components/convention/section-heading";
import { ctaLink } from "@/components/events/event-card";
import { InView } from "@/components/home/in-view";
import { WaveCorner } from "@/components/mission";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BRING_HOME,
  CLOSING,
  CONVENTION_2027,
  IN_STORE,
  ORGANISER,
  REGISTRATION,
  SUPPORTER,
  WELCOME,
  type ProgrammeItem,
} from "@/lib/convention-2027";
import { PARTNER } from "@/lib/get-involved";

export const metadata: Metadata = {
  title: CONVENTION_2027.title,
  description: `${CONVENTION_2027.theme}: Buddhist creators from around the world gather at ${CONVENTION_2027.location}, ${CONVENTION_2027.dates.label}. Registration is open.`,
};

/* A link in the details card: underlined in the text's own colour. */
const detailLink =
  "rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/* One mark per part of the programme, in the homepage programs' recipe:
   the brand colour on a soft disc of the same colour. Hidden from assistive
   tech; the title carries the meaning. */
const ICONS: Record<ProgrammeItem["id"], typeof MicrophoneStageIcon> = {
  journeys: MicrophoneStageIcon,
  dharma: LightbulbIcon,
  create: VideoCameraIcon,
  sangha: GlobeHemisphereEastIcon,
};

/* The flyer everyone knows from the homepage opens the page. Under it the
   announcement reads down the left: the theme, then what the four days
   hold. Beside both sits one card with the facts a reader came for and the
   one action: applying, or for someone with an application, getting back
   to it. It follows the theme in the source, so on a phone it comes before
   the programme, and from `lg` it stays in view while the programme scrolls
   past. The invitation to partners and the closing band follow.

   Both actions read the session, so each streams in behind a Suspense
   boundary whose fallback is the visitor's version. */
export default function Convention2027Page() {
  return (
    <main className="flex flex-1 flex-col">
      <ConventionFlyer as="h1" first />

      {/* The illustration's ground meets this hairline, as it meets the
          footer's on the homepage. */}
      <section aria-labelledby="welcome-title" className="border-t border-border bg-background">
        <div className="mx-auto grid w-full max-w-6xl gap-x-16 gap-y-12 px-4 pt-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-y-20 lg:pt-24">
          <div>
            <SectionHeading id="welcome-title" eyebrow={WELCOME.eyebrow} title={WELCOME.title} />
            <p className="mt-6 max-w-[46ch] text-pretty text-xl leading-[1.5] text-foreground sm:text-2xl sm:leading-[1.45]">
              {WELCOME.lede}
            </p>
            <div className="mt-6 max-w-[58ch] space-y-5 text-pretty text-lg leading-[1.6] text-muted-foreground">
              {WELCOME.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* The details card: the same double-bordered surface as the
              site's other cards. It spans both rows of the left column, so
              it has the programme's height to stay sticky through. */}
          <aside
            aria-labelledby="registration-title"
            className={cn(card, "lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:row-span-2")}
          >
            <div className={cn(cardInner, "flex flex-col px-5 pt-5 pb-6 sm:px-6 sm:pb-7")}>
              <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
                {REGISTRATION.eyebrow}
              </p>
              <h2
                id="registration-title"
                className="mt-3 text-balance text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground"
              >
                {REGISTRATION.title}
              </h2>

              <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-base leading-[1.5] text-muted-foreground">
                <div className="flex items-start gap-3">
                  <dt className="sr-only">Dates</dt>
                  <CalendarBlankIcon aria-hidden className="mt-1 size-4 shrink-0" />
                  <dd>
                    <time dateTime={CONVENTION_2027.dates.start}>{CONVENTION_2027.dates.label}</time>
                  </dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="sr-only">Venue</dt>
                  <MapPinIcon aria-hidden className="mt-1 size-4 shrink-0" />
                  <dd className="text-pretty">{CONVENTION_2027.location}</dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="sr-only">Organiser</dt>
                  <HandshakeIcon aria-hidden className="mt-1 size-4 shrink-0" />
                  <dd className="text-pretty">
                    Organised by{" "}
                    <a href={ORGANISER.href} target="_blank" rel="noopener noreferrer" className={detailLink}>
                      {ORGANISER.name}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                    , with the generous support of the{" "}
                    <a href={SUPPORTER.href} target="_blank" rel="noopener noreferrer" className={detailLink}>
                      {SUPPORTER.name}
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  </dd>
                </div>
              </dl>

              <Suspense fallback={<RegisterCallToAction />}>
                <RegistrationAction />
              </Suspense>

              <p className="mt-5 border-t border-border pt-5">
                <Link href={REGISTRATION.previous.href} className={ctaLink}>
                  {REGISTRATION.previous.label}
                  <ArrowRightIcon
                    aria-hidden
                    weight="bold"
                    className="size-3.5 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
                  />
                </Link>
              </p>
            </div>
          </aside>

          {/* The programme, as stops along a path: each disc is joined to
              the next by a dashed trail. The stops arrive one after another
              the first time the list scrolls into view, through the paused
              entrance the homepage illustrations use (.art in globals.css);
              without scripts, or with reduced motion, they simply show or
              fade. */}
          <section aria-labelledby="in-store-title">
            <h2
              id="in-store-title"
              className="text-balance text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-3xl"
            >
              {IN_STORE.title}
            </h2>
            <InView className="art mt-8 lg:mt-10">
              <ul className="flex flex-col">
                {IN_STORE.items.map(({ id, title, body }, index) => {
                  const Icon = ICONS[id];
                  return (
                    <li
                      key={id}
                      data-animate
                      className="reveal relative flex gap-4 pb-8 last:pb-0 sm:gap-5"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {index < IN_STORE.items.length - 1 && (
                        <span
                          aria-hidden
                          className="absolute top-12 bottom-2 left-5 border-l border-dashed border-brand-cyan/40"
                        />
                      )}
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center border-2 border-action/10 rounded-full bg-brand-cyan/10 text-brand-cyan"
                      >
                        <Icon weight="bold" className="size-5" />
                      </span>
                      <div className="min-w-0 pt-1.5">
                        <h3 className="text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                          {title}
                        </h3>
                        <p className="mt-1 max-w-[52ch] text-pretty text-base leading-[1.6] text-muted-foreground">
                          {body}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </InView>
          </section>
        </div>
      </section>

      {/* The invitation to partners, in the Get Involved page's own card,
          and leading to the section of that page written for them. Its
          button is the site's cyan one, as on that page's own cards. */}
      <section aria-labelledby="bring-home-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-16 sm:px-6 lg:pt-24 lg:pb-24">
          <div className={card}>
            <div
              className={cn(
                cardInner,
                "grid gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:px-10 lg:py-10",
              )}
            >
              <SectionHeading
                id="bring-home-title"
                size="h3"
                eyebrow={BRING_HOME.eyebrow}
                title={BRING_HOME.title}
                description={BRING_HOME.description}
              />
              <Button
                size="pill"
                nativeButton={false}
                className={cn(primaryButton, "shrink-0 justify-self-start")}
                render={<Link href={`/get-involved#${PARTNER.id}`} />}
              >
                {BRING_HOME.actionLabel}
                <ArrowRightIcon data-icon="inline-end" weight="bold" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* The closing band, in the homepage mission band's recipe: brand
          cyan, the wave pattern in two opposite corners, the line that
          matters in the lifted golden (3.21:1 on the cyan, for large
          text). */}
      <section
        aria-labelledby="closing-title"
        className="relative isolate overflow-hidden bg-brand-cyan"
        data-header-tone="brand"
      >
        <WaveCorner className="-top-16 -left-16" />
        <WaveCorner className="-right-16 -bottom-16 -scale-100" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-28">
          <h2
            id="closing-title"
            className="text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
          >
            <span className="block">{CLOSING.title[0]}</span>{" "}
            <span className="block text-[color-mix(in_oklch,var(--color-brand-golden),white_10%)]">
              {CLOSING.title[1]}
            </span>
          </h2>
          <Suspense fallback={<ClosingCallToAction />}>
            <ClosingAction />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
