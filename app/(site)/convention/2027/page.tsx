import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRightIcon, CalendarBlankIcon, HandshakeIcon, MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import { ConventionFlyer } from "@/components/convention-flyer";
import { RegisterCallToAction, RegistrationAction } from "@/components/convention/registration-action";
import { SectionHeading, card, cardInner } from "@/components/convention/section-heading";
import { ctaLink } from "@/components/events/event-card";
import { cn } from "@/lib/utils";
import { CONVENTION_2027, HOSTS, REGISTRATION, WELCOME } from "@/lib/convention-2027";

export const metadata: Metadata = {
  title: CONVENTION_2027.title,
  description: `${CONVENTION_2027.dates.label} at ${CONVENTION_2027.location}, co-hosted by WeBuddhist and the Nagarjuna Training Institute, Nagaloka. Registration is open.`,
};


/* A link in the details card: underlined in the text's own colour. */
const detailLink =
  "rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/* The flyer everyone knows from the homepage opens the page, then the
   announcement: the welcome copy on the left, and on the right one card
   holding the facts a reader came for and the one action: registering,
   or for someone with an application, getting back to it. That action
   reads the session, so it streams in behind a Suspense boundary whose
   fallback is the visitor's register button. */
export default function Convention2027Page() {

  return (
    <main className="flex flex-1 flex-col">
      <ConventionFlyer as="h1" first />

      {/* The illustration's ground meets this hairline, as it meets the
          footer's on the homepage. */}
      <section aria-labelledby="welcome-title" className="border-t border-border bg-background">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-16 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-16 lg:pt-24 lg:pb-24">
          <div>
            <SectionHeading
              id="welcome-title"
              eyebrow={WELCOME.eyebrow}
              title={WELCOME.title}
            />
            <div className="mt-6 max-w-[58ch] space-y-5 text-pretty text-lg leading-[1.6] text-muted-foreground">
              {WELCOME.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* The details card: the same double-bordered surface as the
              site's other cards, sticky beside the copy once the two sit
              side by side. */}
          <aside aria-labelledby="registration-title" className={cn(card, "lg:sticky lg:top-[calc(var(--header-height)+1.5rem)]")}>
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
                  <dt className="sr-only">Co-hosts</dt>
                  <HandshakeIcon aria-hidden className="mt-1 size-4 shrink-0" />
                  <dd className="text-pretty">
                    Co-hosted by{" "}
                    {HOSTS.map(({ name, href }, index) => (
                      <span key={name}>
                        {index > 0 && " and "}
                        <a href={href} target="_blank" rel="noopener noreferrer" className={detailLink}>
                          {name}
                          <span className="sr-only"> (opens in new tab)</span>
                        </a>
                      </span>
                    ))}
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
        </div>
      </section>
    </main>
  );
}
