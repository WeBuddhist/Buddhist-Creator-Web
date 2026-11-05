import Link from "next/link";
import {
  ArrowRightIcon,
  ChalkboardTeacherIcon,
  MegaphoneIcon,
  TrophyIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading, card, cardInner } from "@/components/convention/section-heading";
import { ctaLink } from "@/components/events/event-card";
import { PROGRAMS, type Program } from "@/lib/home";

/* One mark per program, in the brand colour on a soft disc of the same
   colour: the halo recipe from the community circles on the convention
   page. Hidden from assistive tech; the title carries the meaning. */
const ICONS: Record<Program["id"], typeof UsersThreeIcon> = {
  convention: UsersThreeIcon,
  masterclass: ChalkboardTeacherIcon,
  awards: TrophyIcon,
  campaigns: MegaphoneIcon,
};

export function Programs() {
  return (
    <section aria-labelledby="programs-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
        <SectionHeading
          id="programs-title"
          eyebrow={PROGRAMS.eyebrow}
          title={PROGRAMS.title}
          description={PROGRAMS.description}
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-6">
          {PROGRAMS.items.map(({ id, title, body, href, cta }) => {
            const Icon = ICONS[id];
            return (
              <li key={id} className={card}>
                <article className={cn(cardInner, "flex h-full flex-col px-5 pt-5 pb-6")}>
                  <span
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan"
                  >
                    <Icon weight="bold" className="size-5" />
                  </span>
                  <h3 className="mt-4 text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                    {body}
                  </p>
                  <p className="mt-auto pt-5">
                    <Link href={href} className={ctaLink}>
                      {cta}
                      <ArrowRightIcon
                        aria-hidden
                        weight="bold"
                        className="size-3.5 transition-transform duration-150 ease-hover motion-safe:group-hover/link:translate-x-0.5"
                      />
                    </Link>
                  </p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
