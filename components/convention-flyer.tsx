import Image from "next/image";

/*
 * Seigaiha corner ornament. Rows of overlapping circles, each row offset by
 * half a circle and drawn front over back, so only a scalloped fan of each
 * circle stays visible. Each circle gets a filled disc plus concentric arcs.
 */
const R = 64;
const ROWS = 4;
const COLS = 3;
const ARCS = [R, R - 17, R - 34, R - 51];

function CornerWaves({ className }: { className?: string }) {
  const circles: Array<[cx: number, cy: number]> = [];
  for (let row = 0; row < ROWS; row++) {
    const offset = row % 2 === 0 ? 0 : R;
    for (let col = -1; col < COLS; col++) {
      circles.push([col * 2 * R + offset, row * R - R]);
    }
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 240 240"
      className={className}
      fill="none"
      strokeWidth={4.5}
    >
      {circles.map(([cx, cy]) => (
        <g key={`${cx},${cy}`}>
          <circle cx={cx} cy={cy} r={R} className="fill-background" />
          {ARCS.map((radius) => (
            <circle
              key={radius}
              cx={cx}
              cy={cy}
              r={radius}
              className="stroke-brand-cyan/25"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

const corner =
  "pointer-events-none absolute size-44 sm:size-56 lg:size-72 [mask-image:radial-gradient(circle_at_0_0,black_15%,transparent_70%)]";

export function ConventionFlyer() {
  return (
    <section
      aria-labelledby="convention-title"
      className="relative isolate overflow-hidden bg-background"
    >
      <CornerWaves className={`${corner} -top-6 -left-6`} />
      <CornerWaves className={`${corner} -top-6 -right-6 -scale-x-100`} />
      <CornerWaves className={`${corner} -bottom-6 -left-6 -scale-y-100`} />
      <CornerWaves className={`${corner} -right-6 -bottom-6 -scale-100`} />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:py-40">
        <Image
          src="/logo.jpg"
          alt=""
          width={112}
          height={112}
          className="size-24 mix-blend-multiply sm:size-28 dark:invert dark:mix-blend-screen"
        />

        <p className="mt-6 text-lg text-foreground sm:text-xl lg:text-2xl">
          <time dateTime="2026-01-29">
            29<sup className="text-[0.6em]">th</sup> Jan
          </time>
          {" – "}
          <time dateTime="2026-02-06">
            6<sup className="text-[0.6em]">th</sup> Feb
          </time>
          <span
            aria-hidden
            className="mx-3 inline-block h-[1.1em] w-px translate-y-[0.2em] bg-foreground/40"
          />
          <span>Bodh Gaya, India</span>
        </p>

        <h1
          id="convention-title"
          className="mt-3 text-balance text-4xl font-extrabold uppercase leading-[1.1] tracking-[0.02em] text-brand-cyan sm:text-5xl lg:text-6xl"
        >
          Buddhist Creators Convention 2026
        </h1>
      </div>
    </section>
  );
}
