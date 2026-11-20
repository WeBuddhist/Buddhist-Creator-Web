import * as THREE from "three";

/* The awards medal's body: a struck coin, not a turned disc. Its outline
   wanders a little and has a chip bitten out of it and a lump where the
   metal spread under the die; each face is a flat field inside a raised
   rim, as on the medal itself, with two dents and a low swelling on one
   side; the whole flan is bent a touch; its outer edge is turned and
   polished, true but for the faintest waver. All of it is fixed numbers, so the medal is the same object
   on every visit.

   It is one surface, drawn as one grid that runs from the middle of the
   lion side out to its rim, round the rounded edge, and in across the
   other side to its middle. Sharing the rim's rows with both faces keeps
   the light running smoothly over the edge. Three groups give the lion
   side, the edge and the other side their own materials.

   Units: the medal is 2 across (radius 1), lying in the x-y plane, the
   lion side facing +z, its top at +y. */

export const MEDAL = {
  /** Half the thickness at the middle of each face. */
  half: 0.076,
  /** How far in from the outline the faces end and the rounded rim begins,
      as a share of the radius. The relief maps end at the same place
      (FACE in scripts/medal-textures.mjs). */
  rim: 0.045,
  /** How far the raised rim stands above the field, and where it rises,
      as shares of the face's reach. The relief maps fade out before it
      (scripts/medal-textures.mjs), so the rim is plain polished metal. */
  lip: 0.016,
  lipFrom: 0.895,
  lipTo: 0.93,
} as const;

const SEGMENTS = 224;
const RINGS = 44;
const EDGE = 12;

const TAU = Math.PI * 2;
const bump = (distance: number, width: number) => Math.exp(-((distance / width) ** 2));
/** The shortest way round between two angles. */
const turn = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

/** A smooth, repeatable roughness: a few waves at odd angles. */
const ripple = (a: number, b: number) =>
  Math.sin(a * 37.1 + b * 3.3) * 0.5 + Math.sin(a * 61.7 - b * 5.9 + 1.7) * 0.3 + Math.sin(a * 97.3 + 4.1) * 0.2;

const CHIP = 0.62; // up and to the right of the lion's tail
const LUMP = 3.95; // low on the left, under the triratna

/** The outline's radius at an angle. */
function outline(theta: number) {
  return (
    1 +
    0.011 * Math.cos(2 * theta + 0.7) +
    0.008 * Math.cos(3 * theta + 2.1) +
    0.005 * Math.cos(5 * theta + 4.0) +
    0.003 * Math.cos(9 * theta + 1.3) -
    0.05 * bump(turn(theta, CHIP), 0.1) +
    0.02 * bump(turn(theta, LUMP), 0.24)
  );
}

const DENTS = [
  // [x, y, depth, width]: a knock near the edge, a shallow press, a swelling.
  [Math.cos(2.35) * 0.83, Math.sin(2.35) * 0.83, -0.016, 0.085],
  [Math.cos(5.3) * 0.58, Math.sin(5.3) * 0.58, -0.007, 0.16],
  [Math.cos(LUMP) * 0.86, Math.sin(LUMP) * 0.86, 0.007, 0.16],
] as const;

const smoothstep = (from: number, to: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

/** How far out a face's ring lies, as a share of the face's reach. The
    rings crowd toward the rim, so the step up to it is crisp. */
const ringReach = (ring: number) => {
  const OPEN = 32; // rings across the field, the rest across the rim
  return ring <= OPEN ? (ring / OPEN) * 0.86 : 0.86 + ((ring - OPEN) / (RINGS - OPEN)) * 0.14;
};

/** How far a face stands out from the middle plane at (x, y). */
function faceHeight(x: number, y: number, side: 1 | -1) {
  const rho = Math.hypot(x, y);
  const theta = Math.atan2(y, x);
  const reach = rho / (outline(theta) - MEDAL.rim);
  // Nearly flat, with the faintest swell, and the rim raised round it.
  let h = MEDAL.half * (1 + 0.05 * (1 - rho * rho)) + MEDAL.lip * smoothstep(MEDAL.lipFrom, MEDAL.lipTo, reach);
  // Thinner where the chip is: the metal ran short there.
  h *= 1 - 0.3 * bump(turn(theta, CHIP), 0.22) * rho * rho;
  if (side === 1) {
    for (const [dx, dy, depth, width] of DENTS) h += depth * bump(Math.hypot(x - dx, y - dy), width);
  } else {
    h += -0.009 * bump(Math.hypot(x - 0.42, y + 0.55), 0.13);
  }
  return h;
}

/** The bend of the whole flan, added to every point's depth. */
const bend = (x: number, y: number) => 0.022 * x * x - 0.012 * x * y + 0.006 * y;

export function medalGeometry() {
  // Rows: the lion side's rings (middle to rim), the edge's steps, the
  // other side's rings (rim to middle).
  const rows = RINGS + 1 + (EDGE - 1) + RINGS + 1;
  const positions = new Float32Array(rows * SEGMENTS * 3);
  const uvs = new Float32Array(rows * SEGMENTS * 2);

  let row = 0;
  const put = (x: number, y: number, z: number, u: number, v: number) => {
    return (column: number) => {
      const i = row * SEGMENTS + column;
      positions.set([x, y, z + bend(x, y)], i * 3);
      uvs.set([u, v], i * 2);
    };
  };

  // The lion side, middle out. The relief map spans the nominal circle,
  // so a point's map position is just where it is.
  for (let ring = 0; ring <= RINGS; ring++, row++) {
    for (let column = 0; column < SEGMENTS; column++) {
      const theta = (column / SEGMENTS) * TAU;
      const reach = (outline(theta) - MEDAL.rim) * ringReach(ring);
      const x = Math.cos(theta) * reach;
      const y = Math.sin(theta) * reach;
      put(x, y, faceHeight(x, y, 1), 0.5 + x / 2, 0.5 + y / 2)(column);
    }
  }

  // The edge: round from the lion side's rim to the other side's, bulging
  // out to the outline half way, with a little roughness along it.
  for (let step = 1; step < EDGE; step++, row++) {
    const phi = (step / EDGE) * Math.PI;
    for (let column = 0; column < SEGMENTS; column++) {
      const theta = (column / SEGMENTS) * TAU;
      const r = outline(theta);
      const inner = r - MEDAL.rim;
      const cx = Math.cos(theta) * inner;
      const cy = Math.sin(theta) * inner;
      const top = faceHeight(cx, cy, 1);
      const bottom = -faceHeight(cx, cy, -1);
      // A squarer round than a half circle: the side wall stands nearly
      // straight, as on the medal, and turns into the faces at the corners.
      const out = Math.sign(Math.sin(phi)) * Math.abs(Math.sin(phi)) ** 0.45;
      const reach = inner + MEDAL.rim * out * (1 + 0.025 * ripple(theta, phi));
      const z = (top + bottom) / 2 + ((top - bottom) / 2) * Math.cos(phi);
      put(Math.cos(theta) * reach, Math.sin(theta) * reach, z, 0, 0)(column);
    }
  }

  // The other side, rim in. Its map is mirrored, so its lettering reads
  // the right way round from behind.
  for (let ring = RINGS; ring >= 0; ring--, row++) {
    for (let column = 0; column < SEGMENTS; column++) {
      const theta = (column / SEGMENTS) * TAU;
      const reach = (outline(theta) - MEDAL.rim) * ringReach(ring);
      const x = Math.cos(theta) * reach;
      const y = Math.sin(theta) * reach;
      put(x, y, -faceHeight(x, y, -1), 0.5 - x / 2, 0.5 + y / 2)(column);
    }
  }

  const indices: number[] = [];
  const quads = (from: number, to: number) => {
    const start = indices.length;
    for (let r = from; r < to; r++)
      for (let column = 0; column < SEGMENTS; column++) {
        const next = (column + 1) % SEGMENTS;
        const a = r * SEGMENTS + column;
        const b = r * SEGMENTS + next;
        const c = (r + 1) * SEGMENTS + column;
        const d = (r + 1) * SEGMENTS + next;
        // Counter-clockwise seen from outside: rows run outward, then down
        // the edge, then inward, so (next row) × (next column) points out.
        indices.push(a, c, b, b, c, d);
      }
    return { start, count: indices.length - start };
  };

  const lionRows = RINGS; // quads between the lion side's rings
  const front = quads(0, lionRows);
  const edge = quads(lionRows, lionRows + EDGE);
  const back = quads(lionRows + EDGE, rows - 1);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.addGroup(front.start, front.count, 0);
  geometry.addGroup(edge.start, edge.count, 1);
  geometry.addGroup(back.start, back.count, 2);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
