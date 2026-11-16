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
import {
  framedCard,
  framedCardInner,
  label,
} from "@/components/convention/section-heading";
import { CardPhoto } from "@/components/creator-card/card-photo";
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

/* The creator card: who the creator is, what they make, and where to find
   it. It wears the double border: a muted frame around the white surface.
   On the surface, the creator's photo large across the top, inset so its
   corners follow the surface's, then the name in
   the serif and brand cyan for the line that says what kind of creator
   this is. Under the name, the country and how many people follow the
   creator, all their counted places together.

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
  className,
}: {
  card: CardContent;
  preview?: boolean;
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
    <article className={cn(framedCard, "text-foreground", className)}>
      <div className={cn(framedCardInner, "flex flex-col p-1.5")}>
        {/* Radius 6px = the surface's 12px less its 6px of padding. */}
        <CardPhoto src={card.photoUrl} shape="cover" className="rounded-md" />
        <div className="flex flex-col px-3.5 pt-4 pb-4 sm:px-4">
          {(type || preview) && (
            <p
              className={cn(
                label,
                type ? "text-brand-cyan" : "text-muted-foreground/70",
              )}
            >
              {type ?? "I create as"}
            </p>
          )}
          <h3 className="mt-1.5 text-balance wrap-anywhere font-display text-[1.75rem] leading-[1.12]">
            {name || blank("Your name")}
          </h3>
          {/* One line while there is room; a long country puts the
            followers on the next. */}
          {(card.country || followers > 0 || preview) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
          {(tagline || preview) && (
            <p className="mt-3 text-pretty wrap-anywhere text-[0.9375rem] leading-[1.5]">
              {tagline || blank("One line about your work")}
            </p>
          )}

          {(content.length > 0 || languages.length > 0 || preview) && (
            <dl className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
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

          {(links.length > 0 || preview) && (
            <div className="mt-4 border-t border-border pt-4">
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
        </div>
      </div>
    </article>
  );
}
