import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";
import { PEOPLE_PAGE } from "@/lib/people";

export const alt = `People · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: SITE_NAME,
    title: "People",
    tagline: PEOPLE_PAGE.title,
  });
}
