/* eslint-disable @next/next/no-img-element -- Satori renders these, not a browser. */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/* The social card every opengraph-image.tsx renders: the white lion mark,
   then an eyebrow, a title and a line under it on the left; the homepage
   hero's single-line Buddha on the right; all on the mission band's cyan.
   No site URL: every platform prints the domain under the card itself.

   Rendered once at build time by next/og (Satori), which supports flexbox,
   absolute positioning and TTF fonts, but no CSS variables, filters, grid,
   text-wrap or em letter-spacing, so those are worked out by hand below. */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Brand tokens from globals.css, as literals. The golden is lifted 10%
// toward white, as the mission heading does: 3.2:1 on cyan, which passes
// only as large text (24px+), so the eyebrow is never set smaller.
const CYAN = "#136986";
const GOLDEN = "#e3b94a";
const CREAM = "#fff6e0";

/* Three sizes, each paired with its role. Cards are viewed at a third of
   this size in a feed, so nothing goes below 24px. Tracking is the em value
   the site uses, converted to px for Satori. The title uses Inter's Display
   cut, drawn for large sizes, so it takes the lighter -0.01em. */
const TYPE = {
  display: { fontFamily: "Inter Display", fontSize: 92, fontWeight: 600, lineHeight: 1.1, letterSpacing: -0.92 },
  body: { fontFamily: "Inter", fontSize: 30, fontWeight: 500, lineHeight: 1.4 },
  label: { fontFamily: "Inter", fontSize: 24, fontWeight: 500, lineHeight: 1.2, letterSpacing: 1.2 },
} as const;

// Assets depend on nothing per request, so they are read once at module
// scope and every card route is prerendered.
const root = process.cwd();
const [interMedium, interDisplaySemiBold, lion, buddha] = await Promise.all([
  readFile(join(root, "assets/fonts/Inter-Medium.ttf")),
  readFile(join(root, "assets/fonts/InterDisplay-SemiBold.ttf")),
  readFile(join(root, "assets/logo-mark-white.png"), "base64"),
  readFile(join(root, "public/hero.png"), "base64"),
]);

export type OgCard = {
  /** Small golden line above the title. */
  eyebrow: string;
  /** Wraps within a 560px column; two lines at most. */
  title: string;
  /** One or two sentences under the title. */
  tagline: string;
};

/* Satori has no text-wrap: pretty. Tying the last two words together keeps
   a lone word off the last line, which is the case that matters here. */
function keepLastWord(text: string) {
  return text.replace(/ (\S+)$/, " $1");
}

export function ogCard({ eyebrow, title, tagline }: OgCard) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: CYAN,
          color: "white",
        }}
      >
        {/* The Buddha first, so the text column paints over its left edge
            if the two ever meet. Cream line art on transparency, as drawn. */}
        <img
          alt=""
          src={`data:image/png;base64,${buddha}`}
          width={507}
          height={600}
          style={{ position: "absolute", right: 56, top: 24 }}
        />

        {/* One column on one left edge: the mark at the top, and the text
            centred in what remains, so a one-line title and a two-line one
            both sit in balance under it. The column ends before the
            Buddha's shoulder line, which starts near x=640. */}
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 64,
            bottom: 64,
            width: 560,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* The white cut of the mark, trimmed of its padding, straight on
              the cyan. 530×490 source, so the width follows the height. */}
          <img alt="" src={`data:image/png;base64,${lion}`} width={78} height={72} />

          {/* Space within the group steps 16 then 24; the gap to the mark
              above is never less than 48, twice the largest step. */}
          <div
            style={{
              flex: 1,
              marginTop: 48,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ ...TYPE.label, textTransform: "uppercase", color: GOLDEN }}>
              {eyebrow}
            </div>
            <div style={{ ...TYPE.display, marginTop: 16 }}>{title}</div>
            {/* Cream at 90% over cyan measures about 5:1. */}
            <div style={{ ...TYPE.body, marginTop: 24, color: CREAM, opacity: 0.9 }}>
              {keepLastWord(tagline)}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
        { name: "Inter Display", data: interDisplaySemiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
