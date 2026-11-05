import Image from "next/image";
import { UserIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { card, cardInner, photo } from "@/components/convention/section-heading";
import type { TeamMember } from "@/lib/people";

type Portrait = TeamMember["image"];

/* Card chrome: a square portrait flush at the top of the
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
