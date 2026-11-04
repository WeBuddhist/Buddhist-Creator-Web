export type NavChild = {
  label: string;
  href: string;
  description?: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Get Involved", href: "/get-involved" },
  { label: "Programs", href: "/programs" },
  {
    label: "Products",
    href: "/products",
    children: [
      {
        label: "WeBuddhist",
        href: "/products/webuddhist",
        description: "A home for Dharma teachings, practice and community online.",
      },
      {
        label: "WeBuddhist App",
        href: "/products/webuddhist-app",
        description: "Teachings, prayers and daily practice in your pocket.",
      },
      {
        label: "Sherab",
        href: "/products/sherab",
        description: "Study tools that make Buddhist texts easier to explore.",
      },
    ],
  },
  {
    label: "Convention",
    href: "/convention",
    children: [
      {
        label: "Buddhist Creators Convention 2025",
        href: "/convention/2025",
        description: "Talks, awards and masterclasses from last year's gathering.",
      },
    ],
  },
  { label: "Our Creators", href: "/creators" },
];

export const SITE_NAME = "Buddhist Creators";
