import { GET_INVOLVED_PAGE } from "@/lib/get-involved";
import { SITE_NAME } from "@/lib/navigation";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/og-card";

export const alt = `Get Involved · ${SITE_NAME}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogCard({
    eyebrow: SITE_NAME,
    title: "Get Involved",
    tagline: GET_INVOLVED_PAGE.title,
  });
}
