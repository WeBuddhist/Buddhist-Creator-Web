import { EVENTS_PAGE } from "@/lib/events";
import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

export const alt = `Events · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: SITE_NAME,
    title: "Events",
    tagline: EVENTS_PAGE.title,
  });
}
