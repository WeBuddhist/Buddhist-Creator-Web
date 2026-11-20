import { Suspense } from "react";
import Image from "next/image";
import { connection } from "next/server";
import { label, panel } from "@/components/convention/section-heading";
import { InView } from "@/components/home/in-view";
import { networkAudience } from "@/lib/creator-cards";
import { formatCompact, formatCount, formatDate } from "@/lib/format";
import { forLog } from "@/lib/log-error";
import { MISSION_GOAL } from "@/lib/mission";
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

/** The mission's figure: the audience the sentence sets out to reach. */
const GOAL = MISSION_GOAL;

/* The mission, as a split sheet in two tones of the brand's cyan.

   Above, the sentence in the serif with its figure in gold italic, under
   it how far along that figure we are (MissionProgress), and beside it
   the people it is about: the convention hall mid-selfie,
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
      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="px-5 pt-16 pb-12 sm:px-6 lg:py-20 lg:ps-[max(1.5rem,calc((100cqw-72rem)/2+1.5rem))] lg:pe-14">
          <p className={cn(label, "text-gold-soft")}>Our mission</p>
          <h2
            id="mission-title"
            className="mt-4 text-balance font-display text-[clamp(2rem,3.2vw,3rem)] leading-[1.08]"
          >
            Let’s spread Buddhist wisdom and compassion to{" "}
            <em className="italic text-saffron">200 million people by 2030</em>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-[1.6] text-white/85">
            Every gathering, award, and campaign we run is one step toward that
            goal: helping creators turn practice into content the world can find.
          </p>
          <Suspense fallback={<ProgressFrame />}>
            <MissionProgress />
          </Suspense>
        </div>

        <figure className="relative min-h-[16rem] sm:min-h-[22rem] lg:min-h-0">
          <Image
            src={crowdSelfie}
            alt="A hall full of convention participants, monastics among them, throwing their arms up for a selfie taken from the stage."
            fill
            placeholder="blur"
            sizes="(min-width: 1024px) 39vw, 100vw"
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
                  "reveal py-8 sm:py-10",
                  index > 0 && "border-t border-white/15 sm:border-t-0 sm:border-s sm:ps-8 lg:ps-12",
                  index < STATS.length - 1 && "sm:pe-8 lg:pe-12",
                )}
              >
                <dt className={cn(label, "text-gold-soft")}>{name}</dt>
                <dd className="mt-3 font-display text-4xl leading-none tracking-[-0.02em] sm:text-5xl sm:leading-none">
                  {value}
                  <span className="text-saffron">+</span>
                </dd>
                <dd className="mt-2 max-w-[34ch] text-pretty text-[0.9375rem] leading-[1.6] text-white/75">
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

/* How far along the mission's figure we are: the followers of every
   creator in the directory, added up, against the two hundred million, with
   what is left to go. It is the same count the leaderboard is made of
   (networkAudience in lib/creator-cards.ts), read on each visit, so it
   moves with every weekly reading.

   A meter, not a progress bar: nothing is loading. The figures beside it
   say everything the bar does, so the bar is never the only carrier.
   Gold on brand cyan measures 3.3:1, enough for a mark; the words are
   white at 85% (5.0:1) and gold-soft (4.7:1). */
async function MissionProgress() {
  // The count changes with every reading: read it at request time.
  await connection();
  let audience: Awaited<ReturnType<typeof networkAudience>>;
  try {
    audience = await networkAudience();
  } catch (error) {
    // The sentence above stands without its figure.
    console.error("[mission] could not read the audience", forLog(error));
    return null;
  }
  const { followers, creators, readAt } = audience;
  if (followers <= 0) return null;
  const left = Math.max(0, GOAL - followers);
  return (
    <ProgressFrame
      share={Math.min(1, followers / GOAL)}
      value={followers}
      text={`${formatCount(followers)} of ${formatCount(GOAL)} followers`}
      reached={
        <>
          <span className="font-display text-4xl leading-none tabular-nums sm:text-5xl sm:leading-none">
            {formatCompact(Math.min(followers, GOAL))}
          </span>
          <span className="ms-2 text-base text-white/85">of {formatCompact(GOAL)}</span>
        </>
      }
      toGo={left > 0 ? `${formatCompact(left)} to go` : "Goal reached"}
      note={
        <>
          The {formatCount(creators)} creators in our network have {formatCount(followers)} followers between them.
          {readAt && (
            <>
              {" "}
              Last updated <time dateTime={readAt.toISOString()}>{formatDate(readAt)}</time>.
            </>
          )}
        </>
      }
    />
  );
}

/* The progress block, and its own stand-in while the count is read: an
   empty bar under a row as tall as the figure, so the sheet keeps its
   height. The figures name the bar to the eye; the meter carries its own
   name for a screen reader. */
function ProgressFrame({
  share,
  value,
  text,
  reached,
  toGo,
  note,
}: {
  /** How much of the bar is filled, 0 to 1. Left out while loading. */
  share?: number;
  value?: number;
  /** The bar in words, for a screen reader. */
  text?: string;
  reached?: React.ReactNode;
  toGo?: string;
  note?: React.ReactNode;
}) {
  const loading = share === undefined;
  return (
    <div className="mt-9 max-w-xl" aria-busy={loading || undefined}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="min-h-9 sm:min-h-12">{reached}</p>
        {toGo && <p className="font-medium text-gold-soft">{toGo}</p>}
      </div>
      <div
        role="meter"
        aria-label="Progress to 200 million"
        aria-valuemin={0}
        aria-valuemax={GOAL}
        aria-valuenow={value ?? 0}
        aria-valuetext={loading ? "Counting" : `${text}, ${toGo}`}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20"
      >
        {/* The transparent border is what forced-colors mode paints. */}
        <div
          className="h-full rounded-full border border-transparent bg-saffron"
          style={{ width: `${(share ?? 0) * 100}%`, borderWidth: share ? undefined : 0 }}
        />
      </div>
      <p className="mt-3 min-h-[1.6em] text-pretty text-[0.9375rem] leading-[1.6] text-white/85">
        {loading ? "Counting our creators' followers…" : note}
      </p>
    </div>
  );
}
