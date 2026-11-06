"use client";

/* One illustration per audience on the homepage's Find Your Place cards,
   drawn in the hairline language of components/hairline.tsx.

   Motion has two parts:

   1. An entrance (data-animate, CSS) that plays once when the card scrolls
      into view and settles within 3 seconds, on a finished picture. Anything
      that moves on its own past 5 seconds would need a visible pause control
      under WCAG 2.2.2, and these cards are links, which cannot hold a button.
   2. A pointer gesture (components/hairline-motion.ts). Where the pointer is
      drives a spring; what it chooses gets a 700ms cross-fade. Nothing moves
      without the pointer, and leaving the card returns the figure to its
      rest pose, which is the picture. The bright mark moves to what the
      pointer chose and the rest mark gives it up, so colour stays
      information. Hit testing uses the rest or target pose, never the pose
      on screen, so the geometry never lifts out from under the pointer.

   Reduced motion keeps the entrance fades and the cross-fades, and lands
   the springs at once. */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DOT,
  Dot,
  Solid,
  TONE,
  at,
  circle,
  flat,
  path,
  projector,
  roundPoly,
  rrect,
  svgProps,
  upright,
  type P2,
  type P3,
  type Projector,
} from "@/components/hairline";
import { clamp, usePointer, useSprings } from "@/components/hairline-motion";

const BOX = [320, 320] as const;
const svg = svgProps("0 0 320 320");

/* The 700ms ease-out for what the pointer chose. */
const choose = "transition-[opacity,stroke] duration-700 ease-drawer";

/* A golden light that cross-fades with the choice. Its entrance rides on
   the parent, so the fade and the choice never share one opacity. */
function Light({ at: [cx, cy], on, r = 2.5 }: { at: P2; on: boolean; r?: number }) {
  return (
    <circle
      cx={cx.toFixed(1)}
      cy={cy.toFixed(1)}
      r={r}
      className={cn(choose, DOT.on)}
      style={{ opacity: on ? 1 : 0 }}
    />
  );
}

/* --- As a creator: a phone face up on the ground, its reach ringing out to
   an audience. The play mark is the bright stroke. The reach follows the
   pointer, and every listener inside it is lit. */

const PHONE = rrect(-24, -48, 24, 48, 9);
const SCREEN = rrect(-20, -43, 20, 43, 6);
const PLAY = (() => {
  /* Points along screen right, which in the world is the x−y diagonal. */
  const d = Math.SQRT1_2;
  return roundPoly(
    [
      [12 * d, -12 * d],
      [-8 * d + 11 * d, 8 * d + 11 * d],
      [-8 * d - 11 * d, 8 * d - 11 * d],
    ],
    2.5,
    4,
  );
})();

const CREATOR_ORIGIN: P2 = [160, 166];
const REACH_REST = 70;
const REACH_MIN = 56;
const REACH_MAX = 100;
/* Guides either side of the reach at rest. */
const GUIDES = [45, 100];
const RING = circle(1, 64);

/* Listeners by ground radius and angle. The first sits just inside the
   reach at rest, so it is the lit one until the pointer reaches further. */
const AUDIENCE: Array<{ r: number; deg: number }> = [
  { r: 66, deg: 335 },
  { r: 76, deg: 200 },
  { r: 95, deg: 55 },
  { r: 95, deg: 150 },
  { r: 95, deg: 290 },
];

const ground = (r: number, deg: number): P3 => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a), 0];
};

/* The pointer, dropped onto the ground plane. */
const unproject = ([sx, sy]: P2, [ox, oy]: P2): P2 => {
  const u = sx - ox;
  const v = sy - oy;
  return [u / 2 + v, v - u / 2];
};

function CreatorArt() {
  const ref = React.useRef<SVGSVGElement>(null);
  const proj = React.useMemo(() => projector(CREATOR_ORIGIN), []);
  const { values, set } = useSprings([REACH_REST]);
  usePointer(ref, BOX, (p) => {
    if (!p) return set([REACH_REST]);
    const [x, y] = unproject(p, CREATOR_ORIGIN);
    set([clamp(Math.hypot(x, y), REACH_MIN, REACH_MAX)]);
  });
  const reach = values[0];
  const ringAt = (r: number) => path(flat(RING, 0).map(([x, y, z]) => proj([x * r, y * r, z])));

  return (
    <svg ref={ref} {...svg}>
      {GUIDES.map((r, i) => (
        <path key={r} d={ringAt(r)} data-animate className={cn("stat-fill", TONE.lo)} style={at(900 + i * 100)} />
      ))}
      <path d={ringAt(reach)} data-animate className={cn("stat-fill", TONE.mid)} style={at(1000)} />

      {AUDIENCE.map(({ r, deg }, i) => {
        const s = proj(ground(r, deg));
        return (
          <g key={deg} data-animate className="stat-fill" style={at(1300 + i * 80)}>
            <Dot at={s} delay={0} />
            <Light at={s} on={r <= reach + 3} />
          </g>
        );
      })}

      <Solid proj={proj} foot={flat(PHONE, 0)} top={flat(PHONE, 6)} crease={flat(SCREEN, 6)} delay={150} />
      <Dot at={proj([0, -38, 6])} tone="off" r={1.5} delay={600} />
      <Solid proj={proj} foot={flat(PLAY, 6)} top={flat(PLAY, 11)} tone="hi" delay={750} />
    </svg>
  );
}

/* --- As an institution: the Dharma wheel standing on a plinth, eight spokes
   for the eightfold path. The hub is the bright stroke and holds the lit
   dot at rest. The wheel turns with the pointer, and the spoke nearest it
   takes the light. */

const PARTNER_ORIGIN: P2 = [160, 196];
/* The plinth and the inset line on its top face that gives it thickness. */
const PLINTH = rrect(-72, -9, 72, 9, 8);
const PLINTH_TOP = rrect(-69, -6, 69, 6, 5);
const WHEEL_R = 64;
const WHEEL_Z = 4 + WHEEL_R;
const SPOKE_IN = 16;
const SPOKE_OUT = 57;
const SPOKES = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4 + Math.PI / 8);
/* A quarter turn of the wheel across half the card: a hover is seen many
   times a day, so the wheel answers the pointer without ever spinning. */
const TURN_PER_UNIT = Math.PI / 2 / 160;
/* A heavy wheel: a soft, critically damped spring, slow to start and stop. */
const WHEEL_SPRING = { k: 40, c: 12.6 };
/* How near the pointer must come to a spoke's end to choose it. */
const CHOOSE_WITHIN = 48;

/* A point on the wheel's front face, at radius r and angle a. */
const onWheel = (r: number, a: number): P3 => [r * Math.cos(a), 3, WHEEL_Z + r * Math.sin(a)];

const spokeEnd = (proj: Projector, a: number, turn: number) => proj(onWheel(SPOKE_OUT, a + turn));

function PartnerArt() {
  const ref = React.useRef<SVGSVGElement>(null);
  const proj = React.useMemo(() => projector(PARTNER_ORIGIN), []);
  const { values, set } = useSprings([0], WHEEL_SPRING);
  const [chosen, setChosen] = React.useState<number | null>(null);
  usePointer(ref, BOX, (p) => {
    if (!p) {
      set([0]);
      setChosen(null);
      return;
    }
    const turn = (p[0] - PARTNER_ORIGIN[0]) * TURN_PER_UNIT;
    set([turn]);
    /* Choose against the target pose, not the one on screen. */
    let best: number | null = null;
    let bestD = CHOOSE_WITHIN;
    SPOKES.forEach((a, i) => {
      const [x, y] = spokeEnd(proj, a, turn);
      const d = Math.hypot(x - p[0], y - p[1]);
      if (d < bestD) {
        best = i;
        bestD = d;
      }
    });
    setChosen(best);
  });
  const turn = values[0];
  const front = (r: number) => upright(circle(r), 3, WHEEL_Z);

  return (
    <svg ref={ref} {...svg}>
      <Solid
        proj={proj}
        foot={flat(PLINTH, 0)}
        top={flat(PLINTH, 4)}
        crease={flat(PLINTH_TOP, 4)}
        tone="mid"
        creaseTone="lo"
        delay={100}
      />

      <Solid
        proj={proj}
        foot={upright(circle(WHEEL_R), -3, WHEEL_Z)}
        top={front(WHEEL_R)}
        crease={front(WHEEL_R - 7)}
        delay={250}
      />

      {SPOKES.map((a, i) => {
        const [x1, y1] = proj(onWheel(SPOKE_IN, a + turn));
        const [x2, y2] = spokeEnd(proj, a, turn);
        return (
          <path
            key={i}
            d={`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`}
            pathLength={1}
            data-animate
            className={cn("stat-line", TONE.mid)}
            style={at(800 + i * 60, 400)}
          />
        );
      })}

      {SPOKES.map((a, i) => {
        const p = spokeEnd(proj, a, turn);
        return (
          <g key={i} data-animate className="stat-fill" style={at(1300 + i * 60)}>
            <Dot at={p} delay={0} />
            <Light at={p} on={chosen === i} />
          </g>
        );
      })}

      <Solid
        proj={proj}
        foot={front(SPOKE_IN)}
        top={upright(circle(SPOKE_IN), 9, WHEEL_Z)}
        crease={upright(circle(12), 9, WHEEL_Z)}
        tone="hi"
        delay={1150}
      />
      <g data-animate className="stat-fill" style={at(1500)}>
        <Light at={proj([0, 9, WHEEL_Z])} on={chosen === null} />
      </g>
    </svg>
  );
}

/* --- As an individual: three butter lamps on a plinth. The front lamp is
   lit at rest, its bowl the bright stroke. The flames lean away from the
   pointer as if from a breath, and the lamp nearest the pointer takes the
   light. */

const SUPPORT_ORIGIN: P2 = [160, 178];
const LAMP_PLINTH = rrect(-108, -24, 108, 24, 10);
const LAMP_PLINTH_TOP = rrect(-105, -21, 105, 21, 7);
const LAMP_X = [-70, 0, 70];
const LIT_AT_REST = 2;
const RIM_Z = 46;
const LEAN_MAX = 6;

/* The flame, its upper half leaning by l screen units. */
const flame = (l: number) => {
  const f = (n: number) => n.toFixed(1);
  return `M0 0C5 -5 ${f(7 + l * 0.4)} -10 ${f(7 + l)} -13C${f(7 + l)} -17 ${f(4 + l)} -20 ${f(l)} -20C${f(-4 + l)} -20 ${f(-7 + l)} -17 ${f(-7 + l)} -13C${f(-7 + l * 0.4)} -10 -5 -5 0 0Z`;
};

function SupportArt() {
  const ref = React.useRef<SVGSVGElement>(null);
  const proj = React.useMemo(() => projector(SUPPORT_ORIGIN), []);
  const rims = React.useMemo(() => LAMP_X.map((x) => proj([x, 0, RIM_Z])), [proj]);
  const { values, set } = useSprings([0, 0, 0]);
  const [chosen, setChosen] = React.useState(LIT_AT_REST);
  usePointer(ref, BOX, (p) => {
    if (!p) {
      set([0, 0, 0]);
      setChosen(LIT_AT_REST);
      return;
    }
    /* Each flame leans away from the pointer, more the nearer it is. */
    set(
      rims.map(([fx, fy]) => {
        const dx = p[0] - fx;
        const near = Math.exp(-(((p[1] - fy) / 120) ** 2));
        return -clamp(dx / 14, -LEAN_MAX, LEAN_MAX) * near;
      }),
    );
    /* Choose by the rest pose: the lamp whose rim is nearest on screen. */
    let best = 0;
    rims.forEach(([fx, fy], i) => {
      if (Math.hypot(fx - p[0], fy - p[1]) < Math.hypot(rims[best][0] - p[0], rims[best][1] - p[1])) best = i;
    });
    setChosen(best);
  });

  return (
    <svg ref={ref} {...svg}>
      <Solid
        proj={proj}
        foot={flat(LAMP_PLINTH, 0)}
        top={flat(LAMP_PLINTH, 4)}
        crease={flat(LAMP_PLINTH_TOP, 4)}
        tone="mid"
        creaseTone="lo"
        delay={100}
      />

      {LAMP_X.map((x, i) => {
        const delay = 250 + i * 200;
        const lit = chosen === i;
        const [fx, fy] = rims[i];
        const lean = values[i];
        return (
          <g key={x}>
            <Solid
              proj={proj}
              foot={flat(circle(13), 4, x)}
              top={flat(circle(13), 7, x)}
              crease={flat(circle(9), 7, x)}
              delay={delay}
            />
            <Solid proj={proj} foot={flat(circle(4.5), 7, x)} top={flat(circle(4.5), 26, x)} delay={delay + 100} />
            <Solid
              proj={proj}
              foot={flat(circle(11), 26, x)}
              top={flat(circle(19), RIM_Z, x)}
              crease={flat(circle(14), RIM_Z, x)}
              tone={lit ? "hi" : "edge"}
              strokeClassName={choose}
              delay={delay + 200}
            />
            <g transform={`translate(${fx.toFixed(1)} ${(fy - 1).toFixed(1)})`}>
              <path
                d={flame(lean)}
                data-animate
                className={cn("stat-fill", choose, lit ? TONE.mid : TONE.lo)}
                style={at(delay + 600)}
              />
              <g data-animate className="stat-fill" style={at(delay + 800)}>
                <Light at={[lean * 0.45, -8]} on={lit} r={3} />
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

const ART = {
  creator: CreatorArt,
  partner: PartnerArt,
  support: SupportArt,
} as const;

/* One component by audience id, since a server component can render a
   client component but cannot look inside a client module's objects. */
export function JoinArt({ id }: { id: keyof typeof ART }) {
  const Art = ART[id];
  return <Art />;
}
