import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AWARDS_2027 } from "@/lib/awards-2027";
import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-card";

export const alt = `${AWARDS_2027.title} · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/* The awards page's social card: the awards page's sky-deep band with the
   lion, the convention's name and "Awards 2027" in the banners' gold. No
   status line ("nominations open"): platforms keep a card for weeks, and a
   status goes stale. Satori takes no CSS variables, so colours are
   literals. */

const SKY_DEEP = "#0c3b4e";
const SAFFRON = "#f2b130";

const root = process.cwd();
const [interMedium, interExtraBold, lion] = await Promise.all([
  readFile(join(root, "assets/fonts/Inter-Medium.ttf")),
  readFile(join(root, "assets/fonts/Inter-ExtraBold.ttf")),
  readFile(join(root, "public/logo-mark.png"), "base64"),
]);

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
          justifyContent: "center",
          background: SKY_DEEP,
          color: "white",
          fontFamily: "Inter",
        }}
      >
        {/* The mark is black line art; inverted to white on the band. */}
        <img
          alt=""
          src={`data:image/png;base64,${lion}`}
          width={88}
          height={88}
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <div style={{ marginTop: 28, fontSize: 30, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase" }}>
          Buddhist Creators Convention
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -2,
            textTransform: "uppercase",
            color: SAFFRON,
          }}
        >
          {`Awards ${AWARDS_2027.year}`}
        </div>
        <div style={{ marginTop: 26, fontSize: 30, fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
          Nagaloka, Nagpur, India
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
