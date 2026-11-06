/* The hairline drawing language, shared by every isometric figure on the
   site (the Find Your Place cards, the hairline stats cards).

   - One projection, the 2:1 view: x runs right and down, y runs left and
     down, z straight up. Every ring is laid out in world units and projected
     once, so nothing is drawn in screen space except dots and flames.
   - One stroke weight, 1 viewBox unit, which lands near 1px at the card's
     rendered size. Hierarchy comes from tone, never from width: the
     silhouette is the darkest line, the crease inside it dimmer, guides on
     the ground dimmest.
   - A solid is the hull of two rounded rings, its foot and its top. Vertical
     corners are never drawn. The top edge is one crease a few units inside
     the silhouette. The silhouette is filled with the ground colour (the
     plate), so it hides what is behind it, and the paint order runs back to
     front.
   - Colour is information, not decoration. One stroke per figure moves to
     brand cyan, where the eye should start, and one dot is lit in brand
     golden. Everything else is a grey of the foreground.
   - No words inside the figure.

   Entrances use the stat-* classes in globals.css and wait for the figure's
   InView wrapper. Pointer gestures are in hairline-motion.ts and listen on
   the figure's .art-host, the card around it. */

import { cn } from "@/lib/utils";

export type P2 = [number, number];
export type P3 = [number, number, number];
export type Timing = { animationDelay: string; animationDuration?: string };

export const at = (ms: number, duration?: number): Timing => ({
  animationDelay: `${ms}ms`,
  ...(duration ? { animationDuration: `${duration}ms` } : {}),
});

/* --- Projection. */

export type Projector = (p: P3) => P2;

/* 2:1 projection about a screen origin. */
export const projector =
  ([ox, oy]: P2): Projector =>
  ([x, y, z]) => [ox + (x - y), oy + (x + y) / 2 - z];

/* A projector that centres the given world points in a viewBox. */
export function centred(points: P3[], [w, h]: P2): Projector {
  const raw = projector([0, 0]);
  const xs = points.map((p) => raw(p)[0]);
  const ys = points.map((p) => raw(p)[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return projector([w / 2 - cx, h / 2 - cy]);
}

/* Which way the camera looks, so a surface point is visible when its
   normal faces this. */
export const TOWARD_CAMERA: P3 = [1, 1, 1];
export const faces = ([nx, ny, nz]: P3) =>
  nx * TOWARD_CAMERA[0] + ny * TOWARD_CAMERA[1] + nz * TOWARD_CAMERA[2] > 0;

/* --- Rings. */

const unit = (x: number, y: number): P2 => {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
};

/* Rounds every corner of a convex polygon with radius r, `steps` segments
   per corner. Four corners at 6 steps give a rounded rectangle of 28 sides. */
export function roundPoly(pts: P2[], r: number, steps = 6): P2[] {
  const n = pts.length;
  const out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i + n - 1) % n];
    const b = pts[(i + 1) % n];
    const [uax, uay] = unit(a[0] - p[0], a[1] - p[1]);
    const [ubx, uby] = unit(b[0] - p[0], b[1] - p[1]);
    const theta = Math.acos(Math.max(-1, Math.min(1, uax * ubx + uay * uby)));
    const tangent = r / Math.tan(theta / 2);
    const [bx, by] = unit(uax + ubx, uay + uby);
    const reach = r / Math.sin(theta / 2);
    const c: P2 = [p[0] + bx * reach, p[1] + by * reach];
    const t1: P2 = [p[0] + uax * tangent, p[1] + uay * tangent];
    const t2: P2 = [p[0] + ubx * tangent, p[1] + uby * tangent];
    const a1 = Math.atan2(t1[1] - c[1], t1[0] - c[0]);
    let da = Math.atan2(t2[1] - c[1], t2[0] - c[0]) - a1;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    for (let s = 0; s <= steps; s++) {
      const ang = a1 + (da * s) / steps;
      out.push([c[0] + r * Math.cos(ang), c[1] + r * Math.sin(ang)]);
    }
  }
  return out;
}

export const rect = (x0: number, y0: number, x1: number, y1: number): P2[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

export const rrect = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  roundPoly(rect(x0, y0, x1, y1), r);

export const circle = (r: number, n = 48): P2[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    return [r * Math.cos(a), r * Math.sin(a)];
  });

/* A ring lying on the ground plane at height z. */
export const flat = (ring: P2[], z: number, dx = 0, dy = 0): P3[] =>
  ring.map(([x, y]) => [x + dx, y + dy, z]);

/* A ring standing in the x-z plane at depth y, centred at height cz. */
export const upright = (ring: P2[], y: number, cz: number): P3[] =>
  ring.map(([u, v]) => [u, y, cz + v]);

/* Convex hull of projected points, Andrew's monotone chain. */
export function hull(pts: P2[]): P2[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: P2, a: P2, b: P2) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: P2[] = [];
  for (const p of s) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper: P2[] = [];
  for (const p of [...s].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export const path = (pts: P2[], closed = true) =>
  `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}${closed ? "Z" : ""}`;

/* --- Tones. One stroke weight, set on the svg; the tone carries hierarchy. */

export const TONE = {
  hi: "stroke-brand-cyan",
  edge: "stroke-foreground/45",
  mid: "stroke-foreground/28",
  lo: "stroke-foreground/14",
} as const;

export const DOT = {
  on: "fill-brand-golden",
  dot: "fill-foreground/35",
  off: "fill-foreground/14",
} as const;

export const svgProps = (viewBox: string) =>
  ({
    viewBox,
    className: "size-full",
    fill: "none",
    strokeWidth: 1,
    strokeLinejoin: "round",
    strokeLinecap: "round",
    "aria-hidden": true,
  }) as const;

/* --- Parts. */

/* A solid: the silhouette is the hull of its foot and top rings, filled with
   the plate colour and drawn in; the crease is one dim ring inside the top,
   faded in once the silhouette has landed. */
export function Solid({
  proj,
  foot,
  top,
  crease,
  tone = "edge",
  creaseTone = "mid",
  strokeClassName,
  delay,
}: {
  proj: Projector;
  foot: P3[];
  top: P3[];
  crease?: P3[];
  tone?: keyof typeof TONE;
  /** The crease sits one step dimmer than the silhouette. */
  creaseTone?: keyof typeof TONE;
  /** Extra classes on the silhouette stroke, such as a stroke transition. */
  strokeClassName?: string;
  delay: number;
}) {
  const sil = path(hull([...foot.map(proj), ...top.map(proj)]));
  return (
    <>
      <path d={sil} data-animate className="art-plate stat-fill" style={at(delay)} />
      <path
        d={sil}
        pathLength={1}
        data-animate
        className={cn("stat-line", TONE[tone], strokeClassName)}
        style={at(delay, 700)}
      />
      {crease && (
        <path
          d={path(crease.map(proj))}
          data-animate
          className={cn("stat-fill", TONE[creaseTone])}
          style={at(delay + 350)}
        />
      )}
    </>
  );
}

/* An open line on a surface, drawn in. */
export function Stroke({
  d,
  tone = "mid",
  delay,
  duration = 400,
}: {
  d: string;
  tone?: keyof typeof TONE;
  delay: number;
  duration?: number;
}) {
  return (
    <path
      d={d}
      pathLength={1}
      data-animate
      className={cn("stat-line", TONE[tone])}
      style={at(delay, duration)}
    />
  );
}

export function Dot({
  at: [cx, cy],
  tone = "dot",
  delay,
  r = 2.5,
}: {
  at: P2;
  tone?: keyof typeof DOT;
  delay: number;
  r?: number;
}) {
  return (
    <circle
      cx={cx.toFixed(1)}
      cy={cy.toFixed(1)}
      r={r}
      data-animate
      className={cn("stat-fill", DOT[tone])}
      style={at(delay)}
    />
  );
}
