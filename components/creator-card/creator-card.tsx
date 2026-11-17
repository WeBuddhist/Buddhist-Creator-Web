import {
  FacebookLogoIcon,
  GlobeSimpleIcon,
  InstagramLogoIcon,
  MapPinIcon,
  TiktokLogoIcon,
  UsersIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import type * as React from "react";
import {
  framedCard,
  framedCardInner,
  label,
} from "@/components/convention/section-heading";
import { CardPhoto } from "@/components/creator-card/card-photo";
import { VerifiedMark } from "@/components/creator-card/verified-mark";
import {
  CARD_CONTENT_TYPES,
  CARD_LANGUAGES,
  cardLabels,
  cardLinks,
  creatorTypeLabel,
  type CardContent,
  type CardSocial,
} from "@/lib/creator-card";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

const SOCIAL_ICON: Record<CardSocial, Icon> = {
  youtube: YoutubeLogoIcon,
  instagram: InstagramLogoIcon,
  facebook: FacebookLogoIcon,
  tiktok: TiktokLogoIcon,
  x: XLogoIcon,
  website: GlobeSimpleIcon,
};

const rowLabel = "text-xs font-medium text-muted-foreground";
const linkChip =
  "inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground";

/* The creator card: who the creator is, where they are, where to find
   them and what they make. It wears the double border: a muted frame
   around the white surface. On the surface, top left, the creator's photo
   as a circle, with our verification mark on its edge once the team has
   approved the card; top right, room for one action (the directory's
   "claim this card"). Under them, in this order: the name in the serif,
   the country and how many people follow the creator in all their counted
   places together, the links, and the line about their work.

   What a creator adds beyond that (how they create, what kinds of content,
   which languages) follows under a rule, so a card with only the four
   lines above is whole as it is.

   Anything the card does not have is left out, so a card the team made
   from a name and a country is still a whole card. With `preview`, as
   beside the form, each missing part shows what will go there instead,
   and the links are drawn but not live: what is typed in a field is not a
   checked address yet.

   No "use client": it renders on the server in the dashboard and in the
   browser beside the form. */
export function CreatorCard({
  card,
  preview = false,
  verified = false,
  action,
  className,
}: {
  card: CardContent;
  preview?: boolean;
  /** The team has approved this card as it stands. */
  verified?: boolean;
  /** One control for the card's top right corner. */
  action?: React.ReactNode;
  className?: string;
}) {
  const name = card.displayName.trim();
  const type = creatorTypeLabel(card.creatorType);
  const tagline = card.tagline?.trim();
  const languages = cardLabels(
    CARD_LANGUAGES,
    card.languages,
    card.languagesOther,
  );
  const content = cardLabels(
    CARD_CONTENT_TYPES,
    card.contentTypes,
    card.contentTypesOther,
  );
  const links = cardLinks(card.socials);
  const followers = card.totalFollowers ?? 0;
  const blank = (text: string) =>
    preview ? <span className="text-muted-foreground/70">{text}</span> : null;

  return (
    <article className={cn(framedCard, "flex flex-col text-foreground", className)}>
      <div className={cn(framedCardInner, "flex flex-1 flex-col p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <div className="relative shrink-0">
            <CardPhoto
              src={card.photoUrl}
              size="card"
              // Beside the form an empty circle keeps the figure: it
              // stands for a photo still to be chosen.
              name={preview ? undefined : name}
            />
            {/* Centred on the circle's edge, lower right. */}
            {verified && <VerifiedMark className="absolute right-0.5 bottom-0.5" />}
          </div>
          {action}
        </div>

        {(type || preview) && (
          <p
            className={cn(
              label,
              "mt-5",
              type ? "text-brand-cyan" : "text-muted-foreground/70",
            )}
          >
            {type ?? "I create as"}
          </p>
        )}
        <h3
          className={cn(
            "text-balance wrap-anywhere font-display text-[1.625rem] leading-[1.15]",
            type || preview ? "mt-1.5" : "mt-5",
          )}
        >
          {name || blank("Your name")}
        </h3>
        {/* One line while there is room; a long country puts the
            followers on the next. */}
        {(card.country || followers > 0 || preview) && (
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {(card.country || preview) && (
              <span className="flex min-w-0 items-center gap-1.5">
                <MapPinIcon
                  aria-hidden
                  weight="bold"
                  className="size-4 shrink-0"
                />
                <span className="min-w-0 wrap-anywhere">
                  {card.country || blank("Your country")}
                </span>
              </span>
            )}
            {followers > 0 && (
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <UsersIcon
                  aria-hidden
                  weight="bold"
                  className="size-4 shrink-0"
                />
                <span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatCount(followers)}
                  </span>{" "}
                  {followers === 1 ? "follower" : "followers"}
                </span>
              </span>
            )}
          </p>
        )}

        {(links.length > 0 || preview) && (
          <div className="mt-4">
            {links.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {links.map(({ value, label: site, url }) => {
                  const SocialIcon = SOCIAL_ICON[value];
                  const where =
                    value === "website" ? "website" : `on ${site}`;
                  return (
                    <li key={value}>
                      {preview ? (
                        <span className={linkChip}>
                          <SocialIcon
                            aria-hidden
                            className="size-[1.125rem]"
                          />
                          <span className="sr-only">{site}</span>
                        </span>
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          // The address was typed by the creator, not by us.
                          rel="noopener noreferrer nofollow"
                          aria-label={`${name} ${where} (opens in new tab)`}
                          className={cn(
                            linkChip,
                            "transition-[border-color,color] duration-150 ease-hover hover:border-brand-cyan hover:text-brand-cyan",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          )}
                        >
                          <SocialIcon
                            aria-hidden
                            className="size-[1.125rem]"
                          />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm">{blank("Your links")}</p>
            )}
          </div>
        )}

        {(tagline || preview) && (
          <p className="mt-4 text-pretty wrap-anywhere text-[0.9375rem] leading-[1.5]">
            {tagline || blank("One line about your work")}
          </p>
        )}

        {(content.length > 0 || languages.length > 0 || preview) && (
          <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
            {(content.length > 0 || preview) && (
              <div>
                <dt className={rowLabel}>Creates</dt>
                <dd className="mt-1.5">
                  {content.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {content.map((item) => (
                        <li
                          key={item}
                          // Radius 13px: a full pill on one line, a soft
                          // corner when a long label wraps to two.
                          className="rounded-[0.8125rem] bg-paper-deep px-2.5 py-1 text-xs leading-[1.3] font-medium wrap-anywhere"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm">{blank("What you make")}</p>
                  )}
                </dd>
              </div>
            )}
            {(languages.length > 0 || preview) && (
              <div>
                <dt className={rowLabel}>Publishes in</dt>
                <dd className="mt-0.5 wrap-anywhere text-sm leading-[1.5]">
                  {languages.length > 0
                    ? languages.join(" · ")
                    : blank("Your languages")}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </article>
  );
}
