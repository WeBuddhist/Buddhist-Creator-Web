import { cn } from "@/lib/utils";
import { SectionHeading, card, cardInner } from "@/components/convention/section-heading";
import { COMMUNITY_DAYS, PROGRAM } from "@/lib/convention-2026";

export function Program() {
  return (
    <section aria-labelledby="program-title" className="bg-background">
      {/* No bottom padding: the phase sections below belong to this heading,
          so the gap to Phase 1 is a group gap, not a section gap. */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
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
          title="Community Days & Opening Ceremony"
          description="Two days to arrive, meet, and set the intention for the week: an opening ceremony, keynotes, a panel, 27 lightning talks and seven community circles."
        />

        <div className="mt-12 flex flex-col gap-12 lg:mt-16 lg:gap-16">
          <Block title={opening.title}>
            <p className="max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
              {opening.body}
            </p>
          </Block>

          <Block title="Keynote Addresses">
            <ul className="grid gap-4 sm:grid-cols-2">
              {keynotes.map(({ name, role, body }) => (
                <li key={name} className={card}>
                  <div className={cn(cardInner, "h-full px-4 pt-4 pb-5 sm:px-5")}>
                    <p className="font-semibold text-foreground">{name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{role}</p>
                    <p className="mt-3 text-pretty text-sm leading-[1.5] text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Panel Discussion">
            <h5 className="text-balance text-xl font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
              {panel.title}
            </h5>
            <p className="mt-2 text-sm text-muted-foreground">
              Moderated by {panel.moderator}, with {listNames(panel.panelists)}.
            </p>
            <p className="mt-4 max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
              {panel.body}
            </p>
          </Block>

          <Block title={lightningTalks.title} meta={lightningTalks.subtitle}>
            <p className="max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
              {lightningTalks.body}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Rooms">
              {lightningTalks.rooms.map((room) => (
                <li
                  key={room}
                  className="rounded-full border border-transparent bg-card px-3 py-1 text-sm font-medium text-foreground shadow-ring"
                >
                  {room}
                </li>
              ))}
            </ul>
          </Block>

          <Block title={why.title}>
            <p className="font-semibold text-foreground">{why.speaker}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{why.role}</p>
            <p className="mt-4 max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
              {why.body}
            </p>
          </Block>

          <Block title={circles.title} meta={circles.subtitle}>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {circles.themes.map(({ title, question }, index) => (
                <li key={title} className={card}>
                  <div className={cn(cardInner, "h-full px-4 pt-4 pb-5 sm:px-5")}>
                    <p className="flex items-start gap-2.5 font-semibold text-foreground">
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

/* Decorative disc before each circle's name: a 10px dot in a 20px halo of
   the same colour, the marker recipe from the homepage stats illustrations.
   Tones step through the brand ramp (cyan, its light step, golden) rather
   than adding new hues. Hidden from assistive tech; it carries no meaning. */
const TONES = [
  { dot: "bg-brand-cyan", halo: "bg-brand-cyan/15" },
  { dot: "bg-brand-golden", halo: "bg-brand-golden/20" },
  { dot: "bg-brand-light-cyan", halo: "bg-brand-light-cyan/15" },
  { dot: "bg-brand-cyan/70", halo: "bg-brand-cyan/10" },
  { dot: "bg-brand-golden/80", halo: "bg-brand-golden/15" },
  { dot: "bg-brand-light-cyan/70", halo: "bg-brand-light-cyan/10" },
  { dot: "bg-brand-cyan", halo: "bg-brand-cyan/15" },
] as const;

function CircleMark({ tone }: { tone: number }) {
  const { dot, halo } = TONES[tone % TONES.length];
  return (
    <span
      aria-hidden
      className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", halo)}
    >
      <span className={cn("size-2.5 rounded-full", dot)} />
    </span>
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
    <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <div>
        <h4 className="text-base font-semibold text-foreground">{title}</h4>
        {meta && <p className="mt-0.5 text-sm text-muted-foreground">{meta}</p>}
      </div>
      <div className={cn("min-w-0")}>{children}</div>
    </div>
  );
}

function listNames(names: readonly string[]) {
  return new Intl.ListFormat("en", { style: "long", type: "conjunction" }).format(names);
}
