/* Makes the relief maps of the awards medal (components/awards/medal)
   from photographs of the medal itself:
   - assets/awards/medal-lion.webp, the side the medal shows first: the
     lion with the triratna and the Kharoshthi inscription;
   - assets/awards/medal-buddha.webp, the other side: the Buddha setting
     the Dharma wheel turning.
   Both after the 1st-century gold coin from Tillya Tepe.

     node scripts/medal-textures.mjs

   On the medal the relief is polished and the field round it is grained,
   so in a photograph the relief is bright and the field dark. Brightness,
   softened, stands in for how high the metal is, and the same split says
   where the metal is polished. For each side this writes
   - medal-<side>-normal.webp: which way the surface faces at each point,
     so the scene's light catches the relief;
   - medal-<side>-orm.webp: R the occlusion (the grained field darker, the
     recesses darker still), G the roughness (polished relief and rim,
     satin field), B the metalness (all metal).

   Re-run it after changing a photograph. The output goes to public/awards. */

import sharp from "sharp";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "public/awards");

/** The texture's side, in pixels. */
const N = 1024;

/** Where each side's field is in its photograph: the centre and the two
    radii of the field inside the medal's own rim, in pixels. A photo taken
    a little off square shows the round medal as an oval; the field is
    stretched back to a circle. */
const SIDES = [
  { name: "front", file: join(ROOT, "assets/awards/medal-lion.webp"), x: 745, y: 812, rx: 684, ry: 718 },
  { name: "back", file: join(ROOT, "assets/awards/medal-buddha.webp"), x: 803, y: 790, rx: 694, ry: 698 },
];

/** How far out the field reaches on the texture, as a share of its half
    side: just inside the raised rim the scene draws (lipFrom × the face's
    reach in components/awards/medal/geometry.ts, about 0.855). */
const FIELD = 0.85;

/* ---------------------------------------------------------------------- */

const at = (x, y) => y * N + x;
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smoothstep = (from, to, v) => {
  const t = clamp((v - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => a + (b - a) * t;

/** How far a pixel is from the texture's centre, as a share of its half side. */
const radiusAt = (x, y) => Math.hypot((x + 0.5) / (N / 2) - 1, (y + 0.5) / (N / 2) - 1);

/** A separable gaussian blur of a single-channel float image. */
function blur(src, sigma) {
  const radius = Math.ceil(sigma * 3);
  const kernel = Array.from({ length: radius * 2 + 1 }, (_, i) => Math.exp(-((i - radius) ** 2) / (2 * sigma * sigma)));
  const sum = kernel.reduce((a, b) => a + b, 0);
  for (let i = 0; i < kernel.length; i++) kernel[i] /= sum;
  const pass = (input, horizontal) => {
    const out = new Float32Array(N * N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const xx = horizontal ? clamp(x + k, 0, N - 1) : x;
          const yy = horizontal ? y : clamp(y + k, 0, N - 1);
          acc += input[at(xx, yy)] * kernel[k + radius];
        }
        out[at(x, y)] = acc;
      }
    return out;
  };
  return pass(pass(src, true), false);
}

/** A side's photograph as brightness from 0 to 1: its field stretched
    round and scaled to FIELD of the texture, on black. */
async function photoField({ file, x, y, rx, ry }) {
  const inner = Math.round(N * FIELD);
  const pad = Math.round((N - inner) / 2);
  const { data } = await sharp(file)
    .extract({ left: Math.round(x - rx), top: Math.round(y - ry), width: Math.round(rx * 2), height: Math.round(ry * 2) })
    .resize(inner, inner, { fit: "fill" })
    .extend({ top: pad, bottom: N - inner - pad, left: pad, right: N - inner - pad, background: "#000" })
    .removeAlpha()
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Float32Array.from(data, (v) => v / 255);
}

/** The median of the values in a ring of the texture. */
function ringMedian(image, from, to) {
  const values = [];
  for (let y = 0; y < N; y += 2)
    for (let x = 0; x < N; x += 2) {
      const r = radiusAt(x, y);
      if (r > from && r < to) values.push(image[at(x, y)]);
    }
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
}

/** A height as a tangent-space normal map. Rows run down the image while
    v runs up the texture (three flips images on upload), hence the sign of
    the second term. */
function normals(height, strength) {
  const out = Buffer.alloc(N * N * 3);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const dx = (height[at(Math.min(x + 1, N - 1), y)] - height[at(Math.max(x - 1, 0), y)]) / 2;
      const dy = (height[at(x, Math.min(y + 1, N - 1))] - height[at(x, Math.max(y - 1, 0))]) / 2;
      const nx = -dx * strength;
      const ny = dy * strength;
      const length = Math.hypot(nx, ny, 1);
      const i = at(x, y) * 3;
      out[i] = Math.round((nx / length / 2 + 0.5) * 255);
      out[i + 1] = Math.round((ny / length / 2 + 0.5) * 255);
      out[i + 2] = Math.round((1 / length / 2 + 0.5) * 255);
    }
  return out;
}

async function save(name, pixels) {
  const info = await sharp(pixels, { raw: { width: N, height: N, channels: 3 } })
    .webp({ quality: 90, smartSubsample: false })
    .toFile(join(OUT, name));
  console.log(`${name}: ${Math.round(info.size / 1024)} KB`);
}

async function side(spec) {
  const light = await photoField(spec);

  const form = blur(light, 4);
  const detail = blur(light, 1);

  // How far each point stands above the field: its brightness against its
  // own surroundings, since the light falls unevenly across a photograph.
  // The softened brightness gives the relief its shape and the sharp one
  // its finish (the mane, the robe's folds, the field's grain).
  const surround = blur(light, 28);
  const lift = Float32Array.from(form, (v, i) => v - surround[i]);
  const height = Float32Array.from(lift, (v, i) => v + (detail[i] - form[i]) * 0.35);
  // Where the metal is polished: the relief, by the same brightness.
  // Relief mirroring something dark reads as field here; it only comes out
  // a little less shiny.
  const relief = Float32Array.from(blur(lift, 2), (v) => smoothstep(0.02, 0.12, v));
  const grain = blur(Float32Array.from(blur(light, 0.7), (v, i) => Math.abs(v - detail[i])), 6);
  const grainField = ringMedian(grain, FIELD * 0.85, FIELD * 0.9);

  // Past the field the height settles to the field's level, so the raised
  // rim the scene draws has no second edge painted on it.
  const level = ringMedian(height, FIELD * 0.85, FIELD * 0.9);
  const rim = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const t = smoothstep(FIELD - 0.045, FIELD - 0.005, radiusAt(x, y));
      rim[at(x, y)] = t;
      height[at(x, y)] = mix(height[at(x, y)], level, t);
      relief[at(x, y)] = mix(relief[at(x, y)], 0, t);
    }

  const wide = blur(height, 9);
  const orm = Buffer.alloc(N * N * 3);
  for (let i = 0; i < N * N; i++) {
    const struck = relief[i];
    const cavity = Math.max(0, wide[i] - height[i]);
    // The grained field holds less light than the polished relief, and
    // the corners of the relief hold less still.
    const occlusion = clamp(mix(0.62, 1, Math.max(struck, rim[i])) - cavity * 2.5);
    // Polished relief and rim, satin field, a little rougher where grained.
    const roughness = mix(mix(0.42 + clamp(grain[i] / grainField - 0.5) * 0.16, 0.2, struck), 0.17, rim[i]);
    orm[i * 3] = Math.round(occlusion * 255);
    orm[i * 3 + 1] = Math.round(clamp(roughness) * 255);
    orm[i * 3 + 2] = 255;
  }

  if (process.env.PREVIEW) {
    // MEDAL PREVIEW=dir: the relief mask and the height, to look at.
    const grey = (image) => Buffer.from(Uint8Array.from(image, (v) => clamp(v) * 255));
    for (const [what, image] of [["relief", relief], ["height", height]])
      await sharp(grey(image), { raw: { width: N, height: N, channels: 1 } })
        .resize(400)
        .png()
        .toFile(join(process.env.PREVIEW, `${spec.name}-${what}.png`));
  }

  await save(`medal-${spec.name}-normal.webp`, normals(height, 9));
  await save(`medal-${spec.name}-orm.webp`, orm);
}

await Promise.all(SIDES.map(side));
