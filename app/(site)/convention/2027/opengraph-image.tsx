import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CONVENTION_2027 } from "@/lib/convention-2027";
import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-card";

export const alt = `${CONVENTION_2027.title} · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/* The flyer as the social card: the lion mark, the dateline, the cyan title
   and the Nagaloka illustration, laid out as components/convention-flyer.tsx
   lays them out, at the card's 1200×630. The status pill is left out, since
   platforms cache cards for weeks and a status goes stale.

   Rendered once at build time by next/og (Satori): no CSS variables, no
   WebP and no <sup>, so the colours are literals, the illustration is the
   PNG that public/nagaloka-footer.webp is encoded from and the ordinals
   are raised by hand. The title is Inter ExtraBold, the flyer's weight. */

const CYAN = "#136986";
const INK = "#171717";

const root = process.cwd();
const [interMedium, interExtraBold, lion, illustration] = await Promise.all([
  readFile(join(root, "assets/fonts/Inter-Medium.ttf")),
  readFile(join(root, "assets/fonts/Inter-ExtraBold.ttf")),
  readFile(join(root, "public/logo-mark.png"), "base64"),
  readFile(join(root, "assets/nagaloka-footer.png"), "base64"),
]);

// 2172×724 source, drawn at the card's full width.
const ART = { width: 1200, height: 400 };

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          background: "white",
          color: INK,
          fontFamily: "Inter",
        }}
      >
        {/* The illustration first, so the text paints over its sky if the
            two ever meet. Placed so the halo clears the title; what runs
            past the card's bottom edge is the front row below the
            shoulders. */}
        <img
          alt=""
          src={`data:image/png;base64,${illustration}`}
          width={ART.width}
          height={ART.height}
          style={{ position: "absolute", left: 0, top: 304 }}
        />

        <img
          alt=""
          src={`data:image/png;base64,${lion}`}
          width={72}
          height={72}
          style={{ marginTop: 40 }}
        />

        {/* Dateline: ordinals raised by hand, a hairline between date and
            place, as in the flyer. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 22,
            fontSize: 26,
            fontWeight: 500,
            lineHeight: 1,
          }}
        >
          <span style={{ display: "flex", alignItems: "flex-start" }}>
            18
            <span style={{ fontSize: 15, marginTop: -2 }}>th</span>
            <span style={{ margin: "0 6px" }}>–</span>
            21
            <span style={{ fontSize: 15, marginTop: -2 }}>st</span>
            <span style={{ marginLeft: 7 }}>Feb</span>
          </span>
          <span
            style={{
              width: 1,
              height: 30,
              margin: "0 16px",
              background: "rgba(23, 23, 23, 0.4)",
            }}
          />
          <span>{CONVENTION_2027.location}</span>
        </div>

        {/* Two lines by hand: Satori would wrap by width and could land a
            lone "2027" on its own line. Each line is one string, since a
            div with two child nodes needs display: flex in Satori. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 14,
            fontSize: 66,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: 1.3,
            textTransform: "uppercase",
            color: CYAN,
          }}
        >
          <div>Buddhist Creators</div>
          <div>{`Convention ${CONVENTION_2027.year}`}</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
        { name: "Inter", data: interExtraBold, weight: 800, style: "normal" },
      ],
    },
  );
}
