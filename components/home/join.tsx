import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading, card, cardInner } from "@/components/convention/section-heading";
import { InView } from "@/components/home/in-view";
import { JOIN_ART } from "@/components/home/join-art";
import { JOIN } from "@/lib/home";

/* Router into the Get Involved page: one card per audience, each the whole
   card a link to that audience's section. Same card as the challenge cards
   there, so the destination looks like where the reader came from. The
   text takes the spare height, so the squares line up along the row however
   many lines each title runs to. */
export function Join() {
  return (
    <section aria-labelledby="join-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-16 sm:px-6 lg:pt-24 lg:pb-24">
        <SectionHeading
          id="join-title"
          eyebrow={JOIN.eyebrow}
          title={JOIN.title}
          description={JOIN.description}
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-3 lg:mt-16 lg:gap-6">
          {JOIN.audiences.map(({ id, eyebrow, title, href }) => {
            const Art = JOIN_ART[id];
            return (
            <li key={id} className={card}>
              <Link
                href={href}
                className={cn(
                  cardInner,
                  "group/join flex h-full flex-col overflow-hidden transition-[background-color] duration-150 ease-hover hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                <div className="flex-1 px-5 pt-5 pb-6">
                  <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
                    {eyebrow}
                  </p>
                  <h3 className="mt-3 flex items-start gap-1.5 text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                    <span className="min-w-0">{title}</span>
                    <ArrowRightIcon
                      aria-hidden
                      weight="bold"
                      className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-hover motion-safe:group-hover/join:translate-x-0.5"
                    />
                  </h3>
                </div>
                <InView className="art aspect-square bg-muted/60">
                  <Art />
                </InView>
              </Link>
            </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
