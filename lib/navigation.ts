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
  { label: "Events", href: "/events" },
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
];

export const SITE_NAME = "Buddhist Creators";
