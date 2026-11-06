/* Events listing. Grouping is stored, not computed from the clock: the page
   is prerendered, and a value that changes between renders would break
   that. Move an entry between the two lists when it passes. */

import type { StaticImageData } from "next/image";
import masterclass2026 from "@/public/events/masterclass-2026.webp";
import bodhisattvaChallenge from "@/public/events/bodhisattva-challenge.webp";
import convention2027 from "@/public/events/convention-2027.webp";
import guruRinpocheDay from "@/public/events/guru-rinpoche-day.webp";
import sakaDawa from "@/public/events/saka-dawa.webp";
import conventionHero from "@/public/convention/2026/hero.webp";
import lhababDuchen from "@/public/events/lhabab-duchen.webp";

export type EventEntry = {
  title: string;
  /** Human label and, when it is a real date, the ISO dates behind it for
      the <time> element. A campaign that ran on several days has a label
      only; one with no known date has none. */
  date?: { label: string; start?: string; end?: string };
  location: string;
  /** The summary on a card. The past list shows the gist instead. */
  description?: string;
  /** The full write-up a past event opens to in the list. */
  gist?: string;
  /** Where the card leads. Omitted when there is nothing to open yet. */
  href?: string;
  /** Absolute URL off this site. Opens in a new tab with an external cue. */
  external?: true;
  /** Label for that link. Defaults to "View details". */
  cta?: string;
  /** Static import, which carries its size and blur. Omitted entries show the placeholder. */
  image?: { src: StaticImageData; alt: string };
  featured?: true;
  /** Outcome figures, shown on past and ongoing events. */
  stats?: { value: string; label: string }[];
};

export const EVENTS_PAGE = {
  eyebrow: "Program",
  title: "Where creators gather",
  description:
    "Our five creator campaigns have earned over 1.26 million views, 100,000+ likes and 7,600+ shares. From 15 April to 5 November 2026, more than 9 million people viewed our social media page and profile, and 7,000+ new followers joined us. Beyond these campaigns, we also collaborate with creators on their own videos.",
} as const;

/* Figures below are placeholders until the real numbers are in. */
export const ONGOING_EVENTS: EventEntry[] = [
  {
    title: "WeBuddhist Influencer Masterclass 2026",
    date: { label: "1 – 6 November 2026", start: "2026-11-01", end: "2026-11-06" },
    location: "Dzongsar Khyentse Chökyi Lodrö Institute, Himachal Pradesh, India",
    description: "Six days on marketing the Dharma, hosted by Khyentse Foundation.",
    image: {
      src: masterclass2026,
      alt: "Monks in maroon robes debating on a monastery courtyard at sunset, with mountains behind the red and gold temple.",
    },
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
    image: {
      src: bodhisattvaChallenge,
      alt: "Illustration of a figure with hands joined in prayer, filled with golden lotus flowers, before sunlit dunes",
    },
  },
];

export const UPCOMING_EVENTS: EventEntry[] = [
  {
    title: "Buddhist Creators Convention 2027",
    date: { label: "18 – 21 February 2027", start: "2027-02-18", end: "2027-02-21" },
    location: "Nagaloka, Nagpur, India",
    description: "The next global gathering, building on the momentum of 2026’s first convention.",
    image: {
      src: convention2027,
      alt: "Flyer for Buddhist Creators Convention 2027 with a crayon illustration of the Walking Buddha at Nagaloka, Nagpur",
    },
  },
];

export const PAST_EVENTS: EventEntry[] = [
  {
    title: "Guru Rinpoche Day",
    date: { label: "Several Guru Rinpoche Days" },
    location: "Online",
    gist: "Guru Rinpoche Day is one of the most sacred days in Tibetan Buddhism. We ran this campaign on several Guru Rinpoche Days, in collaboration with creators who talked about who Guru Rinpoche was, why he matters, and how people can honour him. The aim was to spread awareness and share knowledge about the day with a wider audience.",
    image: {
      src: guruRinpocheDay,
      alt: "Thangka painting of Guru Rinpoche seated on a lotus, holding a vajra and skull cup, before a golden halo and mountains.",
    },
    stats: [
      { value: "18", label: "Creators" },
      { value: "300K+", label: "Views" },
      { value: "10.9K+", label: "Likes" },
      { value: "648+", label: "Shares" },
    ],
  },
  {
    title: "Saka Dawa Challenge 2026",
    date: { label: "31 May 2026", start: "2026-05-31" },
    location: "Online",
    gist: "Saka Dawa is the holiest month for many Buddhists, and it is closely linked with making merit and acts of kindness. For this challenge, we collaborated with creators who made videos about Saka Dawa and did a real act of kindness, then shared it. It turned kindness into something people could see and join in with, and it became our biggest campaign of the season.",
    image: {
      src: sakaDawa,
      alt: "Thangka painting of Shakyamuni Buddha seated on a lotus throne, one hand touching the earth, among green hills and clouds.",
    },
    stats: [
      { value: "15", label: "Videos" },
      { value: "578K+", label: "Views" },
      { value: "60K+", label: "Likes" },
      { value: "5K+", label: "Shares" },
    ],
  },
  {
    title: "Buddha Purnima: My Buddha Moment",
    date: { label: "Buddha Purnima" },
    location: "Online",
    gist: "For Buddha Purnima, we ran “My Buddha Moment”, a creative competition in collaboration with 14 creators, who each shared a moment when the Buddha’s teachings touched their lives. The best creators across three categories received cash prizes.",
    stats: [
      { value: "14", label: "Creators" },
      { value: "60K+", label: "Views" },
      { value: "6.5K+", label: "Likes" },
      { value: "300+", label: "Shares" },
    ],
  },
  {
    title: "Buddhist Creators Convention 2026",
    date: { label: "29 January – 6 February 2026", start: "2026-01-29", end: "2026-02-06" },
    location: "Bodh Gaya, Bihar, India",
    gist: "In January 2026, 110 creators from 10 countries gathered in Bodh Gaya, the first global sangha of its kind. Nine days ran in three phases: community days with an opening ceremony, keynotes, a panel and lightning talks; a masterclass on marketing the Dharma; and a closing ceremony with the first Buddhist Influencer of the Year awards.",
    href: "/convention/2026",
    cta: "Read the report",
    image: {
      src: conventionHero,
      alt: "Over a hundred creators seated together on the grounds of the Mahabodhi Temple in Bodh Gaya, the temple's spire rising behind them.",
    },
    stats: [
      { value: "110", label: "Creators" },
      { value: "10", label: "Countries" },
    ],
  },
  {
    title: "Lhabab Düchen Challenge",
    date: { label: "11 November 2025", start: "2025-11-11" },
    location: "Online, Google Meet",
    gist: "Lhabab Düchen marks the Buddha’s descent from the heavens. We collaborated with creators who explained the story behind the day and shared its message with their audiences.",
    image: {
      src: lhababDuchen,
      alt: "Thangka painting of the Buddha descending a jewelled staircase from the heavens, surrounded by deities and clouds.",
    },
    stats: [
      { value: "7", label: "Creators" },
      { value: "280K+", label: "Views" },
      { value: "20K+", label: "Likes" },
      { value: "1.1K+", label: "Shares" },
    ],
  },
  {
    title: "Bodhicharyavatara Challenge",
    location: "Online",
    gist: "The Bodhicharyavatara (A Guide to the Bodhisattva’s Way of Life) is available on our WeBuddhist app. To help more people discover it, we collaborated with four creators who talked about the text in four different languages, so the teaching could reach people in the language they are most comfortable with.",
    stats: [
      { value: "4", label: "Creators" },
      { value: "4", label: "Languages" },
      { value: "45K+", label: "Views" },
      { value: "4K+", label: "Likes" },
      { value: "650+", label: "Shares" },
    ],
  },
];
