import { InstagramLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import masterclassCircle from "@/public/photos/masterclass-circle.webp";
import Image from "next/image";
import { SectionHeading, card, cardInner, photo } from "@/components/convention/section-heading";
import { LightningTalks } from "@/components/convention/lightning-talks";
import { COMMUNITY_DAYS, PROGRAM } from "@/lib/convention-2026";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function Program() {
  return (
    <section aria-labelledby="program-title" className="bg-background">
      {/* No bottom padding: the phase sections below belong to this heading,
          so the gap to Phase 1 is a group gap, not a section gap. */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-6 lg:pt-32">
        <SectionHeading
          id="program-title"
          eyebrow={PROGRAM.eyebrow}
          title={PROGRAM.title}
          description={PROGRAM.description}
        />
      </div>
    </section>
  );
}

function InstagramLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-brand-cyan underline decoration-foreground/30 decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-150 ease-hover hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    >
      <InstagramLogoIcon aria-hidden weight="bold" className="size-4" />
      {children}
      <span className="sr-only">(Instagram, opens in new tab)</span>
    </a>
  );
}

/* Phase 1 in detail. Each block is a label column beside its content, so
   the eye runs down one shared edge instead of a stack of cards. */
export function CommunityDays() {
  const { opening, keynotes, panel, lightningTalks, why, circles } = COMMUNITY_DAYS;

  return (
    <section aria-labelledby="community-days-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-16 sm:px-6 lg:pt-16 lg:pb-24">
        <SectionHeading
          id="community-days-title"
          level="h3"
          eyebrow="Phase 1 · 29 – 30 January"
          title="Community days and opening ceremony"
          description="Two days to arrive, meet, and set the intention for the week: an opening ceremony, keynotes, a panel, 27 lightning talks and seven community circles."
        />

        <figure className="mt-12 lg:mt-16">
          <Image
            src={masterclassCircle}
            alt="A coach talking with monastics in maroon robes and lay creators standing around the tables of a workshop room."
            placeholder="blur"
            sizes="(min-width: 1152px) 72rem, 100vw"
            className={cn("aspect-[3/2] w-full rounded-2xl object-cover sm:aspect-[21/9]", photo)}
            style={{ objectPosition: "60% 35%" }}
          />
          <figcaption className="mt-3 text-sm text-muted-foreground">Convention 2026, Bodh Gaya.</figcaption>
        </figure>

        <div className="mt-12 flex flex-col gap-12 lg:mt-16 lg:gap-16">
          <Block title={opening.title}>
            <p className="max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
              {opening.body}
            </p>
          </Block>

          <Block title="Keynote addresses">
            {/* Speakers as a disclosure list with the first open, so the
                names scan as one column and each address reads on demand. */}
            <Accordion defaultValue={[keynotes[0].name]} className="-mt-4">
              {keynotes.map(({ name, role, body, videoHref }) => (
                <AccordionItem key={name} value={name}>
                  <AccordionTrigger>
                    <span className="flex flex-col">
                      <span className="font-medium text-foreground">{name}</span>
                      <span className="mt-0.5 text-sm text-muted-foreground">{role}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="max-w-[58ch] text-pretty text-sm leading-[1.5] text-muted-foreground">
                      {body}
                    </p>
                    {videoHref && (
                      <InstagramLink href={videoHref} className="mt-3">
                        Watch the video message
                      </InstagramLink>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Block>

          <Block title="Panel discussion">
            <h5 className="text-balance font-display text-[1.75rem] leading-[1.12] text-foreground">
              {panel.title}
            </h5>
            <p className="mt-2 text-sm text-muted-foreground">
              Moderated by {panel.moderator}, with {listNames(panel.panelists)}.
            </p>
            <p className="mt-4 max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
              {panel.body}
            </p>
            <InstagramLink href={panel.videoHref} className="mt-4">
              Watch the panel discussion
            </InstagramLink>
          </Block>

          <Block title={lightningTalks.title} meta={lightningTalks.subtitle}>
            <p className="max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
              {lightningTalks.body}
            </p>
            <LightningTalks />
          </Block>

          <Block title={why.title}>
            <p className="font-medium text-foreground">{why.speaker}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{why.role}</p>
            <p className="mt-4 max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
              {why.body}
            </p>
          </Block>

          <Block title={circles.title} meta={circles.subtitle}>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {circles.themes.map(({ title, question }, index) => (
                <li key={title} className={card}>
                  <div className={cn(cardInner, "h-full p-5")}>
                    <p className="flex items-start gap-3 font-display text-[1.375rem] leading-[1.2] text-foreground">
                      <CircleMark tone={index} />
                      {title}
                    </p>
                    <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                      {question}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Block>
        </div>
      </div>
    </section>
  );
}

/* Decorative dot before each circle's name, alternating the brand's cyan
   and gold. Hidden from assistive tech; it carries no meaning. */
const TONES = ["bg-brand-cyan", "bg-saffron"] as const;

function CircleMark({ tone }: { tone: number }) {
  return (
    <span aria-hidden className={cn("mt-2.5 size-2 shrink-0 rounded-full", TONES[tone % TONES.length])} />
  );
}

function Block({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 border-t border-border pt-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10 lg:pt-8">
      <div>
        <h4 className="text-balance font-display text-2xl leading-[1.15] text-foreground">{title}</h4>
        {meta && <p className="mt-1.5 text-sm text-muted-foreground">{meta}</p>}
      </div>
      <div className={cn("min-w-0")}>{children}</div>
    </div>
  );
}

function listNames(names: readonly string[]) {
  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(names);
}
