import * as THREE from "three";
import { CARD, TIERS, type Tier } from "./tiers";

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
   but the lion's outline. */

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
   middle so it is the same on both sides. */
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
] as const;

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
  satin = mix(satin, uMid, line * (0.15 + 0.2 * passing));

  /* The lion, pressed into the satin: a wash of the metal with a lit
     edge on the side the light comes from and a shaded one opposite. The
     light's side moves with the card. */
  vec2 lion = (q - uLogoBox.xy) / uLogoBox.zw;
  vec2 lionAt = vec2(lion.x, 1.0 - lion.y);
  float within = step(0.0, lion.x) * step(lion.x, 1.0) * step(0.0, lion.y) * step(lion.y, 1.0);
  vec2 toward = normalize(vec2(-0.55, -0.8) + uTilt * vec2(-0.7, 0.7));
  vec2 nudge = toward * 1.4 * u / uLogoBox.zw * vec2(1.0, -1.0);
  float body = texture2D(uLogo, lionAt).a * within;
  float edge = (texture2D(uLogo, lionAt - nudge).a - texture2D(uLogo, lionAt + nudge).a) * within;
  // Kept faint: the name and the figure are read across it.
  satin = mix(satin, uMid, body * 0.13);
  satin += max(edge, 0.0) * 0.1;
  satin *= 1.0 - max(-edge, 0.0) * 0.07;

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

  float podiumFoil = clamp(mix(line * 0.3 + body * 0.85 + keyline * 0.5, 0.8, crown), 0.0, 1.0);
  // What the foil mirrors is tinted by its own colour, so a petal stays a petal under the light.
  vec3 podiumLinear = pow(max(podiumBase, 0.0), vec3(2.2));
  diffuseColor.rgb = podiumLinear;
`;

export type FaceMaterial = THREE.MeshPhysicalMaterial & { uniforms: Record<string, THREE.IUniform> };

/** How much of its own colour the foil keeps under what it mirrors, and
    how strongly its film colours, for each place's metal. */
const FOIL = [
  { keep: 0.74, holo: 0.3 },
  { keep: 0.7, holo: 0.55 },
  { keep: 0.74, holo: 0.3 },
] as const;

export function makeFace(tier: Tier, logo: THREE.Texture): FaceMaterial {
  const metal = TIERS[tier];
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
    uHolo: { value: FOIL[tier].holo },
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
      .replace("#include <map_fragment>", FACE_MAIN.replace("PODIUM_CROWN", CROWNS[tier]))
      .replace(
        "#include <metalnessmap_fragment>",
        /* glsl */ `#include <metalnessmap_fragment>
        metalnessFactor = podiumFoil * 0.6;
        roughnessFactor = mix(0.62, 0.34, podiumFoil);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `totalEmissiveRadiance = podiumLinear * mix(1.0, ${FOIL[tier].keep.toFixed(2)}, podiumFoil) + passing * 0.28;`,
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
  return Object.assign(material, { uniforms });
}

export function makeMetal(tier: Tier) {
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

/** A card's measures in pixels, as the scene reads them from the page. */
export type Measures = { w: number; h: number; px: number; py: number; pr: number; rem: number };

/* Tell a card's face its measures: where the crown's arc is, where the
   photo is, and where the lion sits, which is in the middle of the satin,
   under the words, as a watermark is in the middle of a page. */
export function layOut(face: FaceMaterial, { w, h, px, py, pr, rem }: Measures) {
  const unit = rem / 16;
  const radius = CARD.radius * rem;
  const frame = CARD.frame * rem;
  const crown = CARD.crownRadius * w;
  // The satin runs from under the photo to the frame at the card's foot.
  const satinTop = py + pr;
  const satinHeight = h - frame - satinTop;
  const lion = Math.min(w * 0.66, satinHeight * 0.86 * (530 / 490));
  const lionHeight = lion * (490 / 530);
  const on = face.uniforms;
  on.uSize.value.set(w, h);
  on.uFace.value.set(w / 2 - frame, h / 2 - frame, radius - frame);
  on.uCrown.value.set(w / 2, py + pr * CARD.crownDrop - crown, crown);
  on.uPhoto.value.set(px, py, pr);
  on.uLogoBox.value.set((w - lion) / 2, satinTop + (satinHeight - lionHeight) / 2, lion, lionHeight);
  on.uUnit.value = unit;
}
