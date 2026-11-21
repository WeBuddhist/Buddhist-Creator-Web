import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { AwardCard } from "@/components/awards/award-card";
import { NominationAction, NominationCallToAction } from "@/components/awards/nomination-action";
import { Medal } from "@/components/awards/medal/medal";
import { ghostButton, label, panel } from "@/components/convention/section-heading";
import { InView } from "@/components/home/in-view";
import { Button } from "@/components/ui/button";
import { AWARD_GROUPS, AWARDS_2027, AWARDS_PAGE, type AwardGroup } from "@/lib/awards-2027";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: AWARDS_2027.title,
  description: AWARDS_PAGE.description,
};

/* The awards page reads in four steps:

   1. The medal, turning (components/awards/medal), the title and the
      one action.
   2. How nominating works, in three short rules on the paper.
   3. The awards, on a sky-deep band wider than the page's usual column:
      each category under its letter, its awards as posters, each with
      what it is for under its name (components/awards/award-card.tsx).
      Category A's four sit in a row, and B's four in the same columns
      below.
   4. The cyan closing band with the action again.

   The action reads the session, so it streams in behind Suspense with the
   visitor's version as the fallback. */
export default function AwardsPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* The opening: no photograph, the medal itself, large, on white.
          A short label above it, the title and the one action below,
          centred. A faint warm light sits behind the medal so the gold
          does not float on flat white. It runs up behind the floating
          header, as every page intro does; the header keeps its light
          tone over it. */}
      <section
        aria-labelledby="awards-title"
        className="relative isolate -mt-(--header-height) overflow-hidden border-b border-border bg-white"
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_38%,rgb(242_177_48/0.12),transparent_42%)]"
        />
        <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col items-center justify-center px-5 pt-[calc(var(--header-height)+2rem)] pb-14 text-center sm:px-6">
          <p className={cn(label, "text-brand-cyan")}>{AWARDS_PAGE.eyebrow}</p>
          <Medal className="mt-2 w-[min(32rem,88vw,54svh)]" />
          <h1
            id="awards-title"
            className="mt-6 max-w-3xl text-balance font-display text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.06] tracking-[-0.03em] text-foreground"
          >
            {AWARDS_PAGE.title[0]} <em className="italic text-brand-cyan">{AWARDS_PAGE.title[1]}</em>
          </h1>
          <div className="mt-7">
            <Suspense fallback={<NominationCallToAction align="center" tone="light" toCategories />}>
              <NominationAction align="center" tone="light" toCategories />
            </Suspense>
          </div>
        </div>
      </section>

      {/* How it works: three rules of equal weight under hairlines, as the
          2027 page lists what the days hold. The middle one is the rule
          the team wrote. */}
      <section aria-labelledby="how-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-6 lg:py-28">
          <h2 id="how-title" className={cn(label, "text-brand-cyan")}>
            How nominating works
          </h2>
          <ol className="mt-8 grid gap-x-10 gap-y-10 md:grid-cols-3">
            {AWARDS_PAGE.steps.map((step, index) => (
              <li key={step.title} className="border-t border-border pt-6">
                <p aria-hidden className="font-display text-5xl leading-none text-brand-cyan tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-5 font-display text-[1.625rem] leading-[1.2] text-foreground">{step.title}</h3>
                <p className="mt-2 max-w-[42ch] text-pretty text-base leading-[1.6] text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The awards. */}
      <section
        id="categories"
        aria-labelledby="categories-title"
        data-header-tone="dark"
        className="bg-sky-deep text-white"
      >
        {/* Wider than the page's usual column: the posters are the point of
            the page, so they get the room. */}
        <div className="mx-auto w-full max-w-[88rem] px-5 py-20 sm:px-6 lg:py-28">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="font-display text-2xl italic leading-[1.2] text-gold-soft sm:text-[1.75rem]">
                {AWARDS_PAGE.categories.kicker}
                <span aria-hidden> —</span>
              </p>
              <h2
                id="categories-title"
                className="mt-3 text-balance font-display text-[clamp(2.75rem,6vw,5rem)] leading-[1.02] tracking-[-0.03em]"
              >
                {AWARDS_PAGE.categories.title[0]}{" "}
                <em className="italic text-saffron">{AWARDS_PAGE.categories.title[1]}</em>
              </h2>
              <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-white/80">
                {AWARDS_PAGE.categories.description}
              </p>
            </div>
            {AWARDS_2027.open && (
              <Button
                size="pill"
                variant="outline"
                nativeButton={false}
                className={cn(ghostButton, "shrink-0 self-start lg:self-end")}
                render={<Link href={AWARDS_2027.nominatePath} />}
              >
                {AWARDS_PAGE.action}
                <ArrowRightIcon data-icon="inline-end" weight="bold" />
              </Button>
            )}
          </div>

          {/* Each category: its name, then its awards in a row. Every
              category uses Category A's four columns, so all the posters
              are one size and a shorter row leaves its last places empty.
              On a phone a row scrolls sideways, the next poster showing
              past the edge so it is plain there are more. */}
          {AWARD_GROUPS.map((group, groupIndex) => (
            <div key={group.id} className={groupIndex === 0 ? "mt-16 lg:mt-20" : "mt-20 lg:mt-28"}>
              <GroupHeading group={group} />
              <InView className="art mt-8">
                <ul className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
                  {group.awards.map((award, index) => (
                    <li
                      key={award.slug}
                      data-animate
                      className="reveal w-[84%] max-w-[24rem] shrink-0 snap-start sm:w-auto sm:max-w-none"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <AwardCard award={award} />
                    </li>
                  ))}
                </ul>
              </InView>
            </div>
          ))}
        </div>
      </section>

      {/* The closing band, in the 2027 page's recipe: brand cyan, the
          question in the serif with its second line in gold italic. */}
      <section
        aria-labelledby="awards-closing-title"
        data-header-tone="dark"
        className={cn(panel, "bg-brand-cyan text-white")}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-28">
          <h2
            id="awards-closing-title"
            className="text-balance font-display text-[clamp(2.75rem,6.2vw,5.5rem)] leading-[1.04]"
          >
            <span className="block">{AWARDS_PAGE.closing.title[0]}</span>{" "}
            <em className="block italic text-saffron">{AWARDS_PAGE.closing.title[1]}</em>
          </h2>
          {AWARDS_2027.open && (
            <p className="mt-7 max-w-xl text-pretty text-xl leading-[1.55] text-white/85">{AWARDS_PAGE.closing.body}</p>
          )}
          <div className="mt-8">
            <Suspense fallback={<NominationCallToAction align="center" />}>
              <NominationAction align="center" />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}

/* A category's letter, set large in the banners' gold, beside its label,
   name and line. */
function GroupHeading({ group }: { group: AwardGroup }) {
  return (
    <div className="flex items-end gap-x-6 gap-y-3">
      <span
        aria-hidden
        className="font-display text-[clamp(5.5rem,10vw,8.5rem)] leading-[0.78] tracking-[-0.04em] text-saffron"
      >
        {group.letter}
      </span>
      <div>
        <p aria-hidden className={cn(label, "text-gold-soft")}>
          Category {group.letter}
        </p>
        <h3 className="mt-2 text-balance font-display text-3xl leading-[1.1] sm:text-4xl">
          <span className="sr-only">Category {group.letter}: </span>
          {group.title}
        </h3>
        {group.description && (
          <p className="mt-2 max-w-[48ch] text-pretty text-base leading-[1.6] text-white/75">{group.description}</p>
        )}
      </div>
    </div>
  );
}
