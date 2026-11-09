import { YoutubeLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading, card, cardInner } from "@/components/convention/section-heading";
import { CONVENTION, DOCUMENTARY } from "@/lib/convention-2026";

export function Documentary() {
  const { youtubeId, title, runtime, href } = CONVENTION.documentary;

  return (
    <section id="documentary" aria-labelledby="documentary-title" className="bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <SectionHeading
          id="documentary-title"
          align="center"
          eyebrow={DOCUMENTARY.eyebrow}
          title={DOCUMENTARY.title}
          description={DOCUMENTARY.description}
        />

        <figure className={cn(card, "mx-auto mt-12 max-w-4xl lg:mt-16")}>
          <div className={cn(cardInner, "overflow-hidden")}>
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                title={title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                className="absolute inset-0 size-full border-0"
              />
            </div>
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 pt-3 pb-2 text-sm text-muted-foreground sm:px-4">
            <span>
              <span className="font-medium text-foreground">{title}</span>
              <span aria-hidden className="mx-2 text-border">
                ·
              </span>
              {runtime}
            </span>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-[text-decoration-color] duration-150 ease-hover hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <YoutubeLogoIcon aria-hidden weight="bold" className="size-4" />
              Watch on YouTube
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
