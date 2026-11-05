/* One illustration per audience on the homepage's Find Your Place cards, in
   the drawing language of the stats cards: brand cyan line, golden accents
   with a soft halo, faint foreground guides.

   Motion has two parts, and both are CSS on transform and opacity only:

   1. An entrance (data-animate) that plays once when the card scrolls into
      view and settles within 3 seconds, on a finished picture. Anything that
      moves on its own past 5 seconds would need a visible pause control under
      WCAG 2.2.2, and these cards are links, which cannot hold a button.
   2. A slow loop (data-loop) that runs only while the card is hovered or
      keyboard-focused. It pauses in place rather than resetting, so leaving
      the card never snaps.

   The two sit on nested elements so their transforms never fight. Classes
   and keyframes are in globals.css. Reduced motion keeps the fades and drops
   the movement, the loops included. */

type Timing = { animationDelay: string; animationDuration?: string };

const at = (ms: number, duration?: number): Timing => ({
  animationDelay: `${ms}ms`,
  ...(duration ? { animationDuration: `${duration}ms` } : {}),
});

const svgProps = {
  viewBox: "0 0 320 320",
  className: "size-full",
  "aria-hidden": true,
} as const;

/* A golden marker in its halo, the recipe from the stats globe. */
function Marker({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <g data-animate className="stat-pop" style={at(delay)}>
      <circle cx={x} cy={y} r="10" className="fill-brand-golden/25" />
      <circle cx={x} cy={y} r="5" className="fill-brand-golden" />
    </g>
  );
}

/* --- As a creator: a video on a phone, its reach rippling out to an audience. */

const PHONE =
  "M130 72H190A18 18 0 0 1 208 90V230A18 18 0 0 1 190 248H130A18 18 0 0 1 112 230V90A18 18 0 0 1 130 72Z";

/* One ring repeated at three points of the art-ripple loop. Each frozen
   frame is written out too, so the rings hold these sizes under reduced
   motion, where the loop is never declared. */
const RIPPLES = [
  { scale: 0.63, opacity: 0.94, phase: "-0.72s", delay: 1050 },
  { scale: 0.825, opacity: 0.59, phase: "-1.8s", delay: 1150 },
  { scale: 1.02, opacity: 0.24, phase: "-2.88s", delay: 1250 },
];

const AUDIENCE: Array<[number, number]> = [
  [60, 123],
  [242, 91],
  [78, 229],
  [285, 205],
  [75, 58],
  [226, 275],
];

function CreatorArt() {
  return (
    <svg {...svgProps}>
      <g fill="none" strokeWidth="2" className="stroke-brand-cyan/40">
        {RIPPLES.map(({ scale, opacity, phase, delay }) => (
          <g key={phase} data-animate className="stat-pop" style={at(delay)}>
            <circle
              cx="160"
              cy="160"
              r="130"
              data-loop
              className="art-ripple"
              style={{ transform: `scale(${scale})`, opacity, animationDelay: phase }}
            />
          </g>
        ))}
      </g>

      {AUDIENCE.map(([x, y], i) => (
        <Marker key={`${x}-${y}`} x={x} y={y} delay={1400 + i * 80} />
      ))}

      <path d={PHONE} data-animate className="stat-fill fill-card" style={at(150)} />
      <path
        d={PHONE}
        pathLength={1}
        fill="none"
        strokeWidth="3"
        data-animate
        className="stat-line stroke-brand-cyan"
        style={at(150, 800)}
      />

      <g data-animate className="stat-fill" style={at(600)}>
        <rect x="148" y="84" width="24" height="4" rx="2" className="fill-foreground/15" />
        <rect x="128" y="206" width="64" height="5" rx="2.5" className="fill-foreground/15" />
        <rect x="128" y="218" width="40" height="5" rx="2.5" className="fill-foreground/15" />
      </g>

      {/* The triangle's centroid, not its box, sits on the disc's centre. */}
      <g data-animate className="stat-pop" style={at(850)}>
        <circle cx="160" cy="150" r="30" className="fill-brand-golden/25" />
        <path
          d="M152 134L176 150L152 166Z"
          strokeWidth="5"
          strokeLinejoin="round"
          className="fill-brand-golden stroke-brand-golden"
        />
      </g>
    </svg>
  );
}

/* --- As an institution: the Dharma wheel, each spoke holding the rim up.
   Eight spokes because the wheel has eight, the noble eightfold path. */

const polar = (r: number, degrees: number) => {
  const a = (degrees * Math.PI) / 180;
  return [160 + r * Math.cos(a), 160 + r * Math.sin(a)].map((n) =>
    Number(n.toFixed(2)),
  ) as [number, number];
};

const RIM = "M256 160A96 96 0 1 1 64 160A96 96 0 1 1 256 160Z";
const SPOKES = Array.from({ length: 8 }, (_, i) => i * 45);

function PartnerArt() {
  return (
    <svg {...svgProps}>
      <circle
        cx="160"
        cy="160"
        r="130"
        fill="none"
        strokeWidth="1"
        data-animate
        className="stat-fill stroke-foreground/12"
        style={at(100)}
      />

      <g data-loop className="art-spin">
        <path d={RIM} data-animate className="stat-fill fill-card" style={at(150)} />
        <path
          d={RIM}
          pathLength={1}
          fill="none"
          strokeWidth="3"
          data-animate
          className="stat-line stroke-brand-cyan"
          style={at(150, 800)}
        />

        {SPOKES.map((degrees, i) => {
          const [x1, y1] = polar(22, degrees);
          const [x2, y2] = polar(96, degrees);
          return (
            <path
              key={degrees}
              d={`M${x1} ${y1}L${x2} ${y2}`}
              pathLength={1}
              fill="none"
              strokeWidth="3"
              data-animate
              className="stat-line stroke-brand-cyan"
              style={at(600 + i * 70, 400)}
            />
          );
        })}

        <g data-animate className="stat-pop" style={at(1250)}>
          <circle cx="160" cy="160" r="22" strokeWidth="3" className="fill-card stroke-brand-cyan" />
          <circle cx="160" cy="160" r="8" className="fill-brand-golden" />
        </g>

        {SPOKES.map((degrees, i) => {
          const [x, y] = polar(96, degrees);
          return <Marker key={degrees} x={x} y={y} delay={1400 + i * 70} />;
        })}
      </g>
    </svg>
  );
}

/* --- As an individual: one lamp lights the next. A spark carries the flame
   along the row, each lamp lit by the one before it. */

const LAMP =
  "M-32 0H32C32 22 14 30 6 33V58C6 63 22 65 22 74H-22C-22 65 -6 63 -6 58V33C-14 30 -32 22 -32 0Z";
const FLAME = "M0 -46C11 -32 15 -24 15 -16C15 -6 8 -1 0 -1C-8 -1 -15 -6 -15 -16C-15 -24 -11 -32 0 -46Z";
const FLAME_CORE = "M0 -26C5 -20 7 -15 7 -11C7 -6 4 -3 0 -3C-4 -3 -7 -6 -7 -11C-7 -15 -5 -20 0 -26Z";

/* Rim height, and the three lamps. Durations differ so the flames never
   move in step. */
const RIM_Y = 150;
const LAMPS = [
  { x: 72, draw: 100, light: 900, flicker: "1.3s" },
  { x: 160, draw: 200, light: 1600, flicker: "1.7s" },
  { x: 248, draw: 300, light: 2300, flicker: "1.5s" },
];
/* Each spark leaves one flame just before the next lamp lights. */
const SPARKS = [
  { x: 72, delay: 1150 },
  { x: 160, delay: 1850 },
];

function SupportArt() {
  return (
    <svg {...svgProps}>
      <path
        d={`M32 ${RIM_Y + 74}H288`}
        fill="none"
        strokeWidth="1"
        data-animate
        className="stat-fill stroke-foreground/12"
        style={at(100)}
      />

      {LAMPS.map(({ x, draw, light, flicker }) => (
        <g key={x} transform={`translate(${x} ${RIM_Y})`}>
          <g data-animate className="stat-fill" style={at(light)}>
            <circle
              cy="-20"
              r="30"
              data-loop
              className="art-glow fill-brand-golden/20"
              style={{ animationDuration: flicker }}
            />
          </g>

          <path d={LAMP} data-animate className="stat-fill fill-card" style={at(draw)} />
          <path
            d={LAMP}
            pathLength={1}
            fill="none"
            strokeWidth="3"
            strokeLinejoin="round"
            data-animate
            className="stat-line stroke-brand-cyan"
            style={at(draw, 800)}
          />
          <path
            d="M0 0V-6"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            data-animate
            className="stat-fill stroke-foreground/40"
            style={at(draw + 400)}
          />

          {/* Grows from the wick, and the flicker holds that same base. */}
          <g data-animate className="art-ignite" style={at(light)}>
            <g data-loop className="art-flicker" style={{ animationDuration: flicker }}>
              <path d={FLAME} className="fill-brand-golden" />
              <path d={FLAME_CORE} className="fill-white/60" />
            </g>
          </g>
        </g>
      ))}

      {SPARKS.map(({ x, delay }) => (
        <g key={x} transform={`translate(${x} ${RIM_Y - 40})`}>
          <g data-animate className="art-spark" style={at(delay)}>
            <circle r="9" className="fill-brand-golden/25" />
            <circle r="4" className="fill-brand-golden" />
          </g>
        </g>
      ))}
    </svg>
  );
}

export const JOIN_ART = {
  creator: CreatorArt,
  partner: PartnerArt,
  support: SupportArt,
} as const;
