import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

/* The homepage card, and the fallback for any route without its own. */

export const alt = `${SITE_NAME}: a global sangha of creators bringing the Dharma to the digital age`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: "A global sangha of creators",
    title: SITE_NAME,
    tagline: "Bringing the Dharma to the digital age.",
  });
}
