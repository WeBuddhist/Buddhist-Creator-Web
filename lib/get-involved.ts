/* Content for the Get Involved page, carried over from the previous
   buddhistcreators.com page with two additions: sponsoring a scholarship
   and volunteering as a trainer. Challenge images are placeholders until
   photos are chosen. */

const EMAIL = "hello@buddhistcreators.com";
const mailto = (subject: string) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}`;

export const GET_INVOLVED_PAGE = {
  eyebrow: "Get involved",
  title: "Help carry the Dharma into the digital age",
  description:
    "Whether you create, lead an institution, or want to join us behind the scenes, there is a place for you in this community.",
} as const;

export type Challenge = {
  title: string;
  body: string;
  /** Path under /public. Omitted entries show the placeholder. */
  image?: { src: string; alt: string; width: number; height: number };
};

export const CREATOR = {
  id: "creator",
  eyebrow: "As a creator",
  title: "Join a challenge, or bring your own content to the community",
  description:
    "Two challenges are open right now, and every convention, masterclass and award season is another chance to create alongside the community.",
  challenges: [
    {
      title: "Bodhisattva Challenge",
      body: "A year-long daily practice inspired by The Way of the Bodhisattva, delivered through the WeBuddhist Creator Assistant.",
    },
    {
      title: "My Buddha Moment",
      body: "A creative reel challenge inviting practitioners to share a Buddhist teaching, verse or moment that resonates with them.",
    },
  ] as Challenge[],
  programs: {
    title: "Looking for the next convention or masterclass?",
    body: "The annual convention, the WeBuddhist Influencer Masterclass and the Buddhist Influencer of the Year awards are where creators go deeper together.",
    actions: [
      { label: "See all events", href: "/events" },
      { label: "Explore the 2026 convention", href: "/convention/2026" },
    ],
  },
} as const;

export const PARTNER = {
  id: "partner",
  eyebrow: "As an institution or group",
  title: "Become our partner",
  description:
    "Monasteries, foundations and organisations already power our two flagship initiatives. Join them in bringing the Dharma to the digital age.",
  ways: [
    {
      title: "Buddhist Creators Convention",
      body: "Our annual global gathering in Bodh Gaya. Sponsor a scholarship seat, host a session or support the ceremony.",
    },
    {
      title: "WeBuddhist Influencer Masterclass",
      body: "An intensive, practice-led training that runs at partner institutes through the year. Host the next one at your centre.",
    },
  ],
  partnersTitle: "Organisations already partnering with us",
  action: { label: "Start a partnership conversation", href: mailto("Partnership Inquiry") },
} as const;

export const SUPPORT = {
  id: "support",
  eyebrow: "As an individual",
  title: "Give your time or your support",
  description: "Two direct ways to help a creator who could not otherwise take part.",
  ways: [
    {
      title: "Fund a future Buddhist creator",
      body: "Sponsor scholarships for future participants who wish to attend the convention. Scholarships cover travel and accommodation.",
      action: { label: "Sponsor a scholarship", href: mailto("Scholarship Sponsorship") },
    },
    {
      title: "Become a trainer",
      body: "Volunteer as a trainer for the Local Influencer Clubs and pass on what you know about creating for an audience.",
      action: { label: "Volunteer as a trainer", href: mailto("Volunteer as a Trainer") },
    },
  ],
} as const;

export const TEAM = {
  id: "team",
  eyebrow: "Join our team",
  title: "Help us build the movement from the inside",
  description:
    "We are a small, fast-growing team behind the convention, the masterclass and the awards, and we are always glad to hear from people who want to contribute their time and skills. Tell us a little about yourself and where you would like to help.",
  action: { label: "Introduce yourself", href: mailto("Join the Team") },
} as const;
