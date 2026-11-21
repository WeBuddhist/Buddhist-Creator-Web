import { useId } from "react";
import { SEAL_INK, SEAL_LION, SEAL_OUTLINE, SEAL_RAYS, SEAL_SILVER, SEAL_SPECTRUM } from "@/lib/card-seal";
import { cn } from "@/lib/utils";
import logoMark from "@/assets/logo-mark-white.png";

/* The seal in the bottom corner of a card: a creator's own, and the
   leaderboard's first three. Our lion on a small sticker of holographic
   foil, scalloped at its edge, as the mark on a thing that is the real
   one is. It is decoration: the verified mark on a creator's photo is
   what says our team has checked a card. Its size and place are the
   caller's (`className`), and so is how it was stuck on: `turn` is how
   far it is turned from straight, in degrees, clockwise.

   At rest the foil is silver with a breath of colour. As the card leans
   to the pointer the colours come up and run across it, the cut lines
   turn a little and a glint crosses the other way, as a foil sticker does
   in the hand. The stage says how the card leans, in three custom
   properties on this element (--tilt-x, --tilt-y, --shine; see pose in
   components/creators/podium/store.ts), and the rules that read them are
   in app/globals.css (`card-seal`). Where the stage does not turn the
   card, the pointer being over the card brings the colours up instead.

   The shapes are lib/card-seal.ts's, which the share picture draws too. */
export function CardSeal({ className, turn = 0 }: { className?: string; turn?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <div
      aria-hidden
      data-podium-seal
      className={cn("card-seal pointer-events-none absolute", className)}
      style={turn ? { rotate: `${turn}deg` } : undefined}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <radialGradient id={`${id}s`} cx="42%" cy="36%" r="70%">
            <stop offset="0" stopColor={SEAL_SILVER[0]} />
            <stop offset="0.55" stopColor={SEAL_SILVER[1]} />
            <stop offset="1" stopColor={SEAL_SILVER[2]} />
          </radialGradient>
          <linearGradient id={`${id}r`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="80" y2="0" spreadMethod="repeat">
            {SEAL_SPECTRUM.map((colour, index) => (
              <stop key={index} offset={index / (SEAL_SPECTRUM.length - 1)} stopColor={colour} />
            ))}
          </linearGradient>
          <radialGradient id={`${id}g`}>
            <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <clipPath id={`${id}c`}>
            <path d={SEAL_OUTLINE} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}c)`}>
          <rect width="100" height="100" fill={`url(#${id}s)`} />
          <rect data-seal="colours" x="-150" y="-150" width="400" height="400" fill={`url(#${id}r)`} />
          <path data-seal="rays" d={SEAL_RAYS} stroke="#fff" strokeWidth="0.7" opacity="0.6" />
          <circle cx="50" cy="50" r={SEAL_LION.plate} fill="#fff" opacity="0.72" />
          <ellipse data-seal="glint" cx="50" cy="50" rx="34" ry="20" fill={`url(#${id}g)`} />
        </g>
        <circle cx="50" cy="50" r={SEAL_LION.plate} fill="none" stroke={SEAL_INK} strokeWidth="0.9" opacity="0.55" />
        {/* The cut edge of the sticker: white, as the paper under foil is. */}
        <path d={SEAL_OUTLINE} fill="none" stroke="#fff" strokeWidth="1.6" />
      </svg>
      {/* The lion, in brand cyan: the white mark is the mask of a cyan sheet. */}
      <span
        className="absolute top-1/2 left-1/2 aspect-[530/490] -translate-x-1/2 -translate-y-1/2 bg-brand-cyan"
        style={{
          width: `${SEAL_LION.width}%`,
          maskImage: `url(${logoMark.src})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }}
      />
    </div>
  );
}
