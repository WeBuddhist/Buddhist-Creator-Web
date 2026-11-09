import { CONVENTION } from "@/lib/convention-2026";
import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

export const alt = `${CONVENTION.title} · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: `${SITE_NAME} · ${CONVENTION.location}`,
    title: `Convention ${CONVENTION.year}`,
    // Non-breaking spaces keep each figure with its noun across a wrap.
    tagline: "Nine days with 110 creators from 10 countries.",
  });
}
