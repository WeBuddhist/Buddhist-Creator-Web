import Link from "next/link";
import { ArrowUpRightIcon, FilePdfIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { CONVENTION, HERO_STATS } from "@/lib/convention-2026";

export function ConventionHero() {
  return (
    <section aria-labelledby="convention-hero-title" className="bg-background">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-20">
        <div className="max-w-xl">
          <p className="reveal text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
            {CONVENTION.location}
            <span aria-hidden className="mx-2 text-foreground/30">
              ·
            </span>
            {CONVENTION.dates}
          </p>

          <h1
            id="convention-hero-title"
            className="reveal mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl"
            style={{ animationDelay: "100ms" }}
          >
            {CONVENTION.title}
          </h1>

          <p
            className="reveal mt-6 max-w-lg text-pretty text-lg leading-[1.6] text-muted-foreground"
            style={{ animationDelay: "200ms" }}
          >
            {CONVENTION.tagline}
          </p>

          <dl
            className="reveal mt-8 flex flex-wrap gap-x-10 gap-y-5"
            style={{ animationDelay: "300ms" }}
          >
            {HERO_STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
                <dd className="text-3xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-brand-cyan sm:text-4xl">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div
            className="reveal mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: "400ms" }}
          >
            <Button
              size="lg"
              nativeButton={false}
              className="h-11 gap-1.5 rounded-full border-transparent bg-clip-border bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-cyan),white_14%)] to-brand-cyan px-5 text-sm text-white shadow-[0_0_1px_1px_--alpha(var(--color-white)/8%)_inset,0_1.5px_2px_0_--alpha(var(--color-black)/12%),0_0_0_1px_color-mix(in_oklch,var(--color-brand-cyan),black_10%)] transition-[filter,translate] hover:brightness-[1.06]"
              render={
                <a
                  href={CONVENTION.reportHref}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <FilePdfIcon data-icon="inline-start" weight="bold" />
              Download the full report
              <span className="sr-only">(PDF, opens in new tab)</span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              className="h-11 gap-1.5 rounded-full px-5 text-sm"
              render={<Link href="/get-involved" />}
            >
              Get Involved
              <ArrowUpRightIcon data-icon="inline-end" weight="bold" />
            </Button>
          </div>
        </div>

        <MahabodhiTemple />
      </div>
    </section>
  );
}

/* The hero illustration: the Mahabodhi Temple at Bodh Gaya, drawn as line
   art in the same weight as the homepage Buddha drawing. The tall shikhara
   tower with its tiers of niches, the base with its doorway, the two front
   corner towers, the finial, and the Bodhi tree beside it. Golden marks the
   finial and the rising sun behind the tower. Decorative, hidden from
   assistive tech. */

const TOWER = { top: 92, bottom: 330, topHalf: 18, bottomHalf: 62, cx: 240 };
const TIERS = [120, 150, 180, 210, 240, 270, 300];

function towerHalfAt(y: number) {
  const t = (y - TOWER.top) / (TOWER.bottom - TOWER.top);
  return TOWER.topHalf + (TOWER.bottomHalf - TOWER.topHalf) * t;
}

type Delay = React.CSSProperties & { "--hero-delay"?: string };
const delay = (ms: number): Delay => ({ "--hero-delay": `${ms}ms` });

function MahabodhiTemple() {
  const { cx } = TOWER;
  const line = "hero-draw stroke-foreground/55";
  const detail = "hero-draw stroke-foreground/25";
  const canopy: Array<[number, number, number]> = [
    [404, 296, 46], [372, 312, 30], [436, 310, 30], [388, 272, 28], [420, 274, 26],
  ];

  return (
    <svg
      viewBox="0 0 480 480"
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mx-auto size-full max-w-xs lg:max-w-none"
    >
      {/* Sun behind the tower */}
      <circle cx={cx} cy={150} r={96} className="hero-fade fill-brand-golden/10" style={{ animationDelay: "400ms" }} />

      {/* Ground */}
      <path d="M70 400H470" pathLength={1} strokeWidth="1.5" className={detail} />

      {/* Base with doorway */}
      <g style={delay(80)}>
        <path d="M150 400V330H330V400" pathLength={1} strokeWidth="1.5" className={line} />
      </g>
      <g style={delay(160)}>
        <path d="M150 346H330M150 386H330" pathLength={1} strokeWidth="1" className={detail} />
        <path d="M226 400V358a14 14 0 0 1 28 0V400" pathLength={1} strokeWidth="1.5" className={line} />
      </g>

      {/* Corner towers */}
      <g style={delay(240)}>
        <path d="M158 330l8-82h22l8 82" pathLength={1} strokeWidth="1.5" className={line} />
        <path d="M284 330l8-82h22l8 82" pathLength={1} strokeWidth="1.5" className={line} />
        <path d="M166 248a12 12 0 0 1 22 0M292 248a12 12 0 0 1 22 0" pathLength={1} strokeWidth="1.5" className={line} />
        <path d="M163 268h25M161 288h29M159 308h33M289 268h25M287 288h29M285 308h33" pathLength={1} strokeWidth="1" className={detail} />
      </g>

      {/* Shikhara, then its tiers drawn from the bottom up */}
      <g style={delay(320)}>
        <path
          d={`M${cx - TOWER.bottomHalf} ${TOWER.bottom}L${cx - TOWER.topHalf} ${TOWER.top}H${cx + TOWER.topHalf}L${cx + TOWER.bottomHalf} ${TOWER.bottom}`}
          pathLength={1}
          strokeWidth="1.5"
          className={line}
        />
      </g>
      {TIERS.map((y, tier) => {
        const half = towerHalfAt(y);
        const niches = Math.max(2, Math.round(half / 14));
        const step = (half * 2 - 16) / (niches - 1);
        return (
          <g key={y} style={delay(480 + (TIERS.length - 1 - tier) * 60)}>
            <path d={`M${cx - half} ${y}H${cx + half}`} pathLength={1} strokeWidth="1" className={detail} />
            {Array.from({ length: niches }, (_, i) => {
              const x = cx - half + 8 + i * step;
              return (
                <path
                  key={i}
                  d={`M${x - 3} ${y - 6}v-7a3 3 0 0 1 6 0v7`}
                  pathLength={1}
                  strokeWidth="1"
                  className={detail}
                />
              );
            })}
          </g>
        );
      })}

      {/* Amalaka, finial and chhatra; the golden tip pops in last */}
      <g style={delay(900)}>
        <path d={`M${cx - 16} ${TOWER.top}a16 16 0 0 1 32 0`} pathLength={1} strokeWidth="1.5" className={line} />
        <path d={`M${cx} 76V44`} pathLength={1} strokeWidth="1.5" className={line} />
        <path d={`M${cx - 10} 68h20M${cx - 7} 58h14M${cx - 4} 48h8`} pathLength={1} strokeWidth="1.5" className={line} />
      </g>
      <circle cx={cx} cy={40} r={4} className="hero-pop fill-brand-golden" style={{ animationDelay: "1500ms" }} />

      {/* Bodhi tree: trunk and branches, then the canopy. Every circle's
          outline is drawn first and all the fills on top, so the overlaps
          vanish and only the outer silhouette remains. */}
      <g style={delay(400)}>
        <path d="M396 400c2-26 0-46 6-66M412 400c-2-26 0-46-4-66" pathLength={1} strokeWidth="1.5" className={line} />
        <path d="M402 356c-10-10-22-14-34-16M406 348c12-12 24-16 36-18" pathLength={1} strokeWidth="1.5" className={line} />
      </g>
      <g style={delay(560)}>
        {canopy.map(([x, y, r]) => (
          <circle key={`s-${x}-${y}`} cx={x} cy={y} r={r} pathLength={1} strokeWidth="1.5" className={line} />
        ))}
      </g>
      {canopy.map(([x, y, r]) => (
        <circle key={`f-${x}-${y}`} cx={x} cy={y} r={r - 0.75} fill="var(--color-background)" />
      ))}
    </svg>
  );
}
