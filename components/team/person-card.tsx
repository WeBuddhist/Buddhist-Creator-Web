import Image from "next/image";
import { UserIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { photo } from "@/components/convention/section-heading";
import type { TeamMember } from "@/lib/team";

type Portrait = TeamMember["image"];

/* A portrait with the same soft corners as every photograph on the site,
   and the name in the serif under it. No card around it: the picture is
   the frame. */
function PersonFrame({
  image,
  children,
}: {
  image: Portrait;
  children: React.ReactNode;
}) {
  return (
    <li>
      <article className="flex h-full flex-col">
        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-paper-deep">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              placeholder="blur"
              sizes="(min-width: 1024px) 23rem, (min-width: 640px) 33vw, 50vw"
              className={cn("size-full object-cover", photo)}
            />
          ) : (
            <Placeholder />
          )}
        </div>
        <div className="flex flex-1 flex-col px-1 pt-4">{children}</div>
      </article>
    </li>
  );
}

export function TeamCard({ member }: { member: TeamMember }) {
  const { name, role, image } = member;
  return (
    <PersonFrame image={image}>
      <h3 className="text-balance font-display text-2xl leading-[1.15] text-foreground">
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
