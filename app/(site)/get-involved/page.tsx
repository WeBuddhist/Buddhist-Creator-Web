import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ArrowUpRightIcon, EnvelopeSimpleIcon, ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/page-intro";
import { PartnerLogos } from "@/components/partner-logos";
import {
  SectionHeading,
  card,
  cardInner,
  accentButton,
  label,
} from "@/components/convention/section-heading";
import { cn } from "@/lib/utils";
import { CREATOR, GET_INVOLVED_PAGE, PARTNER, SUPPORT, TEAM } from "@/lib/get-involved";
import workshopCamera from "@/public/photos/workshop-camera.webp";

export const metadata: Metadata = {
  title: "Get Involved",
  description: GET_INVOLVED_PAGE.description,
};

/* A card's title, in the serif. */
const cardTitle = "text-balance font-display text-[1.75rem] leading-[1.12] text-foreground";
const cardBody = "mt-3 text-pretty text-base leading-[1.6] text-muted-foreground";

export default function GetInvolvedPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageIntro
        id="get-involved-title"
        eyebrow={GET_INVOLVED_PAGE.eyebrow}
        title={GET_INVOLVED_PAGE.title}
        description={GET_INVOLVED_PAGE.description}
        photo={{
          src: workshopCamera,
          alt: "A young monk and a lay creator laughing over a tablet at a workshop table, a camera on a tripod between them.",
          position: "55% 40%",
        }}
      >
        {/* Jump links to the four audiences. */}
        <nav aria-label="Ways to get involved" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {[CREATOR, PARTNER, SUPPORT, TEAM].map(({ id, eyebrow }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex h-11 items-center rounded-full border border-white/40 px-4.5 text-[0.9375rem] font-medium text-white transition-[background-color,border-color] duration-150 ease-hover hover:border-white hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {eyebrow}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageIntro>

      {/* As a creator */}
      <section id={CREATOR.id} aria-labelledby="creator-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-6 lg:pt-32">
          <SectionHeading
            id="creator-title"
            eyebrow={CREATOR.eyebrow}
            title={CREATOR.title}
            description={CREATOR.description}
          />

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:gap-6">
            {CREATOR.challenges.map(({ title, body, href, image }) => (
              <li key={title} className={card}>
                {/* The whole card is the link; the title carries the
                    new-tab note so it reads out of context. */}
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    cardInner,
                    "group/challenge grid h-full gap-2 p-3 transition-[border-color] duration-150 ease-hover hover:border-brand-cyan/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)]",
                  )}
                >
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-paper-deep sm:aspect-auto sm:h-full">
                    {image ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        placeholder="blur"
                        sizes="(min-width: 640px) 12rem, 100vw"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div aria-hidden className="flex size-full min-h-40 items-center justify-center">
                        <ImageIcon className="size-8 text-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center px-3 pt-3 pb-4 sm:px-4 sm:py-6">
                    <h3 className={cn(cardTitle, "flex items-start gap-2")}>
                      <span className="min-w-0">{title}</span>
                      <span className="sr-only">(opens in new tab)</span>
                      <ArrowUpRightIcon
                        aria-hidden
                        weight="bold"
                        className="mt-1.5 size-5 shrink-0 text-brand-cyan transition-transform duration-150 ease-hover motion-safe:group-hover/challenge:translate-x-0.5 motion-safe:group-hover/challenge:-translate-y-0.5"
                      />
                    </h3>
                    <p className={cardBody}>{body}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>

          {/* Where to go for the convention: a quiet sheet under the cards. */}
          <div className="mt-4 grid gap-6 rounded-3xl bg-paper-deep px-6 py-8 sm:px-8 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:px-10 lg:py-10">
            <div className="max-w-2xl">
              <h3 className="text-balance font-display text-3xl leading-[1.12] text-foreground">
                {CREATOR.programs.title}
              </h3>
              <p className="mt-3 text-pretty text-lg leading-[1.6] text-muted-foreground">{CREATOR.programs.body}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="pill"
                nativeButton={false}
                render={<Link href={CREATOR.programs.actions[0].href} />}
              >
                {CREATOR.programs.actions[0].label}
                <ArrowUpRightIcon data-icon="inline-end" weight="bold" />
              </Button>
              <Button
                variant="outline"
                size="pill"
                nativeButton={false}
                render={<Link href={CREATOR.programs.actions[1].href} />}
              >
                {CREATOR.programs.actions[1].label}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* As an institution or group */}
      <section id={PARTNER.id} aria-labelledby="partner-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-6 lg:pt-32">
          {/* The heading and the way in share the row from lg, so a single
              card never sits beside an empty column; more ways fall into a
              grid of their own. */}
          <div
            className={cn(
              "grid gap-10 lg:gap-12",
              PARTNER.ways.length === 1 && "lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end",
            )}
          >
            <SectionHeading
              id="partner-title"
              eyebrow={PARTNER.eyebrow}
              title={PARTNER.title}
              description={PARTNER.description}
            />

            <ul className={cn("grid gap-4 lg:gap-6", PARTNER.ways.length > 1 && "sm:grid-cols-2")}>
              {PARTNER.ways.map((way) => (
                <li key={way.title} className={card}>
                  {/* A way with a page is the whole card a link, with the
                      arrow the homepage's Find Your Place rows use. */}
                  {way.href ? (
                    <Link
                      href={way.href}
                      className={cn(cardInner, "group/way flex h-full items-center justify-between gap-6 p-6 transition-[border-color] duration-150 ease-hover hover:border-brand-cyan/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-7")}
                    >
                      <div className="min-w-0">
                        <h3 className={cardTitle}>{way.title}</h3>
                        <p className={cardBody}>{way.body}</p>
                      </div>
                      <span
                        aria-hidden
                        className="flex size-12 shrink-0 items-center justify-center rounded-full border border-ink/25 text-foreground transition-[background-color,border-color,color] duration-150 ease-hover group-hover/way:border-brand-cyan group-hover/way:bg-brand-cyan group-hover/way:text-white"
                      >
                        <ArrowRightIcon weight="bold" className="size-5" />
                      </span>
                    </Link>
                  ) : (
                    <div className={cn(cardInner, "flex h-full flex-col p-6 sm:p-7")}>
                      <h3 className={cardTitle}>{way.title}</h3>
                      <p className={cardBody}>{way.body}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 lg:mt-20">
            {/* Heading leads, the action trails, and the logo wall sits
                beneath them on the same left edge. */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <h3 className={cn(label, "text-muted-foreground")}>
                {PARTNER.partnersTitle}
              </h3>
              <Button
                size="pill"
                nativeButton={false}
                className="shrink-0 self-start sm:self-auto"
                render={<a href={PARTNER.action.href} />}
              >
                <EnvelopeSimpleIcon data-icon="inline-start" weight="bold" />
                {PARTNER.action.label}
              </Button>
            </div>

            <PartnerLogos partners={PARTNER.partners} className="mt-8" />
          </div>
        </div>
      </section>

      {/* As an individual */}
      <section id={SUPPORT.id} aria-labelledby="support-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-6 lg:pt-32">
          <SectionHeading
            id="support-title"
            eyebrow={SUPPORT.eyebrow}
            title={SUPPORT.title}
            description={SUPPORT.description}
          />

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:gap-6">
            {SUPPORT.ways.map(({ title, body, action }) => (
              <li key={title} className={card}>
                <div className={cn(cardInner, "flex h-full flex-col p-6 sm:p-7")}>
                  <h3 className={cardTitle}>{title}</h3>
                  <p className={cardBody}>{body}</p>
                  <div className="mt-auto pt-6">
                    <Button
                      variant="outline"
                      size="pill"
                      nativeButton={false}
                      render={<a href={action.href} />}
                    >
                      <EnvelopeSimpleIcon data-icon="inline-start" weight="bold" />
                      {action.label}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Join our team: the page's last word, on a sheet of brand cyan. */}
      <section id={TEAM.id} aria-labelledby="team-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 pt-24 pb-24 sm:px-6 lg:pt-32 lg:pb-32">
          <div data-header-tone="dark" className="grid gap-8 rounded-3xl bg-brand-cyan px-6 py-10 text-white sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:px-12 lg:py-14">
            <SectionHeading
              id="team-title"
              level="h3"
              eyebrow={TEAM.eyebrow}
              title={TEAM.title}
              description={TEAM.description}
              onPanel
            />
            <Button
              size="pill"
              nativeButton={false}
              className={cn(accentButton, "shrink-0 justify-self-start")}
              render={<a href={TEAM.action.href} />}
            >
              <EnvelopeSimpleIcon data-icon="inline-start" weight="bold" />
              {TEAM.action.label}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
