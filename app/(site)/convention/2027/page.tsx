import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  GlobeHemisphereEastIcon,
  LightbulbIcon,
  MicrophoneStageIcon,
  SparkleIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react/dist/ssr";
import { AWARD_PHOTOS } from "@/components/awards/photos";
import { ConventionFlyer } from "@/components/convention-flyer";
import {
  ClosingAction,
  ClosingCallToAction,
  RegisterCallToAction,
  RegistrationAction,
} from "@/components/convention/registration-action";
import { SectionHeading, card, cardInner, label, panel, photo } from "@/components/convention/section-heading";
import { ctaLink } from "@/components/events/event-card";
import { InView } from "@/components/home/in-view";
import { Button } from "@/components/ui/button";
import { AWARDS_2027 } from "@/lib/awards-2027";
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
  "rounded-sm font-medium text-foreground underline decoration-foreground/30 decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-150 ease-hover hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/* One mark per part of the programme, in the brand cyan. Hidden from
   assistive tech; the title carries the meaning. */
const ICONS: Record<ProgrammeItem["id"], typeof MicrophoneStageIcon> = {
  journeys: MicrophoneStageIcon,
  dharma: LightbulbIcon,
  tools: SparkleIcon,
  create: VideoCameraIcon,
  network: GlobeHemisphereEastIcon,
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
          footer on the homepage. */}
      <section aria-labelledby="welcome-title" className="border-t border-border bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-6 lg:pt-32">
          {/* Two columns, not five of twelve: the twelve-column grid spent
              its eleven gaps and left the title too narrow for "Share your
              journey." at 48px (about 27rem). 28rem holds it with room. */}
          <div className="grid gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
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
              <p className="max-w-[46ch] text-pretty font-display text-2xl leading-[1.4] text-foreground sm:text-[1.75rem] sm:leading-[1.35]">
                {WELCOME.lede}
              </p>
              <div className="mt-6 max-w-[58ch] space-y-5 text-pretty text-lg leading-[1.6] text-muted-foreground">
                {WELCOME.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-6">
                <Link href={REGISTRATION.previous.href} className={cn(ctaLink, "text-brand-cyan")}>
                  {REGISTRATION.previous.label}
                  <ArrowRightIcon
                    aria-hidden
                    weight="bold"
                    className="size-4 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
                  />
                </Link>
              </p>
            </div>
          </div>

          {/* Registration: the site's white card, split in two.
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
                  className="text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl"
                >
                  {REGISTRATION.title}
                </h2>
                <dl className="mt-8 grid gap-x-8 gap-y-6 text-base leading-[1.5] sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">Dates</dt>
                    <dd className="mt-1.5 text-lg font-medium text-foreground">
                      <time dateTime={CONVENTION_2027.dates.start}>{CONVENTION_2027.dates.label}</time>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">Venue</dt>
                    <dd className="mt-1.5 text-pretty text-lg font-medium text-foreground">{CONVENTION_2027.location}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">Organized by</dt>
                    <dd className="mt-1">
                      <a href={ORGANISER.href} target="_blank" rel="noopener noreferrer" className={detailLink}>
                        {ORGANISER.name}
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-cyan">With the support of</dt>
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
              mark in the brand cyan, and they arrive one after another
              the first time the grid scrolls into view, through the paused
              entrance the homepage illustrations use (.art in globals.css);
              without scripts, or with reduced motion, they simply show or
              fade. */}
          <section aria-labelledby="in-store-title" className="pt-24 lg:pt-32">
            <h2
              id="in-store-title"
              className="text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl"
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
                      <Icon aria-hidden weight="regular" className="size-7 text-brand-cyan" />
                      <h3 className="mt-5 text-balance font-display text-[1.375rem] leading-[1.2] text-foreground">
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

      {/* The awards: last year's Influencer of the Year on stage beside the
          invitation to nominate, leading to the awards page. */}
      <section aria-labelledby="awards-pointer-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-6 lg:pt-32">
          <div className={card}>
            <div className={cn(cardInner, "grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10")}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper-deep">
                <Image
                  src={AWARD_PHOTOS["influencer-of-the-year"].src}
                  alt={AWARD_PHOTOS["influencer-of-the-year"].alt}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 32rem, 100vw"
                  className={cn("size-full object-cover", photo)}
                />
              </div>
              <div className="flex flex-col items-start justify-center px-1 pb-3 sm:px-2 lg:py-4">
                <p className={cn(label, "text-brand-cyan")}>{AWARDS_2027.title}</p>
                <h2
                  id="awards-pointer-title"
                  className="mt-4 text-balance font-display text-4xl leading-[1.06] text-foreground sm:text-5xl"
                >
                  {AWARDS_2027.open ? "Nominations are open" : "The awards"}
                </h2>
                <p className="mt-5 max-w-[46ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
                  Eight awards in three categories, from Influencer of the Year to Best Photography. Tell us which
                  creators deserve them.
                </p>
                <Button
                  size="pill"
                  nativeButton={false}
                  className="mt-7"
                  render={<Link href={AWARDS_2027.path} />}
                >
                  See the awards
                  <ArrowRightIcon data-icon="inline-end" weight="bold" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The invitation to partners, on a quiet sheet like the convention
          pointer on the Get Involved page, and leading to the section of
          that page written for them. */}
      <section aria-labelledby="bring-home-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-24 pb-24 sm:px-6 lg:pt-32 lg:pb-32">
          <div className="grid gap-8 rounded-3xl bg-paper-deep px-6 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:px-12 lg:py-14">
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
              className="shrink-0 justify-self-start"
              render={<Link href={`/get-involved#${PARTNER.id}`} />}
            >
              {BRING_HOME.actionLabel}
              <ArrowRightIcon data-icon="inline-end" weight="bold" />
            </Button>
          </div>
        </div>
      </section>

      {/* The closing sheet, in the homepage mission's recipe: brand cyan,
          the title in the serif, the line that matters in gold italic. The
          footer meets it directly, as the homepage's figures meet the
          mission: cyan onto the darkest cyan, no strip of paper between. */}
      <section
        aria-labelledby="closing-title"
        data-header-tone="dark"
        className={cn(panel, "bg-brand-cyan text-white")}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-28">
          <h2
            id="closing-title"
            className="text-balance font-display text-[clamp(2.75rem,6.2vw,5.5rem)] leading-[1.04]"
          >
            <span className="block">{CLOSING.title[0]}</span>{" "}
            <em className="block italic text-saffron">{CLOSING.title[1]}</em>
          </h2>
          <Suspense fallback={<ClosingCallToAction />}>
            <ClosingAction />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
