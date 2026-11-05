import Image from "next/image";
import {
  InstagramLogoIcon,
  UserIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { card, cardInner, photo } from "@/components/convention/section-heading";
import type { Creator, Social, TeamMember } from "@/lib/people";

const PLATFORMS: Record<Social["platform"], { label: string; Icon: typeof YoutubeLogoIcon }> = {
  youtube: { label: "YouTube", Icon: YoutubeLogoIcon },
  instagram: { label: "Instagram", Icon: InstagramLogoIcon },
  x: { label: "X", Icon: XLogoIcon },
};

type Portrait = Creator["image"];

/* Shared chrome for both cards: a square portrait flush at the top of the
   inner surface, then the text on one left edge. */
function PersonFrame({
  image,
  children,
}: {
  image: Portrait;
  children: React.ReactNode;
}) {
  return (
    <li className={card}>
      <article className={cn(cardInner, "flex h-full flex-col overflow-hidden")}>
        <div className="aspect-square bg-muted">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 16rem, (min-width: 640px) 33vw, 50vw"
              className={cn("size-full object-cover", photo)}
            />
          ) : (
            <Placeholder />
          )}
        </div>
        <div className="flex flex-1 flex-col px-4 pt-4 pb-5">{children}</div>
      </article>
    </li>
  );
}

export function CreatorCard({ creator }: { creator: Creator }) {
  const { name, socials, image } = creator;
  return (
    <PersonFrame image={image}>
      <h3 className="text-balance text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
        {name}
      </h3>
      {/* Each link names the person and the platform, so a list of identical
          icons still reads distinctly to a screen reader. */}
      <ul className="mt-3 flex flex-wrap items-center gap-3">
        {socials.map(({ platform, href }) => {
          const { label, Icon } = PLATFORMS[platform];
          return (
            <li key={platform}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${name} on ${label} (opens in new tab)`}
                className="flex size-8 items-center justify-center rounded-lg border border-transparent bg-muted text-foreground shadow-ring transition-[background-color,transform] duration-150 ease-hover hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_5%)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Icon aria-hidden className="size-4" />
              </a>
            </li>
          );
        })}
      </ul>
    </PersonFrame>
  );
}

export function TeamCard({ member }: { member: TeamMember }) {
  const { name, role, image } = member;
  return (
    <PersonFrame image={image}>
      <h3 className="text-balance text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
        {name}
      </h3>
      {role && <p className="mt-1 text-sm text-muted-foreground">{role}</p>}
    </PersonFrame>
  );
}

/* Stand-in until the person has a portrait: the muted surface with a faint
   figure glyph, hidden from assistive tech. */
function Placeholder() {
  return (
    <div aria-hidden className="flex size-full items-center justify-center">
      <UserIcon className="size-10 text-foreground/20" />
    </div>
  );
}
