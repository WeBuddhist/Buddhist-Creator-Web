import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/navigation";

/* Every page under app/. Add a route here when you add a page. The nav's
   /convention and /products entries are menu headings, not pages, so they
   are not listed. No lastModified: it would need a real date per page, and
   a build-time timestamp would only mislead crawlers. */
const ROUTES = [
  "/",
  "/get-involved",
  "/events",
  "/convention/2026",
  "/people",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: `${SITE_URL}${path === "/" ? "" : path}` }));
}
