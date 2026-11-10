export type NavChild = {
  label: string;
  href: string;
  description?: string;
  /** Absolute URL off this site. Opens in a new tab with an external cue. */
  external?: true;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Get Involved", href: "/get-involved" },
  { label: "Program", href: "/program" },
  {
    label: "Convention",
    href: "/convention",
    children: [
      {
        label: "Buddhist Creators Convention 2027",
        href: "/convention/2027",
        description: "18 – 21 February 2027 at Nagaloka, Nagpur.",
      },
      {
        label: "Buddhist Creators Convention 2026",
        href: "/convention/2026",
        description: "Nine days in Bodh Gaya: talks, a masterclass and awards.",
      },
    ],
  },
  { label: "People", href: "/people" },
];

export const SITE_NAME = "Buddhist Creators";

/* NEXT_PUBLIC_SITE_URL is required and has no fallback: a build without
   it stops here, instead of shipping a sitemap and social cards that point
   at the wrong host. */
function siteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL is not set");
  return url.replace(/\/+$/, "");
}

/** Canonical origin, with no trailing slash. Absolute URLs in metadata,
    the sitemap and robots.txt are built from it. Read at build time. */
export const SITE_URL = siteUrl();

/** The default meta description, and the homepage's social-card text. */
export const SITE_DESCRIPTION =
  "A global sangha of monastics, practitioners and storytellers carrying the Dharma to the digital age through a convention, masterclasses, awards and campaigns.";
