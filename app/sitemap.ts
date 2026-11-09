import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/navigation";

/* Every page under app/. Add a route here when you add a page. The nav's
   /convention entry is a menu heading, not a page, so it is not listed. No lastModified: it would need a real date per page, and
   a build-time timestamp would only mislead crawlers. */
const ROUTES = [
  "/",
  "/get-involved",
  "/program",
  "/convention/2026",
  "/convention/2027",
  "/people",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` }));
}
