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
