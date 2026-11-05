import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ArrowUpRightIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { ConventionFlyer } from "@/components/convention-flyer";
import { WaveCorner } from "@/components/mission";
import { SectionHeading, card, cardInner } from "@/components/convention/section-heading";
import { cn } from "@/lib/utils";
import {
  AMBASSADORS_2026,
  AMBASSADORS_PAGE,
  COHORT_2026,
  HOW_IT_WORKS,
  ROLE,
  SUPPORT,
} from "@/lib/ambassadors";

export const metadata: Metadata = {
  title: "Ambassador Programme",
  description: AMBASSADORS_PAGE.description,
};

// The page opens on a brand-cyan band, so the browser chrome matches it.
export const viewport: Viewport = {
  themeColor: "#136986",
};

export default function AmbassadorsPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* The intro band runs up behind the transparent header and pads its
          top by the header's height, so the header sits on the cyan and
          takes the brand tone. */}
      <section
        aria-labelledby="ambassadors-title"
        className="relative isolate -mt-(--header-height) overflow-hidden bg-brand-cyan pt-(--header-height)"
        data-header-tone="brand"
      >
        <WaveCorner className="-top-16 -right-16 -scale-x-100" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-12 sm:px-6 lg:pt-20 lg:pb-20">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-white/80">
            {AMBASSADORS_PAGE.eyebrow}
          </p>
          <h1
            id="ambassadors-title"
            className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl"
          >
            {AMBASSADORS_PAGE.title}
          </h1>
          <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-white/80">
            {AMBASSADORS_PAGE.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="pill"
              nativeButton={false}
              className="border-transparent bg-white text-brand-cyan shadow-border hover:bg-white/90"
              render={<Link href="/convention/2026" />}
            >
              See the 2026 convention
              <ArrowUpRightIcon data-icon="inline-end" weight="bold" />
            </Button>
            <Button
              variant="outline"
              size="pill"
              nativeButton={false}
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/get-involved" />}
            >
              Get involved
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
          <SectionHeading
            id="how-title"
            eyebrow={HOW_IT_WORKS.eyebrow}
            title={HOW_IT_WORKS.title}
            description={HOW_IT_WORKS.description}
          />
          <ol className="mt-12 grid gap-4 sm:grid-cols-3 lg:mt-16 lg:gap-6">
            {HOW_IT_WORKS.steps.map(({ title, body }, index) => (
              <li key={title} className={card}>
                <div className={cn(cardInner, "flex h-full flex-col px-5 pt-5 pb-6")}>
                  <span
                    aria-hidden
                    className="text-2xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-brand-cyan"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* The role, and what comes with it */}
      <section aria-labelledby="role-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
          <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
            <h2 id="role-title" className="text-base font-semibold text-foreground">
              {ROLE.title}
            </h2>
            <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {ROLE.items.map(({ title, body }) => (
                <li key={title}>
                  <p className="font-semibold leading-[1.3] text-foreground">{title}</p>
                  <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                    {body}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 grid gap-4 border-t border-border pt-12 lg:mt-16 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10 lg:pt-16">
            <h2 className="text-base font-semibold text-foreground">{SUPPORT.title}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {SUPPORT.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-pretty text-sm leading-[1.5] text-muted-foreground">
                  <CheckIcon aria-hidden weight="bold" className="mt-0.5 size-4 shrink-0 text-brand-cyan" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Current cohort */}
      <section aria-labelledby="cohort-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-4 sm:px-6 lg:pt-24">
          <h2
            id="cohort-title"
            className="text-2xl font-semibold leading-[1.2] tracking-[-0.02em] text-foreground sm:text-3xl"
          >
            {COHORT_2026.title}
          </h2>
          <p className="mt-2 max-w-[58ch] text-pretty text-base leading-[1.6] text-muted-foreground">
            {COHORT_2026.description}
          </p>
          {AMBASSADORS_2026.length > 0 ? (
            <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-4 sm:grid-cols-3 lg:mt-8 lg:grid-cols-4 lg:gap-6">
              {AMBASSADORS_2026.map(({ name, location }) => (
                <li key={name} className={card}>
                  <div className={cn(cardInner, "px-4 pt-4 pb-5")}>
                    <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                      {name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{location}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-pretty text-base leading-[1.6] text-muted-foreground">
              {COHORT_2026.empty}
            </p>
          )}
        </div>
      </section>

      {/* The next convention, where the next cohort is selected. */}
      <ConventionFlyer />
    </main>
  );
}
