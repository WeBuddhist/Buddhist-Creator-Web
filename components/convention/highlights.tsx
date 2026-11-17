import { ArrowUpRightIcon, InstagramLogoIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { SectionHeading, cardInner, label } from "@/components/convention/section-heading";
import { HighlightsPlayer } from "@/components/convention/highlights-player";
import { COMMUNITY_DAYS, HIGHLIGHTS } from "@/lib/convention-2026";

/* The videos, straight under the hero and the logo row: most visitors do
   not scroll as far as the program, where these used to be the only way
   in. The recorded lightning talks play here; the video messages and the
   panel, which live on Instagram, are one press away. */
export function Highlights() {
  const { keynotes, panel } = COMMUNITY_DAYS;

  /* The Instagram videos, in the order they ran on the day. Their fuller
     write-ups stay in Phase 1 below. */
  const messages = [
    ...keynotes.flatMap(({ name, videoHref }) =>
      videoHref ? [{ title: name, kind: "Video message", href: videoHref }] : [],
    ),
    { title: panel.title, kind: "Panel discussion", href: panel.videoHref },
  ];

  return (
    <section id="highlights" aria-labelledby="highlights-title" className="scroll-mt-24 bg-background">
      {/* A short top: the logo row above is part of the same opening. No
          bottom padding, since the program's own top padding is the gap. */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6 lg:pt-12">
        <SectionHeading
          id="highlights-title"
          size="h3"
          eyebrow={HIGHLIGHTS.eyebrow}
          title={HIGHLIGHTS.title}
          description={HIGHLIGHTS.description}
        />

        <div className="mt-8 lg:mt-10">
          <HighlightsPlayer />
        </div>

        <h3 id="highlights-messages" className={cn(label, "mt-10 text-muted-foreground lg:mt-12")}>
          Video messages and panel
        </h3>
        <ul aria-labelledby="highlights-messages" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {messages.map(({ title, kind, href }) => (
            <li key={href} className="flex">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  cardInner,
                  "group/message flex w-full items-start gap-3 p-4 transition-[background-color] duration-150 ease-hover hover:bg-paper-deep",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                )}
              >
                <InstagramLogoIcon aria-hidden weight="bold" className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-pretty font-medium leading-[1.3] text-foreground">{title}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{kind}</span>
                  <span className="sr-only">(Instagram, opens in new tab)</span>
                </span>
                <ArrowUpRightIcon
                  aria-hidden
                  weight="bold"
                  className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 ease-hover group-hover/message:translate-x-0.5 group-hover/message:-translate-y-0.5 motion-reduce:transition-none"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
