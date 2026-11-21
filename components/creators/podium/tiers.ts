/* What a card is made of, as the card's CSS and the WebGL scene both use
   it, so the still card and the lit one are the same colours. The first
   three are the metals of the leaderboard's first places. The fourth is
   no place's: it is the card every creator has, on their own page: a pale
   cyan sky at its head that clears to pearl, with a rim of brand cyan, a
   step lighter.

   `mid` is the metal itself (the rank tokens in app/globals.css), `deep`
   its shadow, for lines; `light` and `pale` are the satin the words sit
   on; `rim` is the flat band round the card's edge, and `sheen` the
   colour the scene's metal is given to arrive at it (the white card's
   rim also glows with `rim` itself, see makeMetal). Ink measures 8.6:1
   or more on the gold, 7.2:1 on the silver and 5.7:1 on the bronze `mid`,
   and more on everything lighter.

   On the white card `mid` is the sky at the head of its face, `pale` the
   pearl the sky clears to, and `deep` its lines: round the clouds and in
   the satin. The head is `mid` with 12% of `deep` at
   its very top, the darkest ground on the face: there ink at 75% (the
   Rank label) measures 5.7:1 and brand cyan (the place, set large) 4.2:1.
   Where the small label over the name sits the sky is half cleared or
   more, and brand cyan measures 5.3:1 or better; on the pearl ink at 75%
   measures 7.1:1. */
export const TIERS = [
  { metal: "gold", deep: "#b0760b", mid: "#f2b130", light: "#fbdc8e", pale: "#fff6dc", rim: "#f2b130", sheen: "#f6c350" },
  { metal: "silver", deep: "#6f7a87", mid: "#a3adb8", light: "#d9dfe6", pale: "#f5f7f9", rim: "#a3adb8", sheen: "#cdd4dc" },
  { metal: "bronze", deep: "#96562a", mid: "#cf8a4f", light: "#efc7a3", pale: "#fcefe4", rim: "#cf8a4f", sheen: "#dd9d68" },
  { metal: "white", deep: "#5b93a8", mid: "#c6e3ee", light: "#e9f3f7", pale: "#fbfdfe", rim: "#3393b5", sheen: "#0a485f" },
] as const;

/** 0 is first place, 1 second, 2 third; WHITE is every creator's own card. */
export type Tier = 0 | 1 | 2 | 3;
export const WHITE: Tier = 3;

/* The card's measures, in rem, so that a card grows with the root
   font-size on a wide screen (app/globals.css). The scene turns them into
   pixels with the root's size when it measures. */
export const CARD = {
  /** The corner. The card's CSS says the same: rounded-[1.25rem]. */
  radius: 1.25,
  /** The metal frame, from the card's edge to the face: a flat band, square at its edges. */
  frame: 0.4375,
  /** How thick the card is. */
  depth: 0.375,
  /** How far the eye is from the card: the CSS perspective, and the camera's distance. */
  perspective: 75,
  /** The room around a card the scene draws in, for its corners when it turns and comes forward. */
  room: 2.5,
  /** How far the photo stands off the face. The photo's CSS says the same. */
  photoLift: 0.625,
  /** How far a card comes toward a pointer that is over it. */
  hoverLift: 1,
  /** The crown, the metal at the head of the card: its lower edge is an
      arc of this many card-widths' radius, which at the card's middle
      passes this share of the photo's radius below the photo's centre. */
  crownRadius: 2.6,
  crownDrop: 0.25,
} as const;
