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
  { label: "Program", href: "/events" },
  {
    label: "Convention",
    href: "/convention",
    children: [
      {
        label: "Buddhist Creators Convention 2026",
        href: "/convention/2026",
        description: "Nine days in Bodh Gaya: talks, a masterclass and awards.",
      },
    ],
  },
  { label: "People", href: "/people" },
  {
    label: "Products",
    href: "/products",
    children: [
      {
        label: "WeBuddhist",
        href: "https://webuddhist.com/",
        description: "A home for Dharma teachings, practice and community online.",
        external: true,
      },
      {
        label: "WeBuddhist App",
        href: "https://apps.apple.com/in/app/webuddhist/id6745810914",
        description: "Teachings, prayers and daily practice in your pocket.",
        external: true,
      },
      {
        label: "WeBuddhist Academy",
        href: "https://apps.webuddhistacademy.com/catalog/",
        description: "Structured courses on Buddhist study and practice.",
        external: true,
      },
    ],
  },
];

export const SITE_NAME = "Buddhist Creators";

/** Canonical origin, with no trailing slash. Absolute URLs in metadata,
    the sitemap and robots.txt are built from it. Falls back to the Render
    host until the site moves: once buddhistcreators.com serves this app,
    set NEXT_PUBLIC_SITE_URL to it. Read at build time. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://buddhist-creator.onrender.com";

/** The default meta description, and the homepage's social-card text. */
export const SITE_DESCRIPTION =
  "A global sangha of monastics, practitioners and storytellers carrying the Dharma to the digital age through a convention, masterclasses, awards and campaigns.";
