/* eslint-disable @next/next/no-img-element -- Satori renders these, not a browser. */
import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import {
  FacebookLogoIcon,
  GlobeSimpleIcon,
  InstagramLogoIcon,
  SealCheckIcon,
  TiktokLogoIcon,
  XLogoIcon,
  YoutubeLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { ImageResponse } from "next/og";
import { DAMASK_SIZE, DAMASK_TILE } from "@/lib/card-damask";
import { cardInitials, cardPhotoSrc, creatorTypeLabel, type CardSocial } from "@/lib/creator-card";
import type { CardHome } from "@/lib/creator-home";
import { formatCompact, formatCount } from "@/lib/format";
import { forLog } from "@/lib/log-error";
import { SITE_NAME, SITE_URL } from "@/lib/navigation";

/* The picture a creator shares of their card: the card laid flat on the
   brand cyan of its back, our name above it and the network it belongs
   to under it. Two shapes, for the two places a card is posted: a story
   (9:16) and a post in the feed (4:5, the tallest a feed shows whole).

   The card is the one on their page (components/creator-card/
   collectible-card.tsx) drawn again for Satori, at the same measures in
   rem, so every size below is a number of rem times `u`, the pixels a rem
   is worth in that shape. Satori has flexbox, absolute positioning and
   TTF fonts, but no CSS variables, color-mix, grid or em letter-spacing,
   so the white card's colours (WHITE in components/creators/podium/
   tiers.ts) and the tracking are worked out by hand.

   A story's top and foot sit under the app's own controls, so in that
   shape what matters stays within the middle 1,420 pixels. */

export const SHARE_FORMATS = {
  story: { width: 1080, height: 1920, u: 37, label: "Story" },
  post: { width: 1080, height: 1350, u: 26, label: "Post" },
} as const;
export type ShareFormat = keyof typeof SHARE_FORMATS;

export const isShareFormat = (value: string): value is ShareFormat => value in SHARE_FORMATS;

// The white card, and the brand around it.
const INK = "#12222a";
const CYAN = "#136986";
const RIM = "#3393b5";
const GROUND = "#dbe9ee"; // `mid`, the face
const LIGHT = "#eef4f6"; // `light`, the glow behind the photo
const LIGHT_CLEAR = "rgba(238, 244, 246, 0)"; // the same, faded out: "transparent" fades through black
const DEEP = "#6e93a1"; // `deep`, the embroidery's edge
const HEAD = "#c5d8df"; // `deep` 20% into `mid`, the face's top edge
const NUMERAL = "#486069"; // `deep` 65% toward black (podium-numeral)
const GOLDEN = "#e3b94a";
const CREAM = "#fff6e0";

const ink = (alpha: number) => `rgba(18, 34, 42, ${alpha})`;

const SOCIAL_ICON: Record<CardSocial, Icon> = {
  youtube: YoutubeLogoIcon,
  instagram: InstagramLogoIcon,
  facebook: FacebookLogoIcon,
  // Douyin has no icon of its own here; its mark is the same note as TikTok's.
  douyin: TiktokLogoIcon,
  tiktok: TiktokLogoIcon,
  x: XLogoIcon,
  website: GlobeSimpleIcon,
};

/* The icon library's components, written out as SVG markup. Next keeps
   react-dom/server out of a route, and an icon is a few plain elements
   inside one or two forwardRef wrappers, so it is unwrapped and written
   out here. */
type Wrapper = { render: (props: object, ref: null) => ReactNode };
const KEPT_CASE = new Set(["viewBox"]);

function markup(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node).replace(/[<&>]/g, "");
  if (Array.isArray(node)) return node.map(markup).join("");
  if (!isValidElement(node)) return "";
  const { type, props } = node as ReactElement<Record<string, unknown> & { children?: ReactNode }>;
  if (typeof type === "function") return markup((type as (props: object) => ReactNode)(props));
  if (typeof type === "object" && type && "render" in type) return markup((type as Wrapper).render(props, null));
  if (typeof type !== "string") return markup(props.children);
  const attributes = Object.entries(props)
    .filter(([key, value]) => key !== "children" && value !== undefined && value !== null && value !== false)
    .map(([key, value]) => {
      const name = KEPT_CASE.has(key) ? key : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      return ` ${name}="${String(value).replace(/"/g, "&quot;")}"`;
    })
    .join("");
  return `<${type}${attributes}>${Children.toArray(props.children).map(markup).join("")}</${type}>`;
}

/** An icon as a picture Satori can place. */
function iconSrc(Glyph: Icon, color: string, weight: "regular" | "fill" = "regular") {
  const svg = markup(<Glyph size={256} color={color} weight={weight} />);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const svgData = (svg: Buffer) => `data:image/svg+xml;base64,${svg.toString("base64")}`;
const pngData = (png: Buffer) => `data:image/png;base64,${png.toString("base64")}`;

/* What every picture uses, read once: the fonts, the white lion, and the
   lion again in the embroidery's edge colour, which Satori cannot tint. */
const root = process.cwd();
const assets = (async () => {
  const [interMedium, interDisplaySemiBold, lion] = await Promise.all([
    readFile(join(root, "assets/fonts/Inter-Medium.ttf")),
    readFile(join(root, "assets/fonts/InterDisplay-SemiBold.ttf")),
    readFile(join(root, "assets/logo-mark-white.png")),
  ]);
  const sharp = await loadSharp();
  const { width = 530, height = 490 } = await sharp(lion).metadata();
  const edge = await sharp({ create: { width, height, channels: 4, background: DEEP } })
    .composite([{ input: lion, blend: "dest-in" }])
    .png()
    .toBuffer();
  return { interMedium, interDisplaySemiBold, lion: pngData(lion), lionEdge: pngData(edge), lionRatio: height / width };
})();

/* sharp turns a WebP photo (what the card form uploads) into a PNG, which
   Satori can draw. It runs inside the server process on a small instance
   (see next.config.ts), so it keeps no cache and one thread, and is only
   ever handed one photo of a few hundred pixels. */
async function loadSharp() {
  const sharp = (await import("sharp")).default;
  sharp.cache(false);
  sharp.concurrency(1);
  return sharp;
}

const PHOTO_BYTES = 4 * 1024 * 1024;

/** The card's photo as a data URL Satori can draw, or null to show the initials. */
async function photoData(url: string | null | undefined): Promise<string | null> {
  const src = cardPhotoSrc(url);
  if (!src) return null;
  try {
    const response = await fetch(src, { signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > PHOTO_BYTES) return null;
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return `data:image/jpeg;base64,${bytes.toString("base64")}`;
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return pngData(bytes);
    const sharp = await loadSharp();
    const png = await sharp(bytes, { limitInputPixels: 4096 * 4096 })
      .resize(512, 512, { fit: "cover" })
      .png()
      .toBuffer();
    return pngData(png);
  } catch (error) {
    console.error("[card-share] could not draw the card's photo", forLog(error));
    return null;
  }
}

async function flagData(code: string | null) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return null;
  try {
    return svgData(await readFile(join(root, "public/flags", `${code}.svg`)));
  } catch {
    return null;
  }
}

/** The place, sized by how long it is as printed, as the card does it. */
function rankRem(text: string) {
  if (text.length <= 2) return 3.25;
  if (text.length === 3) return 2.75;
  if (text.length <= 5) return 2;
  return 1.625;
}

/** A small uppercase line, tracked 0.14em as the site's labels are. */
function Label({ u, color, children, size = 0.6875 }: { u: number; color: string; children: ReactNode; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontFamily: "Inter Display",
        fontWeight: 600,
        fontSize: size * u,
        lineHeight: 1.3,
        letterSpacing: size * u * 0.14,
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </div>
  );
}

export async function cardShareImage(home: CardHome, format: ShareFormat) {
  const { width, height, u } = SHARE_FORMATS[format];
  const story = format === "story";
  const [{ interMedium, interDisplaySemiBold, lion, lionEdge, lionRatio }, photo, flag] = await Promise.all([
    assets,
    photoData(home.card.photoUrl),
    flagData(home.card.countryCode),
  ]);

  const { card } = home;
  const name = card.displayName.trim();
  const type = creatorTypeLabel(card.creatorType);
  const tagline = card.tagline?.trim();
  const place = home.standing ? formatCount(home.standing.rank) : null;
  const cardWidth = 23 * u;
  const frame = 0.4375 * u;
  const photoSize = 6.5 * u;
  const lionWidth = 0.84 * (cardWidth - 2 * frame);
  const edgeNudge = Math.max(2, 0.06 * u);
  const network = home.network;

  // Space outside the card: the brand above, the network below.
  const brandSize = story ? 44 : 36;
  const lineSize = story ? 36 : 30;

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
          backgroundColor: "#0d5973",
          backgroundImage: "radial-gradient(ellipse 75% 60% at 50% 48%, #1b7b9a, #0d5973)",
          color: "white",
          fontFamily: "Inter",
          fontWeight: 500,
        }}
      >
        {/* Our name, with the lion. */}
        <div style={{ display: "flex", alignItems: "center", gap: brandSize * 0.4 }}>
          <img alt="" src={lion} width={brandSize * 1.5} height={brandSize * 1.5 * lionRatio} />
          <div
            style={{
              fontFamily: "Inter Display",
              fontWeight: 600,
              fontSize: brandSize,
              letterSpacing: -0.01 * brandSize,
            }}
          >
            {SITE_NAME}
          </div>
        </div>

        {/* The card. */}
        <div
          style={{
            marginTop: story ? 72 : 44,
            width: cardWidth,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            borderRadius: 1.25 * u,
            border: `${frame}px solid ${RIM}`,
            backgroundColor: GROUND,
            backgroundImage: `radial-gradient(circle ${11 * u}px at 50% ${5.5 * u - frame}px, ${LIGHT}, ${LIGHT_CLEAR}), linear-gradient(to bottom, ${HEAD}, ${GROUND} ${5.5 * u}px)`,
            padding: `${1.25 * u - frame}px ${1.25 * u - frame}px ${2.25 * u - frame}px`,
            color: INK,
            textAlign: "center",
            overflow: "hidden",
            boxShadow: "0 40px 80px -20px rgba(4, 30, 40, 0.55)",
          }}
        >
          {/* The clouds woven into the face. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundImage: `url('${DAMASK_TILE}')`,
              backgroundSize: `${DAMASK_SIZE.width * u}px ${DAMASK_SIZE.height * u}px`,
              backgroundPosition: `${cardWidth / 2 - frame - (DAMASK_SIZE.width * u) / 2}px ${DAMASK_SIZE.top * u - frame}px`,
              backgroundRepeat: "repeat",
            }}
          />
          {/* The lion, embroidered large: its edge stitched in `deep`, then the pale thread. */}
          {[
            [-edgeNudge, 0],
            [edgeNudge, 0],
            [0, -edgeNudge],
            [0, edgeNudge],
          ].map(([x, y], index) => (
            <img
              key={index}
              alt=""
              src={lionEdge}
              width={lionWidth}
              height={lionWidth * lionRatio}
              style={{ position: "absolute", left: (cardWidth - 2 * frame - lionWidth) / 2 + x, bottom: 1.25 * u + y, opacity: 0.35 }}
            />
          ))}
          <img
            alt=""
            src={lion}
            width={lionWidth}
            height={lionWidth * lionRatio}
            style={{ position: "absolute", left: (cardWidth - 2 * frame - lionWidth) / 2, bottom: 1.25 * u, opacity: 0.85 }}
          />

          {/* The head: the place, the photo and the flag. */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%", position: "relative", paddingTop: u }}>
            {place && (
              <div style={{ position: "absolute", top: 0, left: 0.375 * u, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <Label u={u} color={ink(0.75)}>
                  Rank
                </Label>
                <div
                  style={{
                    marginTop: 0.25 * u,
                    fontFamily: "Inter Display",
                    fontWeight: 600,
                    fontSize: rankRem(place) * u,
                    lineHeight: 0.85,
                    letterSpacing: -0.025 * rankRem(place) * u,
                    color: NUMERAL,
                  }}
                >
                  {place}
                </div>
              </div>
            )}
            {flag && (
              <img
                alt=""
                src={flag}
                width={1.875 * u}
                height={1.25 * u}
                style={{
                  position: "absolute",
                  top: 0.375 * u,
                  right: 0.375 * u,
                  borderRadius: 0.1875 * u,
                  objectFit: "cover",
                  boxShadow: `0 0 0 ${Math.max(1, 0.0625 * u)}px rgba(18, 34, 42, 0.2)`,
                }}
              />
            )}
            <div style={{ display: "flex", position: "relative" }}>
              {photo ? (
                <img
                  alt=""
                  src={photo}
                  width={photoSize}
                  height={photoSize}
                  style={{ borderRadius: photoSize, border: `${0.25 * u}px solid ${CYAN}`, objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: photoSize,
                    height: photoSize,
                    borderRadius: photoSize,
                    border: `${0.25 * u}px solid ${CYAN}`,
                    backgroundColor: "#f1ece2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Inter Display",
                    fontWeight: 600,
                    fontSize: 2.25 * u,
                    color: CYAN,
                  }}
                >
                  {cardInitials(name)}
                </div>
              )}
              {home.status === "approved" && (
                <div style={{ position: "absolute", right: 0.125 * u, bottom: 0.125 * u, display: "flex", width: 1.75 * u, height: 1.75 * u }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0.47 * u,
                      top: 0.47 * u,
                      width: 0.81 * u,
                      height: 0.81 * u,
                      borderRadius: u,
                      backgroundColor: "white",
                    }}
                  />
                  <img alt="" src={iconSrc(SealCheckIcon, CYAN, "fill")} width={1.75 * u} height={1.75 * u} />
                </div>
              )}
            </div>
          </div>

          {/* Who they are. */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 1.25 * u, position: "relative" }}>
            {type && (
              <Label u={u} color={CYAN}>
                {type}
              </Label>
            )}
            <div
              style={{
                marginTop: type ? 0.375 * u : 0,
                fontFamily: "Inter Display",
                fontWeight: 600,
                fontSize: 1.5 * u,
                lineHeight: 1.2,
                letterSpacing: -0.02 * 1.5 * u,
                maxWidth: 20 * u,
              }}
            >
              {name}
            </div>
            {card.country && (
              <div style={{ marginTop: 0.25 * u, fontSize: 0.875 * u, lineHeight: 1.4, color: ink(0.75) }}>{card.country}</div>
            )}
            {tagline && (
              <div style={{ marginTop: 0.75 * u, maxWidth: 19 * u, fontSize: 0.9375 * u, lineHeight: 1.5, color: ink(0.85) }}>
                {tagline}
              </div>
            )}
          </div>

          {/* The figure. */}
          {home.followers > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 1.5 * u, position: "relative" }}>
              <div
                style={{
                  fontFamily: "Inter Display",
                  fontWeight: 600,
                  fontSize: 2.75 * u,
                  lineHeight: 1,
                  letterSpacing: -0.025 * 2.75 * u,
                }}
              >
                {formatCount(home.followers)}
              </div>
              <div style={{ display: "flex", marginTop: 0.5 * u }}>
                <Label u={u} color={ink(0.75)}>
                  Followers
                </Label>
              </div>
            </div>
          )}

          {/* Where they publish. */}
          {home.channels.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 0.375 * u,
                marginTop: 1.5 * u,
                position: "relative",
                maxWidth: 20.5 * u,
              }}
            >
              {home.channels.map((channel) => {
                const figure = channel.followers ? formatCompact(channel.followers) : null;
                return (
                  <div
                    key={channel.place}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.375 * u,
                      height: 2 * u,
                      // Satori reads every key it is given, an undefined one included.
                      ...(figure ? { padding: `0 ${0.625 * u}px` } : { width: 2 * u }),
                      justifyContent: "center",
                      borderRadius: u,
                      border: `${Math.max(1, 0.0625 * u)}px solid ${ink(0.15)}`,
                      backgroundColor: "rgba(255, 255, 255, 0.7)",
                      fontSize: 0.8125 * u,
                    }}
                  >
                    <img alt="" src={iconSrc(SOCIAL_ICON[channel.place], INK)} width={u} height={u} />
                    {figure}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* The network the card belongs to. */}
        <div
          style={{
            marginTop: story ? 72 : 44,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: story ? 820 : 900,
            textAlign: "center",
          }}
        >
          {/* Two lines, broken where the sense breaks. */}
          {network && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: lineSize, lineHeight: 1.35, color: CREAM }}>
              <div>{`One of ${formatCount(network.creators)} Buddhist creators`}</div>
              <div style={{ display: "flex" }}>
                reaching&nbsp;
                <span style={{ color: GOLDEN, fontFamily: "Inter Display", fontWeight: 600 }}>
                  {formatCompact(network.followers)}
                </span>
                &nbsp;people together
              </div>
            </div>
          )}
          <div
            style={{
              marginTop: network ? lineSize * 0.6 : 0,
              fontSize: lineSize * 0.75,
              letterSpacing: lineSize * 0.75 * 0.06,
              color: "rgba(255, 255, 255, 0.75)",
            }}
          >
            {new URL(SITE_URL).host}
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: "Inter", data: interMedium, weight: 500, style: "normal" },
        { name: "Inter Display", data: interDisplaySemiBold, weight: 600, style: "normal" },
      ],
    },
  );
}
