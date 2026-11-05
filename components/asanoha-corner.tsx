import { useId } from "react";
import { cn } from "@/lib/utils";

/* Asanoha (hemp leaf) lattice: a hexagonal grid where every hexagon is split
   into six triangles, and each triangle is joined from its centroid to its
   three corners. Only one rectangular tile of the grid is drawn and the SVG
   pattern repeats it, so the markup stays small at any size. Lines are
   opaque and the whole SVG is faded, so lines that meet composite once
   instead of stacking into lighter joints. Same footprint, placement and
   mask as WaveCorner so the two are interchangeable in a hero. */

const S = 56; // hexagon circumradius
const H = Math.sqrt(3) * S; // flat-top hexagon height
const TILE_W = 3 * S;
const TILE_H = H;

const f = (n: number) => Number(n.toFixed(2));

function hexagon(cx: number, cy: number): string {
  const corners = Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k;
    return [cx + S * Math.cos(a), cy + S * Math.sin(a)] as const;
  });
  let d = "";
  for (let k = 0; k < 6; k++) {
    const [x1, y1] = corners[k];
    const [x2, y2] = corners[(k + 1) % 6];
    const gx = (cx + x1 + x2) / 3;
    const gy = (cy + y1 + y2) / 3;
    d +=
      `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}` +
      `M${f(cx)} ${f(cy)}L${f(x1)} ${f(y1)}` +
      `M${f(gx)} ${f(gy)}L${f(cx)} ${f(cy)}` +
      `M${f(gx)} ${f(gy)}L${f(x1)} ${f(y1)}` +
      `M${f(gx)} ${f(gy)}L${f(x2)} ${f(y2)}`;
  }
  return d;
}

// Hexagons at the tile's four corners plus its centre; the tile edges clip
// them and the neighbouring tiles complete them.
const TILE_PATH = (
  [
    [0, 0],
    [TILE_W, 0],
    [0, TILE_H],
    [TILE_W, TILE_H],
    [TILE_W / 2, TILE_H / 2],
  ] as const
)
  .map(([x, y]) => hexagon(x, y))
  .join("");

export function AsanohaCorner({ className }: { className?: string }) {
  const patternId = useId();

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
      <defs>
        <pattern
          id={patternId}
          width={f(TILE_W)}
          height={f(TILE_H)}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={TILE_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth={6}
            strokeLinecap="round"
          />
        </pattern>
      </defs>
      <rect width="320" height="320" fill={`url(#${patternId})`} />
    </svg>
  );
}
