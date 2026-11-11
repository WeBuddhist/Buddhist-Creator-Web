import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  FlowerLotusIcon,
  GlobeHemisphereEastIcon,
  LightbulbIcon,
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
  description: `${CONVENTION_2027.theme} Buddhist creators from around the world gather at ${CONVENTION_2027.location}, ${CONVENTION_2027.dates.label}. Registration is open.`,
};

/* A link in the details card: underlined in the text's own colour. */
const detailLink =
  "rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/* One mark per part of the programme, in the brand colour. Hidden from
   assistive tech; the title carries the meaning. */
const ICONS: Record<ProgrammeItem["id"], typeof MicrophoneStageIcon> = {
  journeys: MicrophoneStageIcon,
  dharma: LightbulbIcon,
  create: VideoCameraIcon,
  practice: FlowerLotusIcon,
  sangha: GlobeHemisphereEastIcon,
};

/* The flyer everyone knows from the homepage opens the page. Under it the
   announcement reads in three steps down one column, each using the full
   width:

   1. The theme, as an editorial split: the title on the left, the lede and
      the welcome on the right, closing on a link to last year's report.
   2. Registration, one wide panel: the facts a reader came for as a
      labelled list, and beside them the one action (applying, or for
      someone with an application, getting back to it).
   3. What the four days hold, as a plain grid of five.

   The invitation to partners and the closing band follow. Both actions
   read the session, so each streams in behind a Suspense boundary whose
   fallback is the visitor's version. */
export default function Convention2027Page() {
  return (
    <main className="flex flex-1 flex-col">
      <ConventionFlyer as="h1" first />

      {/* The illustration's ground meets this hairline, as it meets the
          footer's on the homepage. */}
      <section aria-labelledby="welcome-title" className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
          {/* Two columns, not five of twelve: the twelve-column grid spent
              its eleven gaps and left the title too narrow for "Share your
              journey." at 48px (about 27rem). 28rem holds it with room. */}
          <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <SectionHeading
              id="welcome-title"
              eyebrow={WELCOME.eyebrow}
              title={WELCOME.title.map((line, index) => (
                <span key={line} className="block">
                  {index > 0 && " "}
                  {line}
                </span>
              ))}
            />
            <div className="lg:pt-8">
              <p className="max-w-[46ch] text-pretty text-xl leading-[1.5] text-foreground sm:text-2xl sm:leading-[1.45]">
                {WELCOME.lede}
              </p>
              <div className="mt-6 max-w-[58ch] space-y-5 text-pretty text-lg leading-[1.6] text-muted-foreground">
                {WELCOME.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-6">
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
          </div>

          {/* Registration: the site's double-bordered card, split in two.
              The facts read first; the action sits beside them from `lg`,
              under them before that, with a hairline between the two. */}
          <section aria-labelledby="registration-title" className={cn(card, "mt-16 lg:mt-24")}>
            <div
              className={cn(
                cardInner,
                "grid gap-8 px-5 py-7 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-0 lg:p-10",
              )}
            >
              <div className="lg:pe-10">
                <h2
                  id="registration-title"
                  className="text-balance text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-3xl"
                >
                  {REGISTRATION.title}
                </h2>
                <dl className="mt-8 grid gap-x-8 gap-y-6 text-base leading-[1.5] sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-muted-foreground">Dates</dt>
                    <dd className="mt-1 font-medium text-foreground">
                      <time dateTime={CONVENTION_2027.dates.start}>{CONVENTION_2027.dates.label}</time>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Venue</dt>
                    <dd className="mt-1 text-pretty font-medium text-foreground">{CONVENTION_2027.location}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Organized by</dt>
                    <dd className="mt-1">
                      <a href={ORGANISER.href} target="_blank" rel="noopener noreferrer" className={detailLink}>
                        {ORGANISER.name}
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">With the support of</dt>
                    <dd className="mt-1 text-pretty">
                      <a href={SUPPORTER.href} target="_blank" rel="noopener noreferrer" className={detailLink}>
                        {SUPPORTER.name}
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-border pt-8 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-10">
                <Suspense fallback={<RegisterCallToAction />}>
                  <RegistrationAction />
                </Suspense>
              </div>
            </div>
          </section>

          {/* The programme: five parts of equal weight, so a plain grid
              rather than a sequence. Each sits under a hairline with its
              mark in the brand colour, and they arrive one after another
              the first time the grid scrolls into view, through the paused
              entrance the homepage illustrations use (.art in globals.css);
              without scripts, or with reduced motion, they simply show or
              fade. */}
          <section aria-labelledby="in-store-title" className="pt-16 lg:pt-24">
            <h2
              id="in-store-title"
              className="text-balance text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-3xl"
            >
              {IN_STORE.title}
            </h2>
            <InView className="art mt-8 lg:mt-10">
              <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
                {IN_STORE.items.map(({ id, title, body }, index) => {
                  const Icon = ICONS[id];
                  return (
                    <li
                      key={id}
                      data-animate
                      className="reveal border-t border-border pt-6"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Icon aria-hidden weight="regular" className="size-6 text-brand-cyan" />
                      <h3 className="mt-5 text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                        {title}
                      </h3>
                      <p className="mt-2 max-w-[40ch] text-pretty text-base leading-[1.6] text-muted-foreground">
                        {body}
                      </p>
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
