"use client";

import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  ArrowsCounterClockwiseIcon,
  FacebookLogoIcon,
  GlobeSimpleIcon,
  InstagramLogoIcon,
  TiktokLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
  type Icon,
} from "@phosphor-icons/react";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { VerifiedMark } from "@/components/creator-card/verified-mark";
import { label } from "@/components/convention/section-heading";
import { Flag } from "@/components/creators/flag";
import { Change, RankMove } from "@/components/creators/movement";
import { CardStage, usePodiumCard } from "@/components/creators/podium/stage";
import { WHITE } from "@/components/creators/podium/tiers";
import { CARD_HOME, creatorTypeLabel, type CardSocial } from "@/lib/creator-card";
import { formatCompact, formatCount } from "@/lib/format";
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
   leaderboard.tsx), made of silk in place of a medal's metal, in one
   piece of the palest cyan with a rim of brand cyan. At its head the
   photo, with the creator's place on the leaderboard set large and their
   country's flag across from it; under it who they are, the line about
   their work, the figure and the channels it is read from, over our lion
   embroidered large in the middle.

   What is here is the whole card for a reader: markup and a surface in
   CSS (`podium-surface` in app/globals.css). Where the browser can, the
   stage draws the card's body behind the markup instead and turns the two
   together toward the pointer (components/creators/podium).

   It can be turned over, as a card in the hand is: a click or tap on it
   (anywhere but its links), or the button under it, which is the way for
   a keyboard. The back is brand cyan with our lion large in the middle.
   The stage turns it on a spring, rising toward the eye and tipping back
   a little half way round; with less motion asked for it is simply the
   other way up. Without the scene the markup turns itself in CSS. While
   the card is face down its face is inert, so its links are not reached
   by Tab through a card that is not showing them.

   The head keeps the leaderboard card's measures (the padding above the
   photo and the photo's size), since the arc under the brocade is worked
   out from them in the CSS surface. */
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
  if (text.length === 3) return "text-[2.25rem] min-[25rem]:text-[2.75rem]";
  if (text.length <= 5) return "text-[1.5rem] min-[25rem]:text-[2rem]";
  return "text-[1.1875rem] min-[25rem]:text-[1.625rem]";
}

/** Where a click on the card is meant for something on it, not the card. */
const onSomethingElse = (target: EventTarget) => target instanceof Element && !!target.closest("a, button");

function Card({ card, rank, move, followers, gain, verified, channels, sample = false, controls }: CollectibleCardProps) {
  const { attach, handlers, style, turnOver } = usePodiumCard("own", WHITE);
  const [over, setOver] = useState(false);
  const article = useRef<HTMLElement | null>(null);
  const ref = useCallback(
    (element: HTMLElement | null) => {
      article.current = element;
      return attach(element);
    },
    [attach],
  );
  const turn = () => {
    const next = !over;
    setOver(next);
    if (article.current) turnOver(article.current, next);
  };
  const name = card.displayName.trim();
  const type = creatorTypeLabel(card.creatorType);
  const tagline = card.tagline?.trim();
  const place = rank === null ? null : formatCount(rank);
  const prompt = "text-ink/55";

  return (
    <>
      <article
        ref={ref}
        {...handlers}
        onClick={(event: MouseEvent) => {
          if (!onSomethingElse(event.target)) turn();
        }}
        data-turns
        data-flipped={over || undefined}
        style={style}
        aria-label={CARD_HOME.card.label}
        className="group/lead cursor-pointer"
      >
        {/* What turns: the face and, behind it, the back. Without the
            scene its own CSS turns it (the stage writes the transform
            once the scene draws the card). */}
        <div
          data-podium-body
          className={cn(
            "relative rounded-[1.25rem] [transform-style:preserve-3d]",
            "[:not([data-live])>&]:[transform:perspective(75rem)_rotateY(0deg)]",
            "[[data-flipped]:not([data-live])>&]:[transform:perspective(75rem)_rotateY(180deg)]",
            "motion-safe:[:not([data-live])>&]:transition-transform motion-safe:[:not([data-live])>&]:duration-700 motion-safe:[:not([data-live])>&]:ease-[cubic-bezier(0.3,0.7,0.2,1)]",
          )}
        >
          {/* The face. A card with little on it yet is still the upright
              shape of a card, and the silk it leaves bare is where the
              lion shows. */}
          <div
            data-podium-face
            inert={over}
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
                  <span className={cn("mt-1 block font-display leading-[0.8] tabular-nums podium-numeral", rankSize(place))}>
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
                <p className="font-display text-[2.75rem] leading-none text-ink tabular-nums">{formatCount(followers)}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                  <p className={cn(label, "text-[0.6875rem] text-ink/75")}>followers</p>
                  {!!gain && <Change gain={gain} />}
                  {move && <RankMove row={move} words />}
                </div>
              </div>
            )}

            {(channels.length > 0 || sample) && (
              <ul className="relative mt-6 flex flex-wrap content-start justify-center gap-1.5">
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
          </div>

          {/* The back: brand cyan and our lion. The scene draws it once it
              draws the card; this is what shows until then, and without it. */}
          <div
            data-podium-back
            aria-hidden
            className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <div className="card-back absolute inset-0 flex items-center justify-center rounded-[1.25rem] transition-opacity duration-300 ease-out group-data-[live]/lead:opacity-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoMark.src} alt="" width={530} height={490} className="relative w-2/3" />
            </div>
          </div>
        </div>
      </article>
      {/* The card's own controls, borderless, so they sit apart: the
          glyphs are 1.5rem or more from each other. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <button type="button" onClick={turn} className={cardControl}>
          <ArrowsCounterClockwiseIcon aria-hidden weight="bold" className="size-4" />
          {over ? CARD_HOME.card.front : CARD_HOME.card.turn}
        </button>
        {controls}
      </div>
    </>
  );
}
