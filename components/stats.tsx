"use client";

import * as React from "react";

const STATS = [
  {
    value: "10M+",
    label: "Total engagement",
    description:
      "Views, shares and conversations sparked by Dharma content from our creators.",
    Illustration: EngagementChart,
  },
  {
    value: "12+",
    label: "Countries united",
    description:
      "Monastics and lay creators collaborating across Asia, Europe and the Americas.",
    Illustration: CountriesGlobe,
  },
  {
    value: "110+",
    label: "Active creators",
    description:
      "Filmmakers, writers, musicians and designers publishing every month.",
    Illustration: CreatorsGrid,
  },
];

export function Stats() {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-100px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-labelledby="stats-title"
      data-visible={visible || undefined}
      className="stats bg-background"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <h2
          id="stats-title"
          className="mx-auto max-w-2xl text-balance text-center text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-4xl lg:text-5xl"
        >
          Join us in bringing the Dharma to the digital age
        </h2>

        <dl className="mt-12 grid gap-4 sm:grid-cols-3 lg:mt-16 lg:gap-6">
          {STATS.map(({ value, label, description, Illustration }, index) => (
            <div
              key={label}
              data-animate
              style={{ animationDelay: `${index * 100}ms` }}
              // Two nested rings read as a double border: a muted frame with a
              // hairline ring, then the white card with ring plus lift inside it.
              // Outer radius 16px = inner 12px + 4px padding (concentric).
              className="group/stat stat-card rounded-2xl border border-transparent bg-muted/40 p-1 shadow-ring"
            >
              <div className="overflow-hidden rounded-xl border border-transparent bg-card shadow-border">
                <div className="aspect-[16/10] overflow-hidden bg-muted/60">
                  <Illustration />
                </div>
                <div className="flex flex-col-reverse px-4 pt-5 pb-4">
                  <dt className="mt-1 text-sm font-medium text-foreground">
                    {label}
                  </dt>
                  <dd className="text-4xl font-semibold tabular-nums leading-none tracking-[-0.02em] text-brand-cyan lg:text-5xl">
                    {value}
                  </dd>
                  <p className="order-first mb-4 hidden" aria-hidden />
                </div>
                <p className="px-4 pb-5 text-sm leading-[1.5] text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* Illustrations. Each is a 320×200 SVG; entrance animations are driven by
   the `stat-*` classes in globals.css and start when the section is visible.

   Hover is a hover-effect on a marketing card, seen tens of times a day at
   most, so each card gets one quiet response: the accent marks grow a step
   and the fill deepens, 150ms on the `ease` hover token. The scale sits on
   leaf circles that carry no entrance keyframes, so transition and animation
   never fight. `group-hover` compiles under `@media (hover: hover)`, and
   `motion-safe` keeps the fill and background change but drops the scale
   under reduced motion. */

const halo =
  "origin-center [transform-box:fill-box] transition-transform duration-150 ease-hover motion-safe:group-hover/stat:scale-140";

const svgProps = {
  viewBox: "0 0 320 200",
  className: "size-full",
  "aria-hidden": true,
} as const;

function EngagementChart() {
  const line = "M24 150 C 64 146, 88 118, 124 120 S 180 84, 212 72 S 268 40, 296 30";
  return (
    <svg {...svgProps}>
      {[60, 100, 140].map((y) => (
        <line
          key={y}
          x1="24"
          x2="296"
          y1={y}
          y2={y}
          className="stroke-foreground/8"
          strokeWidth="1"
        />
      ))}
      <path
        d={`${line} L296 172 L24 172 Z`}
        className="stat-fill fill-brand-cyan/10 transition-[fill] duration-150 ease-hover group-hover/stat:fill-brand-cyan/16"
        data-animate
        style={{ animationDelay: "500ms" }}
      />
      <path
        d={line}
        pathLength={1}
        fill="none"
        className="stat-line stroke-brand-cyan"
        strokeWidth="3"
        strokeLinecap="round"
        data-animate
        style={{ animationDelay: "200ms" }}
      />
      <g data-animate className="stat-pop" style={{ animationDelay: "1300ms" }}>
        <circle cx="296" cy="30" r="10" className={`${halo} fill-brand-golden/25`} />
        <circle cx="296" cy="30" r="5" className="fill-brand-golden" />
      </g>
    </svg>
  );
}

const MARKERS: Array<[number, number]> = [
  [118, 70], [146, 58], [176, 64], [204, 80], [128, 96], [160, 100],
  [190, 108], [214, 118], [140, 128], [172, 136], [150, 154], [196, 146],
];

function CountriesGlobe() {
  return (
    <svg {...svgProps}>
      <g
        fill="none"
        strokeWidth="1"
        className="stroke-foreground/12 transition-[stroke] duration-150 ease-hover group-hover/stat:stroke-foreground/20"
      >
        <circle cx="160" cy="104" r="70" />
        <ellipse cx="160" cy="104" rx="70" ry="24" />
        <ellipse cx="160" cy="104" rx="70" ry="50" />
        <ellipse cx="160" cy="104" rx="24" ry="70" />
        <ellipse cx="160" cy="104" rx="50" ry="70" />
      </g>
      {MARKERS.map(([x, y], i) => (
        <g
          key={i}
          data-animate
          className="stat-pop"
          style={{ animationDelay: `${300 + i * 80}ms` }}
        >
          {/* Halos ripple outward from the first marker, 20ms apart. */}
          <circle
            cx={x}
            cy={y}
            r="7"
            className={`${halo} fill-brand-golden/25`}
            style={{ transitionDelay: `${i * 20}ms` }}
          />
          <circle cx={x} cy={y} r="3.5" className="fill-brand-golden" />
        </g>
      ))}
    </svg>
  );
}

const COLS = 8;
const ROWS = 3;
const TONES = [
  "fill-brand-cyan",
  "fill-brand-cyan/70",
  "fill-brand-cyan/40",
  "fill-brand-golden",
  "fill-brand-cyan/55",
  "fill-brand-cyan/85",
  "fill-brand-cyan/30",
];

function CreatorsGrid() {
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => i);
  return (
    <svg {...svgProps}>
      {cells.map((i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        return (
          <g
            key={i}
            data-animate
            className="stat-pop"
            style={{ animationDelay: `${200 + i * 30}ms` }}
          >
            {/* A wave left to right: one step up, 15ms per column. */}
            <circle
              cx={44 + col * 33}
              cy={58 + row * 42}
              r="11"
              className={`origin-center [transform-box:fill-box] transition-transform duration-150 ease-hover motion-safe:group-hover/stat:scale-110 ${TONES[(i * 5) % TONES.length]}`}
              style={{ transitionDelay: `${col * 15}ms` }}
            />
          </g>
        );
      })}
    </svg>
  );
}
