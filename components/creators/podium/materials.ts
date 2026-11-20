import * as THREE from "three";
import { CARD, TIERS, WHITE, type Tier } from "./tiers";

/* What the card's body is made of.

   The frame and the ring round the photo are real metal: a standard
   material that mirrors the studio the scene sets up (scene.tsx), so the
   light slides along them as the card turns. The frame is a flat band.

   The face is three's physical material with its colour worked out per
   pixel (injected with onBeforeCompile): the crown, the metal at the head
   of the card, carrying a pattern of its own for each place (a lotus,
   clouds, the endless knot's weave); the satin under it
   with its engraved lines; and the lion pressed into the satin. Those
   colours are given as the face's own light, so the words on the card
   keep the contrast they were measured at whatever the studio does. On
   top of them the material adds what only it can: the crown, its pattern
   and the lion are foil, metal that mirrors the studio and carries a thin
   film whose colour shifts as the card turns, and the whole face is under
   a clear coat that takes a gloss from the lights. Everything is worked
   out from the card's own measures, so there is no texture to download
   but the lion's outline.

   The white card, which every creator has on their own page, is the same
   face made of silk in place of metal, and in one piece: the palest cyan
   from its head to its foot, with no crown, Tibetan clouds woven into
   the silk tone on tone (DAMASK), and the lion embroidered large in the
   middle of it, in the near-white thread and
   soft blue-grey edge a brocade on that ground would be worked in. Silk
   mirrors little, so its share of foil is small. */

/** A hex colour as the shader wants it: the numbers as written, not
    converted to linear light. */
const raw = (hex: string) => {
  const value = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
};

const ROUND_BOX = /* glsl */ `
  float roundBox(vec2 p, vec2 extent, float r) {
    vec2 q = abs(p) - extent + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
`;

const FACE_PARS = /* glsl */ `
  uniform vec2 uSize;     // the card, in pixels
  uniform vec3 uFace;     // the face inside the frame: half width, half height, corner
  uniform vec3 uCrown;    // the crown's circle: centre and radius, from the card's top-left
  uniform vec3 uPhoto;    // the photo: centre and radius, from the card's top-left
  uniform vec4 uLogoBox;  // the lion: left, top, width, height
  uniform sampler2D uLogo;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uLight;
  uniform vec3 uPale;
  uniform vec2 uTilt;     // how the card is turned, -1 to 1: x to the right edge, y to the top
  uniform float uPass;    // where the passing light is along the diagonal; far off when there is none
  uniform float uUnit;    // one CSS pixel at a 16px root, in pixels
  uniform float uHolo;    // how strongly the foil's film colours
  varying vec2 vPos;

  ${ROUND_BOX}

  float grain(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  /* One ring of a lotus seen from above: \`count\` petals round the photo,
     from \`inner\` to \`outer\` pixels out, turned by \`turn\` of a petal.
     Gives how far inside a petal's outline the pixel is, in pixels (below
     zero outside); how far along the petal, 0 at its base to 1 at its
     tip; and how far across, 0 on its middle to 1 on its outline. */
  vec3 petals(float reach, float angle, float count, float inner, float outer, float turn) {
    float along = (reach - inner) / (outer - inner);
    if (along <= 0.0 || along >= 1.0) return vec3(-1000.0, 0.0, 1.0);
    float across = abs(fract(angle / 6.2831853 * count + turn) - 0.5) * 2.0;
    // Widest a third of the way out, drawn to a point at the tip.
    float width = pow(max(sin(3.14159265 * pow(along, 0.6)), 0.0), 0.7) * 0.94;
    float inside = (width - across) * (3.14159265 / count) * reach;
    return vec3(inside, along, across / max(width, 0.001));
  }

  /* Lay a ring of petals over what is under it: each petal lighter to its
     tip, rounded at its edge, with a line for its outline and one down
     its middle, and its shadow on whatever it lies over. */
  vec3 layPetals(vec3 under, vec3 petal, vec3 dark, vec3 bright, float pixel, float u) {
    float inside = smoothstep(-pixel, pixel, petal.x);
    under *= 1.0 - 0.22 * (1.0 - inside) * exp(min(petal.x, 0.0) / (4.0 * u));
    vec3 fill = mix(dark, bright, 0.2 + 0.8 * petal.y);
    fill *= 1.0 - 0.15 * exp(-max(petal.x, 0.0) / (2.5 * u));
    fill *= 1.0 - 0.1 * (1.0 - smoothstep(0.0, 0.07, petal.z)) * (1.0 - smoothstep(0.45, 0.8, petal.y));
    float outline = 1.0 - smoothstep(0.55 * u, 0.55 * u + pixel, abs(petal.x));
    return mix(mix(under, fill, inside), uDeep, outline * 0.42);
  }

  float blend(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  /* The curl in a cloud's head: how far the point is from a spiral line
     wound about the head's middle, \`turn\` saying which way it winds. Far
     off outside the part of the head the curl keeps to. */
  float curl(vec2 from, float radius, float turn) {
    float reach = length(from);
    if (reach > radius * 0.74 || reach < radius * 0.1) return 1.0;
    float pitch = radius * 0.36;
    float arm = reach / pitch - atan(from.y, from.x) * turn / 6.2831853;
    return (0.5 - abs(fract(arm) - 0.5)) * pitch;
  }

  /* A cloud as the thangka painters draw one: three rounded heads, each
     with its curl, and a tail that trails off and thins. In its own
     units, y up, about 2.4 wide and 1 high. Gives how far outside its
     outline the point is (below zero inside) and how far from the nearest
     curl's line. */
  vec2 cloud(vec2 p) {
    vec2 a = p - vec2(0.0, 0.05);
    vec2 b = p - vec2(-0.56, -0.12);
    vec2 c = p - vec2(0.5, -0.1);
    float edge = blend(blend(length(a) - 0.42, length(b) - 0.29, 0.07), length(c) - 0.3, 0.07);
    vec2 from = p - vec2(0.55, -0.26);
    vec2 run = vec2(1.0, -0.12);
    float along = clamp(dot(from, run) / dot(run, run), 0.0, 1.0);
    edge = blend(edge, length(from - run * along) - mix(0.15, 0.015, along), 0.1);
    float line = min(curl(a, 0.42, 1.0), min(curl(b, 0.29, -1.0), curl(c, 0.3, 1.0)));
    return vec2(edge, line);
  }
`;

/* What the crown carries behind the photo, one for each place, each
   painted over \`head\`, the crown's own metal.

   First: a lotus opened behind the photo, three rings of fourteen petals,
   each ring turned half a petal from the one in front.

   Second: clouds, in rows that drift past the photo, every other row set
   half a cloud along and facing the other way.

   Third: the endless knot's weave, ribbons crossing on the slant and
   passing over and under each other in turn, laid out from the photo's
   middle so it is the same on both sides.

   The white card has no crown: its whole face is the crown's ground
   (PODIUM_PLAIN), so it carries nothing here. */
const CROWNS = [
  /* glsl */ `
  float angle = atan(fromPhoto.x, -fromPhoto.y);
  head = layPetals(head, petals(reach, angle, 14.0, R * 1.5, R * 3.45, 0.5), mix(uMid, uDeep, 0.22), mix(uMid, uLight, 0.4), pixel, u);
  head = layPetals(head, petals(reach, angle, 14.0, R * 1.15, R * 2.5, 0.0), uMid, mix(uMid, uLight, 0.7), pixel, u);
  head = layPetals(head, petals(reach, angle, 14.0, R * 0.8, R * 1.72, 0.5), mix(uMid, uLight, 0.35), mix(uLight, uPale, 0.35), pixel, u);
  `,
  /* glsl */ `
  float size = 35.0 * u;
  vec2 sky = vec2(fromPhoto.x, -fromPhoto.y) / size + vec2(0.0, 0.3);
  float row = floor(sky.y / 1.2);
  float odd = mod(row, 2.0);
  float drift = sky.x + odd * 1.4;
  vec2 inCell = vec2(fract(drift / 2.8) * 2.8 - 1.4, fract(sky.y / 1.2) * 1.2 - 0.6);
  inCell.x *= 1.0 - 2.0 * odd;
  vec2 one = cloud(inCell + vec2(0.36, -0.03));
  float deep = -one.x * size;
  float inside = smoothstep(-pixel, pixel, deep);
  // Its shade on the sky, let go before the edge of its own patch of sky
  // so that no patch shows as a square.
  vec2 toPatch = vec2(1.4, 0.6) - abs(vec2(fract(drift / 2.8) * 2.8 - 1.4, inCell.y));
  float held = smoothstep(0.0, 0.16, min(toPatch.x, toPatch.y));
  head *= 1.0 - 0.18 * held * (1.0 - inside) * exp(min(deep, 0.0) / (3.0 * u));
  vec3 puff = mix(mix(uMid, uLight, 0.5), mix(uLight, uPale, 0.6), smoothstep(-0.45, 0.4, inCell.y));
  puff *= 1.0 - 0.14 * exp(-max(deep, 0.0) / (2.5 * u));
  head = mix(head, puff, inside);
  float stroke = 0.55 * u;
  float outline = 1.0 - smoothstep(stroke, stroke + pixel, abs(deep));
  float inner = (1.0 - smoothstep(stroke * 0.8, stroke * 0.8 + pixel, abs(deep - 3.4 * u))) * inside;
  float curled = (1.0 - smoothstep(stroke, stroke + pixel, one.y * size)) * inside;
  head = mix(head, uDeep, clamp(outline * 0.42 + inner * 0.2 + curled * 0.34, 0.0, 1.0));
  `,
  /* glsl */ `
  float pitch = 30.0 * u;
  vec2 slant = vec2(fromPhoto.x + fromPhoto.y, fromPhoto.x - fromPhoto.y) * 0.70710678 / pitch + 0.5;
  vec2 knot = floor(slant);
  vec2 across = fract(slant) - 0.5;
  // Each ribbon is 0.4 of the pitch wide, so the crown's metal shows in the
  // diamonds between. Where two cross, they take turns on top.
  vec2 ribbon = (0.2 - abs(across)) * pitch;
  float first = mod(knot.x + knot.y, 2.0);
  float over = mix(ribbon.y, ribbon.x, first);
  float under = mix(ribbon.x, ribbon.y, first);
  vec3 band = mix(mix(uMid, uLight, 0.3), mix(uLight, uPale, 0.3), 0.5);
  float stroke = 0.55 * u;
  // The one that passes under, in the shade of the one over it.
  float low = smoothstep(-pixel, pixel, under);
  vec3 lower = band * (1.0 - 0.12 * exp(-max(under, 0.0) / (2.5 * u)));
  lower *= 1.0 - 0.3 * exp(min(over, 0.0) / (3.5 * u));
  head *= 1.0 - 0.18 * (1.0 - low) * exp(min(under, 0.0) / (3.5 * u));
  head = mix(head, lower, low);
  head = mix(head, uDeep, (1.0 - smoothstep(stroke, stroke + pixel, abs(under))) * 0.4);
  head = mix(head, uDeep, (1.0 - smoothstep(stroke * 0.7, stroke * 0.7 + pixel, abs(under - 2.4 * u))) * low * 0.2);
  // And the one over it.
  float high = smoothstep(-pixel, pixel, over);
  head *= 1.0 - 0.14 * (1.0 - high) * exp(min(over, 0.0) / (3.5 * u));
  head = mix(head, band * (1.0 - 0.12 * exp(-max(over, 0.0) / (2.5 * u))), high);
  head = mix(head, uDeep, (1.0 - smoothstep(stroke, stroke + pixel, abs(over))) * 0.4);
  head = mix(head, uDeep, (1.0 - smoothstep(stroke * 0.7, stroke * 0.7 + pixel, abs(over - 2.4 * u))) * high * 0.2);
  `,
  "",
] as const;

/* How the lion is put on the satin. Each is handed `body`, how much of
   the pixel the lion covers, and `lionAt`, `within` and `toward` (the
   side the light comes from, which moves with the card) to read its edges
   with.

   On the three metals it is pressed in: a wash of the metal with a lit
   edge on the light's side and a shaded one opposite, kept faint, since
   the name and the figure are read across it.

   On the white card it is embroidered: a satin-stitch fill, the threads
   side by side on the slant, each one round (lit along its middle, shaded
   at its sides), each stitch going down through the cloth at its ends,
   no two neighbours ending in the same place and no two quite the same
   tone; round every edge an outline of a deeper thread in stem stitch.
   Silk thread shines in a band across the stitch, and the band moves as
   the card turns. The work stands off the silk, so it is lit on the
   light's side, shaded on the other and throws a soft shadow there. It
   is in the colours a pattern on that ground would be: a fill that runs
   from a little paler than the silk, between threads, to near white on
   their crowns, so every word reads across it at least as well as on the
   silk itself; and an edge of the card's blue-grey `deep`. The thread is
   silk, not foil, so it keeps its colour under the light. */
const LIONS = {
  pressed: /* glsl */ `
  vec2 nudge = toward * 1.4 * u / uLogoBox.zw * vec2(1.0, -1.0);
  float edge = (texture2D(uLogo, lionAt - nudge).a - texture2D(uLogo, lionAt + nudge).a) * within;
  satin = mix(satin, uMid, body * 0.13);
  satin += max(edge, 0.0) * 0.1;
  satin *= 1.0 - max(-edge, 0.0) * 0.07;
  `,
  embroidered: /* glsl */ `
  // The fill: satin stitch, threads laid side by side on the slant.
  vec2 lay = vec2(q.x + q.y, q.y - q.x) * 0.70710678 / u;
  float strand = lay.y / 2.6;
  float which = floor(strand);
  float stitch = fract(lay.x / 9.0 + grain(vec2(which, 7.0)));
  float rounded = sin(fract(strand) * 3.14159265);
  // Each stitch dips into the cloth at its two ends.
  float held = smoothstep(0.0, 0.14, stitch) * (1.0 - smoothstep(0.86, 1.0, stitch));
  // Where a thread is too fine for the screen: its average, not a shimmer.
  float drawn = 1.0 - smoothstep(0.35, 0.75, fwidth(strand));
  float relief = mix(0.62, pow(rounded, 0.7) * (0.35 + 0.65 * held), drawn);
  // No two threads take the dye quite alike.
  relief = clamp(relief + (grain(vec2(which, 3.0)) - 0.5) * 0.12 * drawn, 0.0, 1.0);
  vec3 thread = mix(mix(uMid, uLight, 0.2), mix(uPale, vec3(1.0), 0.6), relief);
  // Silk shines in a band across the stitch, and the band follows the light.
  float shine = pow(max(0.0, 1.0 - abs(stitch - 0.5 + (uTilt.x - uTilt.y) * 0.35) * 2.2), 4.0) * rounded * held * drawn;
  thread = mix(thread, vec3(1.0), clamp(shine * 0.6 + passing * 0.35, 0.0, 1.0));

  // The outline: a deeper thread in stem stitch, short slanted stitches
  // overlapping round every edge, which is what makes the fill read as
  // worked rather than printed.
  vec2 spread = 1.15 * u / uLogoBox.zw;
  float inner = min(
    min(texture2D(uLogo, lionAt + vec2(spread.x, 0.0)).a, texture2D(uLogo, lionAt - vec2(spread.x, 0.0)).a),
    min(texture2D(uLogo, lionAt + vec2(0.0, spread.y)).a, texture2D(uLogo, lionAt - vec2(0.0, spread.y)).a)
  );
  float edging = body * (1.0 - inner * within);
  float stem = 0.55 + 0.45 * sin(fract((q.x - q.y) / (3.2 * u)) * 3.14159265);
  thread = mix(thread, mix(uMid, uDeep, 0.72) * (0.92 + 0.14 * stem), clamp(edging * 1.4, 0.0, 1.0) * 0.85);

  // The work stands off the silk: lit on the light's side, shaded on the
  // other, and throwing a soft shadow there.
  vec2 nudge = toward * 1.5 * u / uLogoBox.zw * vec2(1.0, -1.0);
  float lit = body * (1.0 - texture2D(uLogo, lionAt + nudge).a * within);
  float shaded = body * (1.0 - texture2D(uLogo, lionAt - nudge).a * within);
  float thrown = (1.0 - body) * (texture2D(uLogo, lionAt + nudge * 1.6).a * 0.6 + texture2D(uLogo, lionAt + nudge * 3.0).a * 0.4) * within;
  satin *= 1.0 - 0.2 * thrown;
  satin = mix(satin, thread, body);
  satin += lit * 0.08;
  satin *= 1.0 - shaded * 0.16;
  `,
} as const;

/* Works out the face's colour (podiumBase, as written, not linear) and
   how much of the pixel is foil (podiumFoil). */
const FACE_MAIN = /* glsl */ `
  float u = uUnit;
  // From the card's top-left corner, y down, as the page measures it.
  vec2 q = vec2(vPos.x + uSize.x * 0.5, uSize.y * 0.5 - vPos.y);
  vec2 n = q / uSize;
  float pixel = fwidth(q.x);

  // The light that passes over a card as it arrives, along its diagonal.
  float podiumAlong = n.x * 0.6 + n.y * 0.5;
  float passing = exp(-pow((podiumAlong - uPass) / 0.085, 2.0));

  // The crown, and what it carries behind the photo (CROWNS).
  float toCrown = length(q - uCrown.xy) - uCrown.z;
  float crown = 1.0 - smoothstep(-pixel, pixel, toCrown);
  vec2 fromPhoto = q - uPhoto.xy;
  float reach = length(fromPhoto);
  float R = uPhoto.z;
  vec3 head = mix(uMid, uLight, exp(-reach / (R * 2.6)) * 0.5);
  head = mix(head, uDeep, 0.24 * (1.0 - smoothstep(0.0, uPhoto.y, q.y)));
  {
    PODIUM_CROWN
  }

  // The satin: paler at the top, with fine engraved waves.
  vec3 satin = mix(uPale, uLight, smoothstep(0.4, 1.1, n.y) * 0.42);
  float wave = q.y + 4.0 * u * sin(q.x / (22.0 * u));
  float ridge = abs(fract(wave / (6.0 * u)) - 0.5) * 2.0;
  float line = 1.0 - smoothstep(0.0, 0.2 + fwidth(wave) / (3.0 * u), ridge);
  satin = mix(satin, uMid, line * (PODIUM_LINES + 0.2 * passing));
  PODIUM_PLAIN

  // The lion, in the middle of the satin (LIONS).
  vec2 lion = (q - uLogoBox.xy) / uLogoBox.zw;
  vec2 lionAt = vec2(lion.x, 1.0 - lion.y);
  float within = step(0.0, lion.x) * step(lion.x, 1.0) * step(0.0, lion.y) * step(lion.y, 1.0);
  vec2 toward = normalize(vec2(-0.55, -0.8) + uTilt * vec2(-0.7, 0.7));
  float body = texture2D(uLogo, lionAt).a * within;
  {
    PODIUM_LION
  }

  vec3 podiumBase = mix(satin, head, crown);

  // The crown's lip: a dark line on its edge, and its shadow on the satin.
  float lip = smoothstep(-1.5 * u - pixel, -1.5 * u, toCrown) * crown;
  podiumBase = mix(podiumBase, uDeep, lip * 0.45);
  podiumBase *= 1.0 - 0.14 * (1.0 - crown) * exp(-max(toCrown, 0.0) / (5.0 * u));

  /* The face's own edge: a keyline a little way in, as a printed card
     has, and a faint shade where it meets the frame. */
  float toEdge = roundBox(vPos, uFace.xy, uFace.z);
  float keyline = 1.0 - smoothstep(0.5 * u, 0.5 * u + pixel, abs(toEdge + 5.0 * u));
  podiumBase = mix(podiumBase, mix(uDeep, uMid, 0.45), keyline * 0.5);
  podiumBase *= 1.0 - 0.1 * exp(toEdge / (1.5 * u));

  // A little grain, so the gradients do not band.
  podiumBase += (grain(floor(q * 2.0)) - 0.5) * 0.012;

  float podiumFoil = clamp(mix(line * 0.3 + body * PODIUM_LION_FOIL + keyline * 0.5, PODIUM_CROWN_FOIL, crown), 0.0, 1.0);
  // What the foil mirrors is tinted by its own colour, so a petal stays a petal under the light.
  vec3 podiumLinear = pow(max(podiumBase, 0.0), vec3(2.2));
  diffuseColor.rgb = podiumLinear;
`;

export type FaceMaterial = THREE.MeshPhysicalMaterial & { uniforms: Record<string, THREE.IUniform> };

/** How each card's face takes the light: how much of its own colour the
    foil keeps under what it mirrors, how strongly its film colours, how
    much of the crown and of the lion is foil, how the lion is put on, and
    how strongly the satin's engraved lines are drawn (on white they need
    more to show at all). */
const FOIL = [
  { keep: 0.74, holo: 0.3, crown: 0.8, lion: 0.85, work: "pressed", lines: 0.15, plain: false },
  { keep: 0.7, holo: 0.55, crown: 0.8, lion: 0.85, work: "pressed", lines: 0.15, plain: false },
  { keep: 0.74, holo: 0.3, crown: 0.8, lion: 0.85, work: "pressed", lines: 0.15, plain: false },
  { keep: 0.96, holo: 0.35, crown: 0.14, lion: 0.08, work: "embroidered", lines: 0.5, plain: true },
] as const;

/* A face in one piece (`plain`): the crown's ground runs from the head to
   the foot, and there is no crown, so no arc, lip or shade under it, and
   no engraved lines either: on a ground this colour they ran across the
   whole card and fought the lion. */
const PLAIN = /* glsl */ `
  satin = head;
  // Nor as foil: a line that is not drawn must not mirror the studio.
  line = 0.0;
  crown = 0.0;
  toCrown = 1.0e4;
  {
    DAMASK
  }
`;

/* What is woven into the white card's silk, tone on tone, as a damask
   is: Tibetan clouds in staggered rows, the next row half a cloud along
   and facing the other way, laid out from the photo's middle so the
   pattern is the same on both sides. The clouds are woven a shade paler
   than the ground (so every word on the card reads across them at least
   as well as on the silk itself), edged with a hair of the blue-grey
   `deep` and curled inside; and because a damask's figure is woven the
   other way to its ground, it catches the light differently: paler as the
   card turns one way, nearer the ground the other.

   One cloud is 1.375rem to a unit, its cell 3.2 by 1.4 units. The CSS
   surface (`podium-surface` with data-plain in app/globals.css) tiles the
   same clouds at the same measures from the same point, so the still card
   and the lit one agree. */
const DAMASK = /* glsl */ `
  float size = 22.0 * u;
  vec2 g = fromPhoto / size;
  float row = floor(g.y / 1.4 + 0.5);
  float odd = mod(row, 2.0);
  vec2 inCell = vec2(fract((g.x + odd * 1.6) / 3.2 + 0.5) * 3.2 - 1.6, (fract(g.y / 1.4 + 0.5) - 0.5) * 1.4);
  inCell.x *= 1.0 - 2.0 * odd;
  vec2 one = cloud(vec2(inCell.x, -inCell.y) + vec2(0.36, -0.03));
  float deep = -one.x * size;
  float inside = smoothstep(-pixel, pixel, deep);
  float woven = 0.42 + 0.22 * clamp(uTilt.x - uTilt.y, -1.0, 1.0);
  satin = mix(satin, mix(uLight, uPale, 0.5), inside * woven);
  float stroke = 0.45 * u;
  float outline = 1.0 - smoothstep(stroke, stroke + pixel, abs(deep));
  float curled = (1.0 - smoothstep(stroke, stroke + pixel, one.y * size)) * inside;
  satin = mix(satin, uDeep, outline * 0.16 + curled * 0.12);
`;

export function makeFace(tier: Tier, logo: THREE.Texture): FaceMaterial {
  const metal = TIERS[tier];
  const foil = FOIL[tier];
  const main = FACE_MAIN.replace("PODIUM_CROWN_FOIL", foil.crown.toFixed(2))
    .replace("PODIUM_LION_FOIL", foil.lion.toFixed(2))
    .replace("PODIUM_LINES", foil.lines.toFixed(2))
    .replace("PODIUM_CROWN", CROWNS[tier])
    .replace("PODIUM_LION", LIONS[foil.work])
    .replace("PODIUM_PLAIN", foil.plain ? PLAIN.replace("DAMASK", DAMASK) : "");
  // The lion is seen at a slant whenever the card turns.
  logo.anisotropy = 4;
  const uniforms: Record<string, THREE.IUniform> = {
    uSize: { value: new THREE.Vector2(1, 1) },
    uFace: { value: new THREE.Vector3(1, 1, 0) },
    uCrown: { value: new THREE.Vector3() },
    uPhoto: { value: new THREE.Vector3() },
    uLogoBox: { value: new THREE.Vector4(0, 0, 1, 1) },
    uLogo: { value: logo },
    uDeep: { value: raw(metal.deep) },
    uMid: { value: raw(metal.mid) },
    uLight: { value: raw(metal.light) },
    uPale: { value: raw(metal.pale) },
    uTilt: { value: new THREE.Vector2() },
    uPass: { value: 9 },
    uUnit: { value: 1 },
    uHolo: { value: foil.holo },
  };
  const material = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    // Switched on here; how much of it a pixel gets is set in the shader.
    iridescence: 1,
    iridescenceIOR: 1.3,
    envMapIntensity: 0.5,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPos = position.xy;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FACE_PARS}`)
      .replace("#include <map_fragment>", main)
      .replace(
        "#include <metalnessmap_fragment>",
        /* glsl */ `#include <metalnessmap_fragment>
        metalnessFactor = podiumFoil * 0.6;
        roughnessFactor = mix(0.62, 0.34, podiumFoil);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `totalEmissiveRadiance = podiumLinear * mix(1.0, ${foil.keep.toFixed(2)}, podiumFoil) + passing * 0.28;`,
      )
      .replace(
        "#include <lights_physical_fragment>",
        /* glsl */ `#include <lights_physical_fragment>
        // The face is lit by its own colour alone: the studio adds only what is mirrored.
        material.diffuseContribution = vec3(0.0);
        #ifdef USE_IRIDESCENCE
          // The film is thicker and thinner across the card, so its colour
          // runs in bands, and they travel as the card turns.
          material.iridescence = uHolo * podiumFoil;
          material.iridescenceThickness = 310.0 + 190.0 * sin(podiumAlong * 9.0 + uTilt.x * 3.0 - uTilt.y * 2.4);
        #endif`,
      );
  };
  material.customProgramCacheKey = () => `podium-face-${tier}`;
  // layOut gives a face in one piece the larger lion.
  material.userData.plain = foil.plain;
  return Object.assign(material, { uniforms });
}

export function makeMetal(tier: Tier): THREE.MeshStandardMaterial {
  /* The white card's rim is polished cyan metal with a floor under it:
     it mirrors the studio tinted by its own colour, so where it faces the
     lights it runs to a brighter, still saturated cyan, and it carries a
     glow of brand cyan of its own, so where it faces the studio's dark
     floor (the card's foot, at rest) it stays brand cyan instead of going
     near black. A clear coat over a flat band only laid a milky wash on
     it, so there is none.

     How bright the mirrored studio is comes from `sheen` alone:
     envMapIntensity is read only from a material's own envMap, and these
     mirror the scene's environment, so setting it changes nothing. */
  if (tier === WHITE) {
    return new THREE.MeshStandardMaterial({
      color: TIERS[tier].sheen,
      metalness: 1,
      roughness: 0.2,
      emissive: TIERS[tier].rim,
      emissiveIntensity: 0.9,
    });
  }
  return new THREE.MeshStandardMaterial({
    color: TIERS[tier].sheen,
    metalness: 1,
    /* A flat band mirrors one patch of the studio, and with no shadow
       under the card the band is its whole edge. So it is a brushed
       metal, not a polished one: rough enough to take in a wide sweep of
       the studio, which keeps the band near one tone from the card's head
       to its foot, and held down far enough that even the silver, lit,
       stays darker than the page. */
    roughness: 0.58,
    envMapIntensity: 0.52,
  });
}

/* The back of a card that can be turned over (the white card): brand
   cyan, a little lighter in the middle as if lit from in front, with a
   keyline round it as the face has, and our lion large in the middle in
   white, raised (lit on one edge, shaded on the other, a soft shadow
   under it) and with a little foil in it, so it glints as the card
   turns. All of it is under a light satin coat.
   Like the face, its colours are its own light, so the cyan holds
   whatever the studio does. It is drawn on the inside of the frame's
   back, and is only ever seen with the card turned over. */
const BACK_PARS = /* glsl */ `
  uniform vec2 uSize;
  uniform vec3 uFace;
  uniform vec4 uLogoBox;
  uniform sampler2D uLogo;
  uniform float uUnit;
  varying vec2 vPos;

  ${ROUND_BOX}

  float grain(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
`;

const BACK_MAIN = /* glsl */ `
  float u = uUnit;
  vec2 q = vec2(vPos.x + uSize.x * 0.5, uSize.y * 0.5 - vPos.y);
  float pixel = fwidth(q.x);

  // Brand cyan, lighter toward the middle, darker toward the edges.
  vec2 middle = (q - uSize * 0.5) / uSize.x;
  float glow = exp(-dot(middle, middle) * 3.2);
  vec3 backBase = mix(vec3(0.051, 0.349, 0.451), vec3(0.106, 0.482, 0.604), glow);

  // The lion, raised off the cyan.
  vec2 lion = (q - uLogoBox.xy) / uLogoBox.zw;
  vec2 lionAt = vec2(lion.x, 1.0 - lion.y);
  float within = step(0.0, lion.x) * step(lion.x, 1.0) * step(0.0, lion.y) * step(lion.y, 1.0);
  vec2 nudge = vec2(-0.55, -0.8) * 1.6 * u / uLogoBox.zw * vec2(1.0, -1.0);
  float body = texture2D(uLogo, lionAt).a * within;
  float lit = body * (1.0 - texture2D(uLogo, lionAt + nudge).a * within);
  float shaded = body * (1.0 - texture2D(uLogo, lionAt - nudge).a * within);
  float thrown = (1.0 - body) * texture2D(uLogo, lionAt + nudge * 2.4).a * within;
  backBase *= 1.0 - 0.28 * thrown;
  backBase = mix(backBase, vec3(0.955, 0.975, 0.98), body * 0.94);
  backBase += lit * 0.04;
  backBase *= 1.0 - shaded * 0.12;

  // The keyline a little way in, and a faint shade where the back meets the frame.
  float toEdge = roundBox(vPos, uFace.xy, uFace.z);
  float keyline = 1.0 - smoothstep(0.6 * u, 0.6 * u + pixel, abs(toEdge + 7.0 * u));
  backBase = mix(backBase, vec3(0.55, 0.78, 0.85), keyline * 0.55);
  backBase *= 1.0 - 0.14 * exp(toEdge / (2.0 * u));

  backBase += (grain(floor(q * 2.0)) - 0.5) * 0.012;
  float backFoil = clamp(body * 0.45 + keyline * 0.4, 0.0, 1.0);
  vec3 backLinear = pow(max(backBase, 0.0), vec3(2.2));
  diffuseColor.rgb = backLinear;
`;

export type BackMaterial = THREE.MeshPhysicalMaterial & { uniforms: Record<string, THREE.IUniform> };

export function makeBack(logo: THREE.Texture): BackMaterial {
  const uniforms: Record<string, THREE.IUniform> = {
    uSize: { value: new THREE.Vector2(1, 1) },
    uFace: { value: new THREE.Vector3(1, 1, 0) },
    uLogoBox: { value: new THREE.Vector4(0, 0, 1, 1) },
    uLogo: { value: logo },
    uUnit: { value: 1 },
  };
  /* A light coat, and rough: over a cyan this dark a full gloss mirrored
     the studio's wall as a grey haze across the top half of the card. */
  const material = new THREE.MeshPhysicalMaterial({ clearcoat: 0.3, clearcoatRoughness: 0.3, specularIntensity: 0.3 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vPos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPos = position.xy;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${BACK_PARS}`)
      .replace("#include <map_fragment>", BACK_MAIN)
      .replace(
        "#include <metalnessmap_fragment>",
        /* glsl */ `#include <metalnessmap_fragment>
        metalnessFactor = backFoil * 0.6;
        roughnessFactor = mix(0.9, 0.3, backFoil);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `totalEmissiveRadiance = backLinear * mix(1.0, 0.82, backFoil);`,
      )
      .replace(
        "#include <lights_physical_fragment>",
        /* glsl */ `#include <lights_physical_fragment>
        material.diffuseContribution = vec3(0.0);`,
      );
  };
  material.customProgramCacheKey = () => "podium-back";
  return Object.assign(material, { uniforms });
}

/** Tell a card's back its measures: the lion is two thirds of its width,
    in its middle. */
export function layOutBack(back: BackMaterial, { w, h, rem }: Pick<Measures, "w" | "h" | "rem">) {
  const frame = CARD.frame * rem;
  const radius = CARD.radius * rem;
  const lion = w * 0.66;
  const lionHeight = lion * (490 / 530);
  const on = back.uniforms;
  on.uSize.value.set(w, h);
  on.uFace.value.set(w / 2 - frame, h / 2 - frame, radius - frame);
  on.uLogoBox.value.set((w - lion) / 2, (h - lionHeight) / 2, lion, lionHeight);
  on.uUnit.value = rem / 16;
}

/** A card's measures in pixels, as the scene reads them from the page. */
export type Measures = { w: number; h: number; px: number; py: number; pr: number; rem: number };

/* Tell a card's face its measures: where the crown's arc is, where the
   photo is, and where the lion sits, which is in the middle of the satin,
   under the words, as a watermark is in the middle of a page. On a face
   in one piece the lion is the one figure on it, so it is larger, nearly
   the width of the face. */
export function layOut(face: FaceMaterial, { w, h, px, py, pr, rem }: Measures) {
  const unit = rem / 16;
  const radius = CARD.radius * rem;
  const frame = CARD.frame * rem;
  const crown = CARD.crownRadius * w;
  // The satin runs from under the photo to the frame at the card's foot.
  const satinTop = py + pr;
  const satinHeight = h - frame - satinTop;
  const plain = face.userData.plain === true;
  const lion = Math.min(w * (plain ? 0.84 : 0.66), satinHeight * (plain ? 0.94 : 0.86) * (530 / 490));
  const lionHeight = lion * (490 / 530);
  const on = face.uniforms;
  on.uSize.value.set(w, h);
  on.uFace.value.set(w / 2 - frame, h / 2 - frame, radius - frame);
  on.uCrown.value.set(w / 2, py + pr * CARD.crownDrop - crown, crown);
  on.uPhoto.value.set(px, py, pr);
  on.uLogoBox.value.set((w - lion) / 2, satinTop + (satinHeight - lionHeight) / 2, lion, lionHeight);
  on.uUnit.value = unit;
}
