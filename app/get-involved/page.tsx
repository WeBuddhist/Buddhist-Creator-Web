import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon, EnvelopeSimpleIcon, ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { WaveCorner } from "@/components/mission";
import { SectionHeading, card, cardInner, photo } from "@/components/convention/section-heading";
import { cn } from "@/lib/utils";
import { COLLABORATORS } from "@/lib/convention-2026";
import { CREATOR, GET_INVOLVED_PAGE, PARTNER, SUPPORT, TEAM } from "@/lib/get-involved";

export const metadata: Metadata = {
  title: "Get Involved",
  description: GET_INVOLVED_PAGE.description,
};

// The page opens on a brand-indigo band, so the browser chrome matches it.
export const viewport: Viewport = {
  themeColor: "#35325a",
};

/* Primary and secondary buttons, in the homepage hero's recipe. */
const primaryButton =
  "h-11 gap-1.5 rounded-full border-transparent bg-clip-border bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-cyan),white_14%)] to-brand-cyan px-5 text-sm text-white shadow-[0_0_1px_1px_--alpha(var(--color-white)/8%)_inset,0_1.5px_2px_0_--alpha(var(--color-black)/12%),0_0_0_1px_color-mix(in_oklch,var(--color-brand-cyan),black_10%)] transition-[filter,translate] hover:brightness-[1.06]";
const secondaryButton = "h-11 gap-1.5 rounded-full px-5 text-sm";

export default function GetInvolvedPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* The intro band runs up behind the transparent header and pads its
          top by the header's height, so the header sits on the indigo and
          takes the brand tone. */}
      <section
        aria-labelledby="get-involved-title"
        className="relative isolate -mt-(--header-height) overflow-hidden bg-brand-indigo pt-(--header-height) [--wave-fill:var(--color-brand-indigo)]"
        data-header-tone="brand"
      >
        <WaveCorner className="-top-16 -right-16 -scale-x-100" />

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-12 pb-12 sm:px-6 lg:pt-20 lg:pb-20">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-golden">
            {GET_INVOLVED_PAGE.eyebrow}
          </p>
          <h1
            id="get-involved-title"
            className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl"
          >
            {GET_INVOLVED_PAGE.title}
          </h1>
          <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-white/80">
            {GET_INVOLVED_PAGE.description}
          </p>

          {/* Jump links to the three audiences. */}
          <nav aria-label="Ways to get involved" className="mt-8">
            <ul className="flex flex-wrap gap-2">
              {[CREATOR, PARTNER, SUPPORT, TEAM].map(({ id, eyebrow }) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="inline-flex h-9 items-center rounded-full border border-white/15 bg-white/10 px-3.5 text-sm font-medium text-white transition-[background-color] duration-150 ease-hover hover:bg-white/16 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {eyebrow}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      {/* As a creator */}
      <section id={CREATOR.id} aria-labelledby="creator-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
          <SectionHeading
            id="creator-title"
            eyebrow={CREATOR.eyebrow}
            title={CREATOR.title}
            description={CREATOR.description}
          />

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:gap-6">
            {CREATOR.challenges.map(({ title, body, image }) => (
              <li key={title} className={card}>
                <article className={cn(cardInner, "grid overflow-hidden sm:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)]")}>
                  <div className="aspect-[4/3] bg-muted sm:aspect-auto sm:h-full">
                    {image ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        width={image.width}
                        height={image.height}
                        sizes="(min-width: 640px) 12rem, 100vw"
                        className={cn("size-full object-cover", photo)}
                      />
                    ) : (
                      <div aria-hidden className="flex size-full min-h-40 items-center justify-center">
                        <ImageIcon className="size-8 text-foreground/20" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center px-5 pt-5 pb-6">
                    <h3 className="text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                      {title}
                    </h3>
                    <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                      {body}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <div className="mt-12 grid gap-4 border-t border-border pt-12 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:pt-16">
            <div className="max-w-2xl">
              <h3 className="text-balance text-xl font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                {CREATOR.programs.title}
              </h3>
              <p className="mt-2 text-pretty text-base leading-[1.6] text-muted-foreground">
                {CREATOR.programs.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                nativeButton={false}
                className={primaryButton}
                render={<Link href={CREATOR.programs.actions[0].href} />}
              >
                {CREATOR.programs.actions[0].label}
                <ArrowUpRightIcon data-icon="inline-end" weight="bold" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                nativeButton={false}
                className={secondaryButton}
                render={<Link href={CREATOR.programs.actions[1].href} />}
              >
                {CREATOR.programs.actions[1].label}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* As an institution or group */}
      <section id={PARTNER.id} aria-labelledby="partner-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
          <SectionHeading
            id="partner-title"
            eyebrow={PARTNER.eyebrow}
            title={PARTNER.title}
            description={PARTNER.description}
          />

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:gap-6">
            {PARTNER.ways.map(({ title, body }) => (
              <li key={title} className={card}>
                <div className={cn(cardInner, "flex h-full flex-col px-5 pt-5 pb-6")}>
                  <h3 className="text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex flex-col gap-6 border-t border-border pt-12 lg:mt-16 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:pt-16">
            <div>
              <h3 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
                {PARTNER.partnersTitle}
              </h3>
              <ul className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
                {COLLABORATORS.map(({ name, logo, href }) => {
                  const mark = logo ? (
                    <>
                      <Image
                        src={logo}
                        alt=""
                        width={600}
                        height={600}
                        sizes="3.5rem"
                        className="size-14 mix-blend-multiply"
                      />
                      <span className="sr-only">{name}</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{name}</span>
                  );
                  return (
                    <li key={name}>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg transition-opacity duration-150 ease-hover hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                        >
                          {mark}
                          <span className="sr-only">(opens in new tab)</span>
                        </a>
                      ) : (
                        mark
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <Button
              size="lg"
              nativeButton={false}
              className={cn(primaryButton, "shrink-0")}
              render={<a href={PARTNER.action.href} />}
            >
              <EnvelopeSimpleIcon data-icon="inline-start" weight="bold" />
              {PARTNER.action.label}
            </Button>
          </div>
        </div>
      </section>

      {/* As an individual */}
      <section id={SUPPORT.id} aria-labelledby="support-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6 lg:pt-24">
          <SectionHeading
            id="support-title"
            eyebrow={SUPPORT.eyebrow}
            title={SUPPORT.title}
            description={SUPPORT.description}
          />

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:gap-6">
            {SUPPORT.ways.map(({ title, body, action }) => (
              <li key={title} className={card}>
                <div className={cn(cardInner, "flex h-full flex-col px-5 pt-5 pb-6")}>
                  <h3 className="text-balance text-lg font-semibold leading-[1.3] tracking-[-0.01em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-[1.5] text-muted-foreground">
                    {body}
                  </p>
                  <div className="mt-auto pt-5">
                    <Button
                      variant="outline"
                      size="lg"
                      nativeButton={false}
                      className={secondaryButton}
                      render={<a href={action.href} />}
                    >
                      <EnvelopeSimpleIcon data-icon="inline-start" weight="bold" />
                      {action.label}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Join our team */}
      <section id={TEAM.id} aria-labelledby="team-title" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 pt-16 pb-16 sm:px-6 lg:pt-24 lg:pb-24">
          <div className={card}>
            <div className={cn(cardInner, "grid gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10 lg:px-10 lg:py-10")}>
              <SectionHeading
                id="team-title"
                level="h3"
                eyebrow={TEAM.eyebrow}
                title={TEAM.title}
                description={TEAM.description}
              />
              <Button
                size="lg"
                nativeButton={false}
                className={cn(primaryButton, "shrink-0")}
                render={<a href={TEAM.action.href} />}
              >
                <EnvelopeSimpleIcon data-icon="inline-start" weight="bold" />
                {TEAM.action.label}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
