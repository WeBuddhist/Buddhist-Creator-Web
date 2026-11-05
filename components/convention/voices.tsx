import Image from "next/image";
import { cn } from "@/lib/utils";
import { WaveCorner } from "@/components/mission";
import { COLLABORATORS, TESTIMONIALS } from "@/lib/convention-2026";

export function Voices() {
  return (
    <section
      aria-labelledby="voices-title"
      className="relative isolate overflow-hidden bg-brand-cyan"
      data-header-tone="brand"
    >
      <WaveCorner className="-top-16 -left-16" />
      <WaveCorner className="-right-16 -bottom-16 -scale-100" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-white/80">
            Community voices
          </p>
          <h2
            id="voices-title"
            className="mt-4 text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
          >
            What creators took home
          </h2>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-3 lg:mt-16 lg:gap-6">
          {TESTIMONIALS.map(({ quote, name, location }) => (
            <li key={name}>
              <figure className="flex h-full flex-col rounded-2xl border border-white/15 bg-white/10 p-5 sm:p-6">
                <blockquote className="flex-1 text-pretty text-lg leading-[1.5] text-white">
                  “{quote}”
                </blockquote>
                <figcaption className="mt-5 text-sm text-white/80">
                  <span className="font-medium text-white">{name}</span>
                  <span aria-hidden>, </span>
                  {location}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Logo row under the hero. Names stay in the DOM for screen readers and as
   the link's accessible name; only the mark is drawn. Collaborators with no
   logo on file are left out. */
export function Collaborators() {
  const withLogo = COLLABORATORS.filter(
    (c): c is typeof c & { logo: string } => c.logo !== null,
  );

  return (
    <section aria-labelledby="collaborators-title" className="bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:py-10">
        <h2
          id="collaborators-title"
          className="shrink-0 text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground"
        >
          Organisations behind the convention
        </h2>

        <ul className="flex flex-wrap items-center gap-x-8 gap-y-4">
          {withLogo.map(({ name, logo, href }) => {
            const mark = (
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
            );
            return (
              <li key={name}>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block rounded-lg transition-opacity duration-150 ease-hover hover:opacity-80",
                      "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                    )}
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
    </section>
  );
}
