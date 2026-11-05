/* People page content. The team roster is real; roles and portraits for
   five members come from webuddhist.com/team, and the two members not
   listed there have no role or portrait yet. Every creator entry is still a
   placeholder until the real roster is supplied. */

export type Social = {
  platform: "youtube" | "instagram" | "x";
  href: string;
};

export type Creator = {
  name: string;
  socials: Social[];
  /** Path under /public. Omitted entries show the placeholder portrait. */
  image?: { src: string; alt: string; width: number; height: number };
};

export type TeamMember = {
  name: string;
  /** Omitted until confirmed; the card then shows the name alone. */
  role?: string;
  image?: { src: string; alt: string; width: number; height: number };
};

export const PEOPLE_PAGE = {
  eyebrow: "People",
  title: "The people behind the work",
  description:
    "The team behind Buddhist Creators, and the creators who share the Dharma on their channels.",
} as const;

export const CREATORS_SECTION = {
  id: "creators",
  title: "Our Creators",
  description: "Film, writing, music and design, across platforms and languages.",
} as const;

export const TEAM_SECTION = {
  id: "team",
  title: "Our Team",
  description: "The small group running programs, the convention and the studio.",
} as const;

export const CREATORS: Creator[] = [
  {
    name: "Creator Name",
    socials: [
      { platform: "youtube", href: "https://youtube.com/" },
      { platform: "instagram", href: "https://instagram.com/" },
    ],
  },
  {
    name: "Creator Name",
    socials: [{ platform: "instagram", href: "https://instagram.com/" }],
  },
  {
    name: "Creator Name",
    socials: [
      { platform: "youtube", href: "https://youtube.com/" },
      { platform: "x", href: "https://x.com/" },
    ],
  },
  {
    name: "Creator Name",
    socials: [{ platform: "youtube", href: "https://youtube.com/" }],
  },
  {
    name: "Creator Name",
    socials: [
      { platform: "instagram", href: "https://instagram.com/" },
      { platform: "youtube", href: "https://youtube.com/" },
    ],
  },
  {
    name: "Creator Name",
    socials: [{ platform: "instagram", href: "https://instagram.com/" }],
  },
  {
    name: "Creator Name",
    socials: [
      { platform: "youtube", href: "https://youtube.com/" },
      { platform: "instagram", href: "https://instagram.com/" },
      { platform: "x", href: "https://x.com/" },
    ],
  },
  {
    name: "Creator Name",
    socials: [{ platform: "youtube", href: "https://youtube.com/" }],
  },
];

const portrait = (file: string, name: string) => ({
  src: `/people/${file}.webp`,
  alt: `Portrait of ${name}`,
  width: 800,
  height: 800,
});

export const TEAM: TeamMember[] = [
  {
    name: "Jennifer Yo",
    image: portrait("jennifer-yo", "Jennifer Yo"),
  },
  {
    name: "Tenzin Noryang",
    role: "Executive Manager",
    image: portrait("tenzin-noryang", "Tenzin Noryang"),
  },
  { name: "Karma Phuntsok Namgyal" },
  {
    name: "Yash Dixit",
    role: "Community Engagement Manager",
    image: portrait("yash-dixit", "Yash Dixit"),
  },
  {
    name: "Achal",
    role: "Assistant, Community Engagement",
    image: portrait("achal", "Achal"),
  },
  {
    name: "Norbu Tsering",
    role: "Social Media & Communication Associate",
    image: portrait("norbu-tsering", "Norbu Tsering"),
  },
  {
    name: "Tenzin Tsering",
    role: "HR, People Strategist",
    image: portrait("tenzin-tsering", "Tenzin Tsering"),
  },
];
