import { CREATORS_PAGE } from "@/lib/creators";
import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

export const alt = `Creators · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: SITE_NAME,
    title: "Creators",
    tagline: CREATORS_PAGE.title,
  });
}
