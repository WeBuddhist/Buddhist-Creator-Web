import { cn } from "@/lib/utils";

export function Mission() {
  return (
    <section
      aria-labelledby="mission-title"
      className="relative isolate overflow-hidden bg-brand-cyan"
      data-header-tone="brand"
    >
      <WaveCorner className="-top-16 -left-16" />
      <WaveCorner className="-top-16 -right-16 -scale-x-100" />
      <WaveCorner className="-bottom-16 -left-16 -scale-y-100" />
      <WaveCorner className="-right-16 -bottom-16 -scale-100" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:py-28">
        <p className="text-xs font-medium uppercase tracking-[0.05em] text-white/80">
          Our mission
        </p>
        <h2
          id="mission-title"
          className="mt-4 text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
        >
          Let’s spread Buddhist wisdom and compassion to{" "}
          {/* Brand golden measures 2.98:1 on brand cyan; a 10% lift reaches 3.21:1 for large text. */}
          <span className="text-[color-mix(in_oklch,var(--color-brand-golden),white_10%)]">
            100 million people by 2030
          </span>
        </h2>
        <p className="mt-6 max-w-xl text-pretty text-lg leading-[1.6] text-white/80">
          Every gathering, award, and masterclass we run is one step toward
          that goal to helping creators turn practice into content the world can
          find.
        </p>
      </div>
    </section>
  );
}

/* Seigaiha (overlapping wave) pattern, drawn once at the top-left and
   mirrored into the other corners. Each circle is filled with the section
   colour so the row below hides the bottom half of the row above; a band
   that is not brand cyan sets --wave-fill to its own colour. Strokes
   are opaque and the whole SVG is faded, so overlapping strokes composite
   once instead of stacking into lighter slivers. */

const R = 64;
const RINGS = [64, 48, 32, 16];
const ROWS = 5;
const COLS = 5;

export function WaveCorner({ className }: { className?: string }) {
  const circles: { cx: number; cy: number }[] = [];
  for (let row = 0; row < ROWS; row++) {
    const offset = row % 2 === 0 ? 0 : R;
    for (let col = 0; col < COLS; col++) {
      circles.push({ cx: col * 2 * R + offset, cy: row * R });
    }
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 320"
      className={cn(
        "pointer-events-none absolute size-56 text-white opacity-25 sm:size-72 lg:size-80",
        // Fully transparent well before the text column at every width.
        "[mask-image:radial-gradient(circle_at_top_left,black_30%,transparent_70%)]",
        className,
      )}
    >
      {circles.map(({ cx, cy }) => (
        <g key={`${cx}-${cy}`}>
          {RINGS.map((r, i) => (
            <circle
              key={r}
              cx={cx}
              cy={cy}
              r={r}
              fill={i === 0 ? "var(--wave-fill, var(--color-brand-cyan))" : "none"}
              stroke="currentColor"
              strokeWidth={8}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
