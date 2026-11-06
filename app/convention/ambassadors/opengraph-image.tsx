import { AMBASSADORS_PAGE } from "@/lib/ambassadors";
import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

export const alt = `Ambassador Programme · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: `${SITE_NAME} · ${AMBASSADORS_PAGE.eyebrow}`,
    title: AMBASSADORS_PAGE.title,
    tagline: "Selected at each convention, and carrying the title until the next one.",
  });
}
