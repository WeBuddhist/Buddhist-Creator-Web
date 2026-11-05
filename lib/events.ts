/* Events listing. Grouping is stored, not computed from the clock: the page
   is prerendered, and a value that changes between renders would break
   that. Move an entry between the two lists when it passes. */

export type EventEntry = {
  title: string;
  /** Human label and the ISO dates behind it, for the <time> element. */
  date: { label: string; start: string; end?: string };
  location: string;
  description: string;
  /** Where the card leads. Omitted when there is nothing to open yet. */
  href?: string;
  /** Absolute URL off this site. Opens in a new tab with an external cue. */
  external?: true;
  /** Label for that link. Defaults to "View details". */
  cta?: string;
  /** Path under /public. Omitted entries show the placeholder. */
  image?: { src: string; alt: string; width: number; height: number };
  featured?: true;
  /** Outcome figures, shown on past and ongoing events. */
  stats?: { value: string; label: string }[];
};

export const EVENTS_PAGE = {
  eyebrow: "Events",
  title: "Where creators gather",
  description:
    "Conventions, masterclasses and community practice days, in person and online. Everything we host, past and upcoming.",
} as const;

/* Figures below are placeholders until the real numbers are in. */
export const ONGOING_EVENTS: EventEntry[] = [
  {
    title: "WeBuddhist Influencer Masterclass 2026",
    date: { label: "1 – 6 November 2026", start: "2026-11-01", end: "2026-11-06" },
    location: "Dzongsar Khyentse Chökyi Lodrö Institute, Himachal Pradesh, India",
    description: "Six days on marketing the Dharma, hosted by Khyentse Foundation.",
    featured: true,
  },
  {
    title: "Bodhisattva Challenge",
    date: { label: "Daily, through 2026", start: "2026-01-01", end: "2026-12-31" },
    location: "Online, WeBuddhist Creator Assistant",
    description: "A year-long daily practice inspired by The Way of the Bodhisattva, open to anyone who wants to take part.",
    href: "https://webuddhist.com/plans",
    external: true,
    cta: "Join the challenge",
    stats: [
      { value: "40", label: "Plans" },
      { value: "358", label: "Days" },
    ],
  },
];

export const UPCOMING_EVENTS: EventEntry[] = [
  {
    title: "Buddhist Creators Convention 2027",
    date: { label: "10 – 13 January 2027", start: "2027-01-10", end: "2027-01-13" },
    location: "Bodh Gaya, Bihar, India",
    description: "The next global gathering, building on the momentum of 2026’s first convention.",
  },
];

export const PAST_EVENTS: EventEntry[] = [
  {
    title: "Guru Rinpoche Day",
    date: { label: "24 July 2026", start: "2026-07-24" },
    location: "Online",
    description: "A day of shared practice and content on the tenth day of the lunar month, carried across creators’ channels.",
    stats: [
      { value: "42", label: "Collaborators" },
      { value: "1.1M", label: "Engagements" },
    ],
  },
  {
    title: "Saka Dawa",
    date: { label: "31 May 2026", start: "2026-05-31" },
    location: "Online",
    description: "Creators marked the Buddha’s birth, enlightenment and passing with a month of teachings, verses and reflections.",
    stats: [
      { value: "58", label: "Collaborators" },
      { value: "2.4M", label: "Engagements" },
    ],
  },
  {
    title: "Buddhist Creators Convention 2026",
    date: { label: "29 January – 6 February 2026", start: "2026-01-29", end: "2026-02-06" },
    location: "Bodh Gaya, Bihar, India",
    description: "Nine days with 110 creators from 10 countries: talks, a masterclass and the first Buddhist Influencer of the Year awards.",
    href: "/convention/2026",
    cta: "Read the report",
    stats: [
      { value: "110", label: "Creators" },
      { value: "10", label: "Countries" },
    ],
  },
  {
    title: "Lhabab Düchen",
    date: { label: "11 November 2025", start: "2025-11-11" },
    location: "Online, Google Meet",
    description: "A day of collective practice and reflection marking the Buddha’s descent from the heavens, open to the whole community.",
    stats: [
      { value: "27", label: "Collaborators" },
      { value: "640K", label: "Engagements" },
    ],
  },
];
