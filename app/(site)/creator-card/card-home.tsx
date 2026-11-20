import type { ReactNode } from "react";
import Link from "next/link";
import { Caveat } from "next/font/google";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FacebookLogoIcon,
  GlobeSimpleIcon,
  InstagramLogoIcon,
  PencilSimpleIcon,
  TiktokLogoIcon,
  WarningCircleIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { SectionHeading, framedCard, framedCardInner, label } from "@/components/convention/section-heading";
import { CollectibleCard, cardControl } from "@/components/creator-card/collectible-card";
import { ShareCard } from "@/components/creator-card/share-card";
import { Change, RankMove } from "@/components/creators/movement";
import { Button } from "@/components/ui/button";
import {
  AUDIENCE_BANDS,
  CARD_CONTENT_TYPES,
  CARD_EDIT_PATH,
  CARD_FORM,
  CARD_HOME,
  CARD_LANGUAGES,
  CARD_READING,
  cardLabels,
  creatorTypeLabel,
  type CardSocial,
} from "@/lib/creator-card";
import { nextBand, type CardHome, type HomeChannel, type HomeNetwork } from "@/lib/creator-home";
import { CREATORS_LEADERBOARD, CREATORS_PATH } from "@/lib/creators";
import type { CreatorCardStatus } from "@/lib/db/schema";
import { formatCompact, formatCount, formatDate, plural } from "@/lib/format";
import { MISSION_GOAL, MISSION_YEAR } from "@/lib/mission";
import { cn } from "@/lib/utils";

/* The creator's own page, drawn from what lib/creator-home.ts hands over.

   A creator comes here to see themself, so the page opens on where they
   stand: their place on the leaderboard as the title, what the month did
   to it, and beside it their card, the white one of the leaderboard's
   collectible cards. Under the title is their part in the mission: their
   followers inside everybody the network reaches, on the way to the two
   hundred million. Then each channel with its own figure and place, and
   how the creators are spread by audience, with the creator's own band
   marked.

   A card that is with our team, or was sent back, has no place yet: the
   title says where the review stands instead, and the sections that need
   a place are left out. The form is not here. It has its own page
   (./edit), which the buttons here lead to. */

const SOCIAL_ICON: Record<CardSocial, Icon> = {
  youtube: YoutubeLogoIcon,
  instagram: InstagramLogoIcon,
  facebook: FacebookLogoIcon,
  // Douyin has no icon of its own here; its mark is the same note as TikTok's.
  douyin: TiktokLogoIcon,
  tiktok: TiktokLogoIcon,
  x: XLogoIcon,
  website: GlobeSimpleIcon,
};

const LEADERBOARD_HREF = `${CREATORS_PATH}#leaderboard-title`;

const column = "mx-auto w-full max-w-6xl px-5 sm:px-6";
const strong = "font-medium text-foreground";
const inlineLink =
  "rounded-sm font-medium text-brand-cyan underline decoration-brand-cyan/35 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/* The page's opening, the same for every state: on the left the title,
   where the review stands, what there is to say and what to do; on the
   right the card, level with them. The mission runs the full width under
   both. Markup order is reading order: on a phone the card comes after
   the actions and before the mission. */
function Opening({
  title,
  status,
  children,
  card,
  mission,
}: {
  title: ReactNode;
  /** Beside the eyebrow: where the card's review stands. */
  status?: ReactNode;
  /** Under the title: the lede, the figures, the actions. */
  children: ReactNode;
  card: ReactNode;
  mission: ReactNode;
}) {
  return (
    <section aria-labelledby="card-home-title">
      <div className={cn(column, "pt-10 pb-16 lg:pt-16 lg:pb-24")}>
        <div className="grid gap-y-12 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-center lg:gap-x-20">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className={cn(label, "text-brand-cyan")}>{CARD_HOME.eyebrow}</p>
              {status}
            </div>
            <h1
              id="card-home-title"
              className="mt-4 text-balance font-display text-[2.5rem] leading-[1.06] text-foreground sm:text-5xl sm:leading-[1.04] lg:text-[3.5rem]"
            >
              {title}
            </h1>
            {children}
          </div>
          <aside aria-label={CARD_HOME.card.label} className="mx-auto w-full max-w-[23rem]">
            {card}
          </aside>
        </div>
        {mission && <div className="mt-12 lg:mt-16">{mission}</div>}
      </div>
    </section>
  );
}

const lede = "mt-5 max-w-[60ch] text-pretty text-lg leading-[1.6] text-muted-foreground";

function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>;
}

function EditButton({ primary = false, children }: { primary?: boolean; children: ReactNode }) {
  return (
    <Button
      size="pill"
      variant={primary ? "default" : "outline"}
      nativeButton={false}
      render={<Link href={CARD_EDIT_PATH} />}
    >
      <PencilSimpleIcon data-icon="inline-start" weight="bold" />
      {children}
    </Button>
  );
}

/* ---------------------------------------------------------------------- */
/* A creator with a card                                                   */
/* ---------------------------------------------------------------------- */

export function CardHomeView({ home, notice }: { home: CardHome; notice?: ReactNode }) {
  const { status, standing } = home;
  const ranked = status === "approved" && standing !== null;
  const counted = home.channels.some((channel) => channel.audience);
  const step = ranked ? nextBand(home.followers) : null;

  return (
    <>
      <Opening
        title={
          ranked ? (
            <>
              You are ranked <span className="text-brand-cyan">#{formatCount(standing.rank)}</span> of{" "}
              {formatCount(standing.outOf)} creators
            </>
          ) : status === "approved" ? (
            CARD_HOME.approved.title
          ) : (
            CARD_HOME[status].title
          )
        }
        status={<StatusLine status={status} />}
        card={
          <CollectibleCard
            card={home.card}
            rank={ranked ? standing.rank : null}
            move={ranked ? standing : null}
            followers={home.followers}
            gain={home.gain}
            verified={status === "approved"}
            channels={home.channels}
            controls={
              // Where the actions beside the title do not already hold it.
              status === "approved" &&
              (ranked || counted) && (
                <Link href={CARD_EDIT_PATH} className={cardControl}>
                  <PencilSimpleIcon aria-hidden weight="bold" className="size-4" />
                  {CARD_HOME.card.edit}
                </Link>
              )
            }
          />
        }
        mission={home.network && <MissionShare network={home.network} own={ranked ? home.followers : 0} state={status} />}
      >
        {notice}
        {ranked ? (
          <>
            <p className={lede}>
              <Moved standing={standing} />
              {step && (
                <>
                  {" "}
                  <span className={strong}>
                    {formatCount(step.toGo)} more {plural(step.toGo, "follower", "followers")}
                  </span>{" "}
                  {plural(step.toGo, "takes", "take")} you past {formatCompact(step.from)}.
                </>
              )}
            </p>
            <Figures home={home} />
            <Actions>
              <ShareCard version={home.shareVersion} />
              <Button size="pill" variant="outline" nativeButton={false} render={<Link href={LEADERBOARD_HREF} />}>
                {standing.rank > 1 ? CARD_HOME.board : CARD_HOME.boardFirst}
                <ArrowRightIcon data-icon="inline-end" weight="bold" />
              </Button>
            </Actions>
          </>
        ) : status === "approved" ? (
          <>
            <p className={lede}>
              {counted
                ? CREATORS_LEADERBOARD.yours.approved.uncounted
                : CREATORS_LEADERBOARD.yours.approved.unlinked}
            </p>
            <Actions>
              {counted ? (
                <>
                  <ShareCard version={home.shareVersion} />
                  <Button size="pill" variant="outline" nativeButton={false} render={<Link href={LEADERBOARD_HREF} />}>
                    {CARD_HOME.boardFirst}
                  </Button>
                </>
              ) : (
                <EditButton primary>{CARD_HOME.edit}</EditButton>
              )}
            </Actions>
          </>
        ) : status === "pending" ? (
          <>
            <p className={lede}>
              {home.submittedAt && <>Submitted on {formatDate(home.submittedAt)}. </>}
              {CARD_HOME.pending.lede}
            </p>
            <Actions>
              <EditButton>{CARD_HOME.edit}</EditButton>
            </Actions>
          </>
        ) : (
          <>
            <p className={lede}>
              {CARD_HOME.rejected.lede}
              {!home.reviewNote && (
                <>
                  {" "}
                  If you are not sure what to change, write to{" "}
                  <a href={`mailto:${CARD_FORM.contact}`} className={inlineLink}>
                    {CARD_FORM.contact}
                  </a>
                  .
                </>
              )}
            </p>
            {home.reviewNote && (
              <figure className="mt-6 max-w-[58ch] border-s-2 border-brand-maroon/40 ps-4">
                <figcaption className={cn(label, "text-[0.6875rem] text-brand-maroon")}>
                  {CARD_HOME.rejected.note}
                </figcaption>
                <blockquote className="mt-1.5 whitespace-pre-line wrap-anywhere text-base leading-[1.6] text-foreground">
                  {home.reviewNote}
                </blockquote>
              </figure>
            )}
            <Actions>
              <EditButton primary>{CARD_HOME.resubmit}</EditButton>
            </Actions>
          </>
        )}
      </Opening>

      <Channels home={home} />
      {ranked && home.bands && <Bands home={home} bands={home.bands} />}
    </>
  );
}

/* Where the card's review stands, beside the card's label. An icon and
   the word, so colour is not what says it. */
function StatusLine({ status }: { status: CreatorCardStatus }) {
  const { Mark, tone, weight } = {
    approved: { Mark: CheckCircleIcon, tone: "bg-status-accepted-bg text-status-accepted-text", weight: "fill" },
    pending: { Mark: ClockIcon, tone: "bg-status-submitted-bg text-status-submitted-text", weight: "bold" },
    rejected: { Mark: WarningCircleIcon, tone: "bg-status-rejected-bg text-status-rejected-text", weight: "fill" },
  }[status] as { Mark: Icon; tone: string; weight: "fill" | "bold" };
  return (
    <p
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-transparent py-0.5 ps-1.5 pe-2.5 text-[0.8125rem] leading-[1.4] font-medium whitespace-nowrap",
        tone,
      )}
    >
      <Mark aria-hidden weight={weight} className="size-3.5 shrink-0" />
      {CARD_HOME[status].status}
    </p>
  );
}

/** What the month did to the creator's place, as a sentence. */
function Moved({ standing }: { standing: NonNullable<CardHome["standing"]> }) {
  const since = "since last month’s reading";
  if (standing.fresh) return <>This is your first month on the leaderboard.</>;
  if (standing.climbed === null) return <>Your place is counted across all your channels together.</>;
  if (standing.climbed === 0) return <>You have held your place {since}.</>;
  const places = Math.abs(standing.climbed);
  return (
    <>
      You have moved {standing.climbed > 0 ? "up" : "down"}{" "}
      <span className={strong}>
        {formatCount(places)} {plural(places, "place", "places")}
      </span>{" "}
      {since}.
    </>
  );
}

/* The figures under the title: the audience, what the month added to it,
   and the place among the creators of the same country. One, two or three
   of them, as the card has them. */
function Figures({ home }: { home: CardHome }) {
  const cells: { name: string; value: ReactNode; note?: ReactNode }[] = [
    { name: "Followers", value: formatCompact(home.followers), note: "all channels" },
  ];
  if (home.gain) {
    cells.push({
      name: "Since last month",
      value: `${home.gain > 0 ? "+" : "−"}${formatCount(Math.abs(home.gain))}`,
      note: plural(Math.abs(home.gain), "follower", "followers"),
    });
  }
  if (home.inCountry && home.card.country) {
    cells.push({
      name: `In ${home.card.country}`,
      value: `#${formatCount(home.inCountry.rank)}`,
      note: `of ${formatCount(home.inCountry.outOf)} creators`,
    });
  }
  /* One strip of tiles split by hairlines: the strip's own colour shows
     through the 1px gaps. A tile that wraps alone takes the whole row, so
     no gap is ever left showing. */
  return (
    <dl className="mt-8 flex flex-wrap gap-px overflow-hidden rounded-2xl border border-transparent bg-border shadow-border">
      {cells.map(({ name, value, note }) => (
        <div key={name} className="flex min-w-0 flex-1 basis-[8.5rem] flex-col bg-card px-4 py-4 sm:px-5">
          <dt className="text-sm leading-[1.4] text-muted-foreground">{name}</dt>
          <dd className="mt-1.5 font-display text-[1.75rem] leading-[1.1] text-foreground tabular-nums">{value}</dd>
          {note && <dd className="mt-0.5 text-sm leading-[1.4] text-muted-foreground">{note}</dd>}
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------------------- */
/* The mission                                                             */
/* ---------------------------------------------------------------------- */

/* The creator's part in the mission: everybody the network's creators
   reach, against the two hundred million, with the creator's own followers
   marked in gold at the end of what has been reached. The gold mark is
   never narrower than a few pixels, so it shows what it stands for, not
   how much; the sentence above carries the figures.

   A meter, not a progress bar: nothing is loading. Brand cyan measures
   5.3:1 on the panel and muted text 5.2:1. */
export function MissionShare({
  network,
  own,
  state,
}: {
  network: HomeNetwork;
  /** The creator's followers that are counted in the network's; 0 when none are. */
  own: number;
  /** Where the visitor's card stands, or "none" when they have no card. */
  state: CreatorCardStatus | "none";
}) {
  const reached = Math.min(network.followers, MISSION_GOAL);
  const left = MISSION_GOAL - reached;
  const goal = formatCompact(MISSION_GOAL);
  const figure = "font-display text-[1.75rem] leading-none text-brand-cyan tabular-nums";
  return (
    <section
      aria-labelledby="mission-share-title"
      className="grid gap-y-6 rounded-2xl bg-paper-deep px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-x-16"
    >
      <div className="min-w-0">
        <h2 id="mission-share-title" className={cn(label, "text-[0.6875rem] text-brand-cyan")}>
          {CARD_HOME.mission.label}
        </h2>
        <p className="mt-3 max-w-[44ch] text-pretty text-lg leading-[1.55] text-foreground">
          {own > 0 ? (
            <>
              Your <span className={figure}>{formatCompact(own)}</span> {plural(own, "follower is", "followers are")} part
              of the <span className={figure}>{formatCompact(network.followers)}</span> people our creators reach
              together.
            </>
          ) : (
            <>
              The {formatCount(network.creators)} creators in our network reach{" "}
              <span className={figure}>{formatCompact(network.followers)}</span> people together.
            </>
          )}
        </p>
      </div>
      <div className="min-w-0">
        {own > 0 && <YourShare at={(reached / MISSION_GOAL) * 100} share={Math.min(1, own / network.followers)} />}
        <div
          role="meter"
          aria-label={CARD_HOME.mission.meter(goal)}
          aria-valuemin={0}
          aria-valuemax={MISSION_GOAL}
          aria-valuenow={reached}
          aria-valuetext={`${formatCount(reached)} of ${formatCount(MISSION_GOAL)}${
            own > 0 ? `, ${formatCount(own)} of them yours` : ""
          }`}
          className="h-2.5 overflow-hidden rounded-full bg-ink/10"
        >
          {/* The transparent border is what forced-colors mode paints. */}
          <div
            className="flex h-full min-w-3 justify-end overflow-hidden rounded-full border border-transparent bg-brand-cyan"
            style={{ width: `${(reached / MISSION_GOAL) * 100}%` }}
          >
            {own > 0 && (
              <div
                className="h-full min-w-1.5 bg-saffron"
                style={{ width: `${Math.min(1, own / network.followers) * 100}%` }}
              />
            )}
          </div>
        </div>
        <p className="mt-3 text-pretty text-sm leading-[1.5] text-muted-foreground">
          {CARD_HOME.mission.goal(goal, MISSION_YEAR)}{" "}
          {left > 0 ? `${formatCompact(left)} to go.` : "We are there."}
          {own === 0 && state !== "approved" && (
            <> {state === "none" ? CARD_HOME.mission.join : CARD_HOME.mission.waiting}</>
          )}
        </p>
      </div>
    </section>
  );
}

/* A note over the meter, as if written in the margin with a fine pen: a
   thin ink arrow that comes down to the gold end of the bar, where the
   creator's own followers are, with "your contribution" in handwriting at
   its tail. The tip lands on the middle of the gold
   mark, which ends where the cyan does, `at` per cent along, and is the
   creator's share of the cyan wide, never less than 0.375rem. The label reads to the right of the arrow, or to its left once
   the mark is far enough along that it would run off the end; with
   little room either way it takes two lines.

   For the eye only: the meter already says "of them yours" in words. */
/* The pen the note over the mission meter is written in: a handwriting
   face for that one note, by the user's wish (after benji.org's margin
   notes). Nothing else on the site is set in it. */
const hand = Caveat({ subsets: ["latin"], weight: "500" });

function YourShare({ at, share }: { at: number; /** The gold's part of the cyan. */ share: number }) {
  const flip = at > 62;
  // Half the gold mark, and the tip, 0.7rem in from the drawing's edge (11.2 of its 40 units).
  const half = `max(0.1875rem, ${(at * share) / 2}%)`;
  // The note runs from the arrow to the bar's far end and no further, so
  // on a narrow screen the label breaks onto two lines instead.
  const place = flip
    ? { right: `calc(${100 - at}% + ${half} - 0.7rem)`, left: 0 }
    : { left: `calc(${at}% - ${half} - 0.7rem)`, right: 0 };
  return (
    <div aria-hidden className="relative h-14">
      <div className={cn("absolute bottom-0.5 flex items-start gap-1", flip && "flex-row-reverse")} style={place}>
        <svg
          viewBox="0 0 40 52"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("h-13 w-10 shrink-0 text-ink/85", flip && "-scale-x-100")}
        >
          {/* A loose curve from the label down to the bar, a little uneven
              as a pen leaves it, then the head in two strokes. */}
          <path
            pathLength={1}
            className="draw-in"
            d="M37 9.5c-6.2-1.4-13.4.2-18.3 4.6-4.4 4-6.6 9.6-7.6 15.4-.8 4.6-.9 9.5-.4 14.6.2 1.6.4 3.2.6 4.9"
          />
          <path pathLength={1} className="draw-in" style={{ animationDelay: "950ms" }} d="M4.6 42.9c2.5 1.9 4.4 3.8 6.6 6.2" />
          <path pathLength={1} className="draw-in" style={{ animationDelay: "1050ms" }} d="M11.2 49.1c1.4-2.7 3.1-5 5.4-7.3" />
        </svg>
        <span
          className={cn(
            hand.className,
            "-mt-1 min-w-0 text-[1.375rem] leading-[1.05] tracking-normal text-ink/85 lowercase",
            flip && "text-end",
          )}
        >
          {CARD_HOME.mission.yours}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* The channels, and what else the card says                               */
/* ---------------------------------------------------------------------- */

/** A link as it is shown: without its scheme, "www." or a closing slash. */
const shownLink = (link: string) => link.replace(/^https?:\/\/(?:www\.)?/i, "").replace(/\/+$/, "");

/** What there is to say about a channel's reading, when it is not simply
    read: a failure is something for the creator to fix. */
function readingNote(channel: HomeChannel, status: CreatorCardStatus): { text: string; failed?: true } | null {
  if (!channel.audience) return { text: CARD_HOME.channels.uncounted };
  if (channel.check?.status === "not_found" || channel.check?.status === "unreadable") {
    return { text: CARD_READING.failed, failed: true };
  }
  if (channel.followers != null) return null;
  return { text: status === "approved" ? CARD_READING.soon : CARD_READING.onApproval };
}

function Channels({ home }: { home: CardHome }) {
  const { card } = home;
  const type = creatorTypeLabel(card.creatorType);
  const content = cardLabels(CARD_CONTENT_TYPES, card.contentTypes, card.contentTypesOther);
  const languages = cardLabels(CARD_LANGUAGES, card.languages, card.languagesOther);
  const details = type || content.length > 0 || languages.length > 0;
  const rowLabel = "text-xs font-medium text-muted-foreground";

  return (
    <section aria-labelledby="card-channels-title" className="border-t border-border bg-paper-deep/50">
      <div className={cn(column, "py-16 lg:py-24")}>
        <SectionHeading
          id="card-channels-title"
          eyebrow={CARD_HOME.channels.eyebrow}
          title={CARD_HOME.channels.title}
          description={CARD_HOME.channels.description}
          size="h3"
        />
        <div className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-x-16">
          <div className={framedCard}>
            <div className={cn(framedCardInner, "overflow-hidden")}>
              <ul>
                {home.channels.map((channel, index) => (
                  <ChannelRow key={channel.place} channel={channel} status={home.status} first={index === 0} />
                ))}
              </ul>
              {home.followers > 0 && (
                <p className="flex items-baseline justify-between gap-4 border-t border-border bg-brand-cyan/[0.06] px-4 py-4 sm:px-5">
                  <span className="text-[0.9375rem] font-medium text-foreground">{CARD_HOME.channels.total}</span>
                  <span>
                    <span className="font-display text-2xl leading-none text-foreground tabular-nums">
                      {formatCount(home.followers)}
                    </span>{" "}
                    <span className="text-sm text-muted-foreground">followers</span>
                  </span>
                </p>
              )}
            </div>
            {home.readAt && (
              <p className="px-4 pt-3 pb-2 text-sm text-muted-foreground sm:px-5">
                {CARD_HOME.channels.lastRead}{" "}
                <time dateTime={home.readAt} className="font-medium text-foreground">
                  {formatDate(home.readAt)}
                </time>
              </p>
            )}
          </div>

          {details && (
            <section aria-labelledby="card-details-title" className={framedCard}>
              <div className={cn(framedCardInner, "px-5 py-5")}>
                <h3 id="card-details-title" className={cn(label, "text-[0.6875rem] text-brand-cyan")}>
                  {CARD_HOME.card.details}
                </h3>
                <dl className="mt-4 flex flex-col gap-4">
                  {type && (
                    <div>
                      <dt className={rowLabel}>I create as</dt>
                      <dd className="mt-0.5 text-sm leading-[1.5]">{type}</dd>
                    </div>
                  )}
                  {content.length > 0 && (
                    <div>
                      <dt className={rowLabel}>{CARD_HOME.card.creates}</dt>
                      <dd className="mt-1.5">
                        <ul className="flex flex-wrap gap-1.5">
                          {content.map((item) => (
                            <li
                              key={item}
                              className="rounded-[0.8125rem] bg-paper-deep px-2.5 py-1 text-xs leading-[1.3] font-medium wrap-anywhere"
                            >
                              {item}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  {languages.length > 0 && (
                    <div>
                      <dt className={rowLabel}>{CARD_HOME.card.languages}</dt>
                      <dd className="mt-0.5 wrap-anywhere text-sm leading-[1.5]">{languages.join(" · ")}</dd>
                    </div>
                  )}
                </dl>
                <p className="mt-5 border-t border-border pt-4 text-sm">
                  <Link href={CARD_EDIT_PATH} className={cn(inlineLink, "inline-flex min-h-6 items-center gap-1")}>
                    {CARD_HOME.edit}
                    <ArrowRightIcon aria-hidden weight="bold" className="size-3.5" />
                  </Link>
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

/* One of the card's links: where it is, the figure read there and what
   the month did to it, and its place on that channel's own board. On a
   phone the figures sit under the link; from md they trail the row. */
function ChannelRow({ channel, status, first }: { channel: HomeChannel; status: CreatorCardStatus; first: boolean }) {
  const PlaceIcon = SOCIAL_ICON[channel.place];
  const note = readingNote(channel, status);
  const shown = shownLink(channel.link);
  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3.5 px-4 py-4 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-5",
        !first && "border-t border-border",
      )}
    >
      <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-paper-deep text-foreground">
        <PlaceIcon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.9375rem] leading-[1.35] font-medium text-foreground">{channel.label}</p>
        <p className="mt-0.5 text-sm leading-[1.4]">
          <a
            href={channel.link}
            target="_blank"
            // The address was typed by the creator, not by us.
            rel="noopener noreferrer nofollow"
            aria-label={`${channel.label}: ${shown} (opens in new tab)`}
            className="rounded-sm wrap-anywhere text-muted-foreground underline decoration-current/30 underline-offset-4 transition-[color,text-decoration-color] duration-150 ease-hover hover:text-brand-cyan hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <bdi>{shown}</bdi>
          </a>
        </p>
        {note && (
          <p
            className={cn(
              "mt-1.5 flex items-start gap-1.5 text-pretty text-sm leading-[1.45]",
              note.failed ? "text-status-rejected-text" : "text-muted-foreground",
            )}
          >
            {note.failed && <WarningCircleIcon aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0" />}
            {note.text}
          </p>
        )}
      </div>
      {channel.followers != null && channel.audience && (
        <div className="col-start-2 mt-2.5 md:col-start-3 md:mt-0 md:text-right">
          <p>
            <span className="text-base leading-[1.3] font-semibold text-foreground tabular-nums">
              {formatCount(channel.followers)}
            </span>{" "}
            <span className="text-sm text-muted-foreground">{channel.audience.toLowerCase()}</span>
          </p>
          {(!!channel.gain || channel.standing) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 md:justify-end">
              {!!channel.gain && <Change gain={channel.gain} />}
              {channel.standing && (
                <p className="text-sm leading-[1.3] text-muted-foreground tabular-nums">
                  <span className="sr-only">Rank </span>#{formatCount(channel.standing.rank)} of{" "}
                  {formatCount(channel.standing.outOf)}
                </p>
              )}
              {channel.standing && <RankMove row={channel.standing} />}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/* ---------------------------------------------------------------------- */
/* Among all creators                                                      */
/* ---------------------------------------------------------------------- */

/** A share of the creators as it is printed: a whole per cent, and "<1%"
    for a band that is not empty but would round to nothing. */
function shareText(count: number, creators: number) {
  const share = (count / creators) * 100;
  if (count > 0 && share < 0.5) return "<1%";
  return `${Math.round(share)}%`;
}

/* How the creators on the leaderboard are spread by audience, with the
   creator's own band marked: its row is a white card with the "You" tag,
   so the mark is a shape and a word and not only a colour. A bar's length
   is its band's share of the creators; the figure beside it says the same,
   so the bars are for the eye alone. */
function Bands({ home, bands }: { home: CardHome; bands: NonNullable<CardHome["bands"]> }) {
  const own = AUDIENCE_BANDS[bands.own];
  const step = nextBand(home.followers);
  return (
    <section aria-labelledby="card-bands-title" className="border-t border-border bg-background">
      <div className={cn(column, "grid gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-x-16 lg:py-24")}>
        <div className="min-w-0">
          <p className={cn(label, "text-brand-cyan")}>{CARD_HOME.bands.eyebrow}</p>
          <h2
            id="card-bands-title"
            className="mt-4 text-balance font-display text-3xl leading-[1.1] text-foreground sm:text-4xl"
          >
            You are among the {shareText(bands.counts[bands.own], bands.creators)} of creators with {own.phrase}
          </h2>
          <p className="mt-5 max-w-[52ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
            {step ? (
              <>
                <span className={strong}>
                  {formatCount(step.toGo)} more {plural(step.toGo, "follower", "followers")}
                </span>{" "}
                {plural(step.toGo, "takes", "take")} you into the next group.{" "}
              </>
            ) : (
              <>That is the largest group there is. </>
            )}
            {CARD_HOME.bands.description(formatCount(bands.creators))}
          </p>
        </div>
        <ol role="list" className="flex min-w-0 flex-col gap-1.5">
          {AUDIENCE_BANDS.map((band, index) => {
            const count = bands.counts[index];
            const mine = index === bands.own;
            return (
              <li
                key={band.label}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-xl border border-transparent px-4 py-3.5 sm:grid-cols-[9.5rem_minmax(0,1fr)_3.25rem]",
                  mine && "bg-card shadow-border",
                )}
              >
                <p className="text-[0.9375rem] leading-[1.35] font-medium text-foreground">
                  {band.label}
                  {mine && (
                    <span className="ms-2 inline-block rounded-full bg-brand-cyan px-1.5 py-0.5 align-middle text-[0.6875rem] leading-[1.3] font-semibold tracking-[0.08em] whitespace-nowrap text-white uppercase">
                      {CREATORS_LEADERBOARD.yours.you}
                    </span>
                  )}
                </p>
                <span
                  aria-hidden
                  className="col-span-2 row-start-2 h-2.5 overflow-hidden rounded-full bg-ink/10 sm:col-span-1 sm:col-start-2 sm:row-start-1"
                >
                  <span
                    className={cn("block h-full rounded-full", mine ? "bg-saffron" : "bg-brand-cyan", count > 0 && "min-w-1.5")}
                    style={{ width: `${(count / bands.creators) * 100}%` }}
                  />
                </span>
                <p className="text-right text-[0.9375rem] leading-[1.35] font-semibold text-foreground tabular-nums sm:col-start-3">
                  {shareText(count, bands.creators)}
                  <span className="sr-only">
                    {" "}
                    of creators, {formatCount(count)} {plural(count, "creator", "creators")}
                  </span>
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* Somebody with no card yet                                               */
/* ---------------------------------------------------------------------- */

/* The same opening for a person who has no card: what a card is and what
   it brings, the one button that leads to the form, and a sample of the
   card with their own name and picture on it, which is what the form will
   fill in. */
export function NoCardView({
  name,
  picture,
  network,
  notice,
}: {
  name: string | null;
  picture: string | null;
  network: HomeNetwork | null;
  notice?: ReactNode;
}) {
  return (
    <Opening
      title={CARD_HOME.none.title}
      card={
        <>
          <p className={cn(label, "mb-4 text-muted-foreground")}>{CARD_HOME.card.sample}</p>
          <CollectibleCard
            sample
            card={{
              displayName: name ?? "",
              country: null,
              countryCode: null,
              photoUrl: picture,
              creatorType: null,
              tagline: null,
            }}
            rank={null}
            move={null}
            followers={0}
            gain={null}
            verified={false}
            channels={[]}
          />
        </>
      }
      mission={network && <MissionShare network={network} own={0} state="none" />}
    >
      {notice}
      <p className={lede}>{CARD_HOME.none.lede}</p>
      <Actions>
        <Button size="pill" nativeButton={false} render={<Link href={CARD_EDIT_PATH} />}>
          {CARD_HOME.create}
          <ArrowRightIcon data-icon="inline-end" weight="bold" />
        </Button>
        <Button size="pill" variant="outline" nativeButton={false} render={<Link href={LEADERBOARD_HREF} />}>
          {CARD_HOME.boardFirst}
        </Button>
      </Actions>
    </Opening>
  );
}

/* A line about what brought the visitor here (a claim that could not be
   taken, say), between the title and what follows it. */
export function HomeNotice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="mt-6 max-w-[58ch] rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-3.5 text-sm leading-[1.5] text-foreground"
    >
      {children}
    </p>
  );
}
