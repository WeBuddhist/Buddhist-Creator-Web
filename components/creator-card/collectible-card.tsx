"use client";

import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  ArrowsOutSimpleIcon,
  FacebookLogoIcon,
  GlobeSimpleIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
  type Icon,
} from "@phosphor-icons/react";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { CardSeal } from "@/components/creator-card/card-seal";
import { VerifiedMark } from "@/components/creator-card/verified-mark";
import { label } from "@/components/convention/section-heading";
import { Flag } from "@/components/creators/flag";
import { Change, RankMove } from "@/components/creators/movement";
import { CardStage, usePodiumCard } from "@/components/creators/podium/stage";
import { WHITE } from "@/components/creators/podium/tiers";
import { CARD_HOME, creatorTypeLabel, type CardSocial } from "@/lib/creator-card";
import { formatCompact, formatCount, formatFigure, isShortened } from "@/lib/format";
import { cn } from "@/lib/utils";
import logoMark from "@/assets/logo-mark-white.png";

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

/** A borderless control in the row under the card. */
export const cardControl = cn(
  "flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-medium text-brand-cyan",
  "transition-[background-color] duration-150 ease-hover hover:bg-brand-cyan/[0.08]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

const chip = "inline-flex h-8 items-center gap-1.5 rounded-full border border-ink/15 bg-white/70 text-[0.8125rem] font-medium text-ink tabular-nums";

export type CollectibleChannel = {
  place: CardSocial;
  label: string;
  link: string;
  /** The audience read there; null where no count is kept, or none is yet. */
  followers: number | null;
};

export type CollectibleCardProps = {
  card: {
    displayName: string;
    country: string | null;
    countryCode: string | null;
    photoUrl?: string | null;
    creatorType: string | null;
    tagline: string | null;
  };
  /** The card's place on the board of all channels; null when it has none. */
  rank: number | null;
  /** What the month did to that place. */
  move: { climbed: number | null; fresh: boolean } | null;
  /** The followers of all counted channels together. */
  followers: number;
  gain: number | null;
  /** Our team has approved the card as it stands. */
  verified: boolean;
  channels: CollectibleChannel[];
  /** A card nobody has made yet: what is missing shows as a prompt. */
  sample?: boolean;
  /** More controls for the card, in the row under it after the turn. */
  controls?: ReactNode;
  className?: string;
};

/* The card every creator has, on their own page: the leaderboard's card
   for the first three places (LeadCard in components/creators/
   leaderboard.tsx) in brand cyan in place of a medal's metal: a pale sky
   full of clouds at its head, clearing to a pearl satin, inside a rim of
   brand cyan. At its head the photo, lit from behind, with the creator's
   place on the leaderboard set large and their country's flag across
   from it; under it who they are, the line about their work, the figure
   and the channels it is read from; and in the bottom corner our lion on
   a small seal of holographic foil (CardSeal), whose colours run as the
   card leans to the pointer.

   What is here is the whole card for a reader: markup and a surface in
   CSS (`podium-surface` in app/globals.css). Where the browser can, the
   stage draws the card's body behind the markup instead and turns the two
   together toward the pointer (components/creators/podium).

   It can be picked up, as a card in a collection is: a click or tap on it
   (anywhere but its links) brings it forward to the middle of the screen,
   larger, spinning once round on its way, so its back is seen as it
   comes: brand cyan cloth with the same clouds woven into it and our lion
   large in the middle, in a light of its own. The page behind is shaded
   meanwhile. A click on the card or on the shade, Escape, or the page
   being scrolled or resized sends it back the same way. The stage moves
   it on a spring (components/creators/podium/store.ts), with the scene
   or without. It shows nothing the card in its place does not, so there
   is no button for it on the page; a keyboard has one, under the card,
   that is seen when it is reached.

   The head keeps the leaderboard card's measures (the padding above the
   photo and the photo's size), since the sky, its clouds and the light
   behind the photo are laid out from them in the CSS surface. */
export function CollectibleCard(props: CollectibleCardProps) {
  return (
    <CardStage className={props.className}>
      <Card {...props} />
    </CardStage>
  );
}

/** The place, sized by how long it is as printed ("1,204" is five): it has
    the room beside the photo, which on a phone is a little under four rem. */
function rankSize(text: string) {
  if (text.length <= 2) return "text-[3.25rem]";
  if (text.length === 3) return "text-[2rem] min-[25rem]:text-[2.75rem]";
  if (text.length <= 5) return "text-[1.5rem] min-[25rem]:text-[2rem]";
  return "text-[1.1875rem] min-[25rem]:text-[1.625rem]";
}

/** Where a click on the card is meant for something on it, not the card. */
const onSomethingElse = (target: EventTarget) => target instanceof Element && !!target.closest("a, button");

function Card({ card, rank, move, followers, gain, verified, channels, sample = false, controls }: CollectibleCardProps) {
  const { attach, handlers, style, bring } = usePodiumCard("own", WHITE);
  const [near, setNear] = useState(false);
  const article = useRef<HTMLElement | null>(null);
  const ref = useCallback(
    (element: HTMLElement | null) => {
      article.current = element;
      return attach(element);
    },
    [attach],
  );
  const carry = useCallback(
    (next: boolean) => {
      setNear(next);
      if (article.current) bring(article.current, next);
    },
    [bring],
  );
  /* What sends a card back besides a click: Escape, and the page moving
     under it. It is the ref of an element that is there only while the
     card is forward, so it listens only then. */
  const untilAway = useCallback(
    (marker: HTMLElement | null) => {
      if (!marker) return;
      const away = () => carry(false);
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") away();
      };
      window.addEventListener("keydown", onKey);
      window.addEventListener("scroll", away, { passive: true });
      window.addEventListener("resize", away);
      return () => {
        window.removeEventListener("keydown", onKey);
        window.removeEventListener("scroll", away);
        window.removeEventListener("resize", away);
      };
    },
    [carry],
  );
  const name = card.displayName.trim();
  const type = creatorTypeLabel(card.creatorType);
  const tagline = card.tagline?.trim();
  const place = rank === null ? null : formatCount(rank);
  const prompt = "text-ink/55";

  return (
    <>
      {/* The shade over the page behind a card that has come forward. The
          stage sets how dark it is as the card comes and goes. */}
      <div
        data-podium-veil
        aria-hidden
        onClick={() => carry(false)}
        className={cn("fixed inset-0 bg-ink/60 opacity-0", near ? "cursor-zoom-out" : "pointer-events-none")}
      />
      {near && <span ref={untilAway} hidden />}
      <article
        ref={ref}
        {...handlers}
        onClick={(event: MouseEvent) => {
          if (!onSomethingElse(event.target)) carry(!near);
        }}
        data-turns
        style={style}
        aria-label={CARD_HOME.card.label}
        className={cn("group/lead relative z-[1]", near ? "cursor-zoom-out" : "cursor-zoom-in")}
      >
        {/* What turns: the face and, behind it, the back. */}
        <div data-podium-body className="relative rounded-[1.25rem] [transform-style:preserve-3d]">
          {/* The face. A card with little on it yet is still the upright
              shape of a card. */}
          <div
            data-podium-face
            className="relative min-h-[26rem] px-5 pt-5 pb-9 text-center [backface-visibility:hidden]"
          >
            <div
              aria-hidden
              data-plain
              className="podium-surface absolute inset-0 rounded-[1.25rem] transition-opacity duration-300 ease-out group-data-[live]/lead:opacity-0"
            />
            <div className="relative flex justify-center pt-4">
              {place && (
                <p className="absolute top-0 left-1.5 text-left">
                  <span className={cn(label, "block text-[0.6875rem] text-ink/75")}>{CARD_HOME.card.rank}</span>
                  <span className={cn("mt-1 block font-display leading-[0.8] text-brand-cyan tabular-nums", rankSize(place))}>
                    {place}
                  </span>
                </p>
              )}
              {card.countryCode && <Flag code={card.countryCode} className="absolute top-1.5 right-1.5" />}
              {/* Flat on the face, as everything on this card is: the photo
                  takes the rim's brand cyan as a border of its own, inside its
                  box, so the head keeps the measures the crown is drawn from. */}
              <div data-podium-photo className="relative rounded-full">
                <CardPhoto
                  src={card.photoUrl}
                  size="card"
                  name={sample ? undefined : name}
                  className="border-[0.25rem] border-brand-cyan"
                />
                {/* Centred on the circle's edge, lower right. */}
                {verified && <VerifiedMark className="absolute right-0.5 bottom-0.5" />}
              </div>
            </div>

            <div className="relative mt-5 min-w-0">
              {type && <p className={cn(label, "text-[0.6875rem] text-brand-cyan")}>{type}</p>}
              <p className={cn("text-balance wrap-anywhere font-display text-2xl leading-[1.2] text-ink", type && "mt-1.5")}>
                {name ? <bdi>{name}</bdi> : <span className={prompt}>Your name</span>}
              </p>
              {(card.country || sample) && (
                <p className="mt-1 text-sm leading-[1.4] text-ink/75">
                  {card.country ?? <span className={prompt}>Your country</span>}
                </p>
              )}
              {(tagline || sample) && (
                <p className="mx-auto mt-3 max-w-[34ch] text-pretty wrap-anywhere text-[0.9375rem] leading-[1.5] text-ink/85">
                  {tagline || <span className={prompt}>One line about your work</span>}
                </p>
              )}
            </div>

            {followers > 0 && (
              <div className="relative mt-6">
                {/* As on the leaderboard's cards: the figure to read at a
                    glance, and under it the whole count wherever the
                    figure is a short one. */}
                <p
                  aria-hidden={isShortened(followers) || undefined}
                  className="font-display text-[2.75rem] leading-none text-ink tabular-nums"
                >
                  {formatFigure(followers)}
                </p>
                <p className={cn(label, "mt-2 text-[0.6875rem] text-ink/75 tabular-nums")}>
                  {isShortened(followers) && `${formatCount(followers)} `}
                  followers
                </p>
                {/* As on the leaderboard's cards: what the week did, on a
                    line of its own and in words. */}
                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 empty:hidden">
                  {!!gain && <Change gain={gain} since="always" quiet="text-ink/75" />}
                  {move && <RankMove row={move} words />}
                </div>
              </div>
            )}

            {(channels.length > 0 || sample) && (
              // Clear of the seal in the corner, and by as much on the other
              // side, so the channels stay in the card's middle.
              <ul className="relative mt-6 flex flex-wrap content-start justify-center gap-1.5 px-12">
                {sample && channels.length === 0 && (
                  <li className={cn("text-sm leading-8", prompt)}>Your channels</li>
                )}
                {channels.map((channel) => {
                  const PlaceIcon = SOCIAL_ICON[channel.place];
                  const figure = channel.followers ? formatCompact(channel.followers) : null;
                  const where = channel.place === "website" ? "website" : `on ${channel.label}`;
                  return (
                    <li key={channel.place}>
                      <a
                        href={channel.link}
                        target="_blank"
                        // The address was typed by the creator, not by us.
                        rel="noopener noreferrer nofollow"
                        aria-label={`${name} ${where}${figure ? `, ${formatCount(channel.followers ?? 0)} followers` : ""} (opens in new tab)`}
                        className={cn(
                          chip,
                          figure ? "px-2.5" : "w-8 justify-center",
                          "transition-[border-color,color,background-color] duration-150 ease-hover hover:border-brand-cyan hover:bg-white hover:text-brand-cyan",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                        )}
                      >
                        <PlaceIcon aria-hidden className="size-4" />
                        {figure}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* The seal, as far in from the card's right and bottom edges
                as lib/card-seal.ts says (SEAL). */}
            <CardSeal className="right-4 bottom-4 size-11" />
          </div>

          {/* The back, seen as the card spins: brand cyan and our lion. The
              scene draws it once it draws the card; this is what shows
              until then, and without it. */}
          <div
            data-podium-back
            aria-hidden
            className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <div className="card-back absolute inset-0 flex items-center justify-center rounded-[1.25rem] transition-opacity duration-300 ease-out group-data-[live]/lead:opacity-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoMark.src}
                alt=""
                width={530}
                height={490}
                className="relative w-2/3 [filter:drop-shadow(0_0_0.75rem_rgb(107_204_235/0.55))]"
              />
            </div>
          </div>
        </div>
      </article>
      {/* Under the card: what the page gives it (Edit), and the way for
          a keyboard to bring it forward, which is seen once it is
          reached. Borderless, so they sit apart. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <button
          type="button"
          aria-pressed={near}
          onClick={() => carry(!near)}
          className={cn(cardControl, "sr-only focus-visible:not-sr-only focus-visible:flex")}
        >
          <ArrowsOutSimpleIcon aria-hidden weight="bold" className="size-4" />
          {near ? CARD_HOME.card.away : CARD_HOME.card.near}
        </button>
        {controls}
      </div>
    </>
  );
}
