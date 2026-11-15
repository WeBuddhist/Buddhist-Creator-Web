import Image from "next/image";
import { label, panel } from "@/components/convention/section-heading";
import { InView } from "@/components/home/in-view";
import { cn } from "@/lib/utils";
import crowdSelfie from "@/public/photos/crowd-selfie.webp";

const STATS = [
  {
    value: "10M",
    label: "Total engagement",
    description: "Views, shares and conversations sparked by Dharma content from our creators.",
  },
  {
    value: "12",
    label: "Countries united",
    description: "Monastics and lay creators collaborating across Asia, Europe and the Americas.",
  },
  {
    value: "110",
    label: "Active creators",
    description: "Filmmakers, writers, musicians and designers publishing every month.",
  },
];

/* The mission, as a split sheet in two tones of the brand's cyan.

   Above, the sentence in the serif with its figure in gold italic, and
   beside it the people it is about: the convention hall mid-selfie,
   running to the sheet's own edge and corner. The text column starts on the
   page's left edge although the sheet is wider than the page, so its
   padding is worked out from the sheet's width (the sheet is a size
   container).

   Below, on the darkest cyan, the three numbers behind the sentence: what
   each one counts, the figure, and what it means, in that order, with a
   rule between neighbours. They arrive 100ms apart the first time the band
   scrolls into view (`reveal` and `art` in globals.css); with reduced
   motion they fade, and without scripts they are simply there.

   White on brand cyan measures 6.2:1 and 5.0:1 at 85%; the gold phrase is
   large text, 3.3:1. On sky-deep, white at 75% measures 7.6:1, gold-soft
   9.5:1 and saffron 6.3:1. */
export function Mission() {
  return (
    <section
      aria-labelledby="mission-title"
      data-header-tone="dark"
      className={cn(panel, "@container overflow-hidden bg-brand-cyan text-white")}
    >
      <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="px-5 pt-20 pb-14 sm:px-6 lg:py-28 lg:ps-[max(1.5rem,calc((100cqw-72rem)/2+1.5rem))] lg:pe-14">
          <p className={cn(label, "text-gold-soft")}>Our mission</p>
          <h2
            id="mission-title"
            className="mt-5 text-balance font-display text-[clamp(2.5rem,4.5vw,4.5rem)] leading-[1.06]"
          >
            Let’s spread Buddhist wisdom and compassion to{" "}
            <em className="italic text-saffron">100 million people by 2030</em>
          </h2>
          <p className="mt-8 max-w-xl text-pretty text-lg leading-[1.6] text-white/85 sm:text-xl sm:leading-[1.55]">
            Every gathering, award, and campaign we run is one step toward that
            goal: helping creators turn practice into content the world can find.
          </p>
        </div>

        <figure className="relative min-h-[20rem] sm:min-h-[26rem] lg:min-h-0">
          <Image
            src={crowdSelfie}
            alt="A hall full of convention participants, monastics among them, throwing their arms up for a selfie taken from the stage."
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 44vw, 100vw"
            className="object-cover object-[72%_50%]"
          />
          <figcaption className="absolute start-4 bottom-4 rounded-full bg-white px-3 py-1.5 text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.1em] text-brand-cyan">
            Convention 2026, Bodh Gaya
          </figcaption>
        </figure>
      </div>

      <div data-header-tone="dark" className="bg-sky-deep">
        <InView className="art mx-auto w-full max-w-6xl px-5 sm:px-6">
          <dl className="grid sm:grid-cols-3">
            {STATS.map(({ value, label: name, description }, index) => (
              <div
                key={name}
                data-animate
                style={{ animationDelay: `${index * 100}ms` }}
                className={cn(
                  "reveal py-10 sm:py-14 lg:py-16",
                  index > 0 && "border-t border-white/15 sm:border-t-0 sm:border-s sm:ps-8 lg:ps-12",
                  index < STATS.length - 1 && "sm:pe-8 lg:pe-12",
                )}
              >
                <dt className={cn(label, "text-gold-soft")}>{name}</dt>
                <dd className="mt-5 font-display text-[clamp(4rem,7vw,6rem)] leading-[0.95] tracking-[-0.03em]">
                  {value}
                  <span className="text-saffron">+</span>
                </dd>
                <dd className="mt-4 max-w-[34ch] text-pretty text-[0.9375rem] leading-[1.6] text-white/75">
                  {description}
                </dd>
              </div>
            ))}
          </dl>
        </InView>
      </div>
    </section>
  );
}
