/* The seal in the corner of a creator's own card: our lion on a small
   round sticker of holographic foil, the kind that marks a thing as the
   real one. Here are its shapes and colours, drawn in a square of 100
   units, for the two things that draw it: the card on the page
   (components/creator-card/card-seal.tsx), where the foil's colours run
   across it as the card is turned, and the share picture
   (lib/card-share.tsx), where it is still. */

/** Its size on a creator's own card and how far in from the card's right
    and bottom edges it sits, in rem. (On the leaderboard's cards it is a
    step smaller and nearer the corner: LeadCard says how.) */
export const SEAL = { size: 2.75, inset: 1 } as const;

const round = (value: number) => Math.round(value * 100) / 100;

/** The sticker's outline: a circle with a scalloped edge, sixteen lobes. */
export const SEAL_OUTLINE = (() => {
  const points: string[] = [];
  for (let step = 0; step < 160; step++) {
    const angle = (step / 160) * Math.PI * 2;
    const reach = 46.5 + 1.9 * Math.cos(angle * 16);
    points.push(`${round(50 + reach * Math.cos(angle))} ${round(50 + reach * Math.sin(angle))}`);
  }
  return `M${points.join("L")}Z`;
})();

/** The fine lines cut into the foil, out from its middle: one path. */
export const SEAL_RAYS = (() => {
  const lines: string[] = [];
  for (let step = 0; step < 72; step++) {
    const angle = (step / 72) * Math.PI * 2;
    const [x, y] = [Math.cos(angle), Math.sin(angle)];
    lines.push(`M${round(50 + 35 * x)} ${round(50 + 35 * y)}L${round(50 + 44 * x)} ${round(50 + 44 * y)}`);
  }
  return lines.join("");
})();

/** The foil's colours, in the order they run, ending where they began so
    the run can repeat. */
export const SEAL_SPECTRUM = ["#ff7eb6", "#ffd27a", "#8df5b5", "#6fd6ff", "#b79bff", "#ff7eb6"] as const;

/** The silver under them: lit in the middle, deeper to the edge. */
export const SEAL_SILVER = ["#ffffff", "#e9eff3", "#cdd8df"] as const;

/** The lion and the ring round it: brand cyan. */
export const SEAL_INK = "#136986";

/** The lion's box inside the sticker, in its middle, and the plate of
    plain foil it stands on. */
export const SEAL_LION = { width: 52, ratio: 490 / 530, plate: 33.5 } as const;

/** The sticker as it lies still, without its lion: an SVG for a picture.
    `shine` is how much of the foil's colour shows, 0 to 1. */
export function sealSvg(shine = 0.45) {
  const stops = SEAL_SPECTRUM.map((colour, index) => `<stop offset="${index / (SEAL_SPECTRUM.length - 1)}" stop-color="${colour}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs>
<radialGradient id="s" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="${SEAL_SILVER[0]}"/><stop offset="0.55" stop-color="${SEAL_SILVER[1]}"/><stop offset="1" stop-color="${SEAL_SILVER[2]}"/></radialGradient>
<linearGradient id="r" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="80" y2="0" spreadMethod="repeat" gradientTransform="rotate(-35 50 50)">${stops}</linearGradient>
<clipPath id="c"><path d="${SEAL_OUTLINE}"/></clipPath>
</defs>
<g clip-path="url(#c)">
<rect width="100" height="100" fill="url(#s)"/>
<rect x="-50" y="-50" width="200" height="200" fill="url(#r)" opacity="${0.3 + 0.6 * shine}"/>
<path d="${SEAL_RAYS}" stroke="#fff" stroke-width="0.7" opacity="0.6"/>
<circle cx="50" cy="50" r="${SEAL_LION.plate}" fill="#fff" opacity="0.72"/>
</g>
<circle cx="50" cy="50" r="${SEAL_LION.plate}" fill="none" stroke="${SEAL_INK}" stroke-width="0.9" opacity="0.55"/>
<path d="${SEAL_OUTLINE}" fill="none" stroke="#fff" stroke-width="1.6"/>
</svg>`;
}
