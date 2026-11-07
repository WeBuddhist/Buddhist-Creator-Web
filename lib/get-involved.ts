/* Content for the Get Involved page, carried over from the previous
   buddhistcreators.com page with two additions: sponsoring a scholarship
   and volunteering as a trainer. */

import type { StaticImageData } from "next/image";
import bodhisattvaChallenge from "@/public/events/bodhisattva-challenge.webp";
import dailyTipitaka from "@/public/events/daily-tipitaka.webp";
import collaboratorShechenWide from "@/public/collaborator/collaborator-shechen-wide.webp";
import collaboratorKhyentseFoundationTrimmed from "@/public/collaborator/collaborator-khyentse-foundation-trimmed.webp";
import collaboratorIndrajalaWide from "@/public/collaborator/collaborator-indrajala-wide.webp";
import collaboratorOpenpecha from "@/public/collaborator/collaborator-openpecha.webp";
import collaboratorSherab from "@/public/collaborator/collaborator-sherab.webp";
import collaboratorDharmaduta from "@/public/collaborator/collaborator-dharmaduta.webp";
import collaboratorTibetanNunsProject from "@/public/collaborator/collaborator-tibetan-nuns-project.webp";
import collaboratorBuddhaEducationalFoundation from "@/public/collaborator/collaborator-buddha-educational-foundation.webp";

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
  /** Where the card goes. Both challenges run on WeBuddhist. */
  href: string;
  /** Static import, which carries its size and blur. Omitted entries show the placeholder. */
  image?: { src: StaticImageData; alt: string };
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
      href: "https://webuddhist.com/plans",
      image: {
        src: bodhisattvaChallenge,
        alt: "Illustration of a figure with hands joined in prayer, filled with golden lotus flowers, before sunlit dunes",
      },
    },
    {
      title: "Daily Tipitaka",
      body: "A daily reading of the Pali canon, one passage at a time, shared with monastics and lay practitioners around the world.",
      href: "https://webuddhist.com/plans",
      image: {
        src: dailyTipitaka,
        alt: "Illustration of monks and lay practitioners seated in a row reading scriptures beneath a Dharma wheel",
      },
    },
  ] as Challenge[],
  programs: {
    title: "Looking for the next convention or masterclass?",
    body: "The annual convention, the WeBuddhist Influencer Masterclass and the Buddhist Influencer of the Year awards are where creators go deeper together.",
    actions: [
      { label: "See full program", href: "/program" },
      { label: "Explore the 2026 convention", href: "/convention/2026" },
    ],
  },
} as const;

export const PARTNER = {
  id: "partner",
  eyebrow: "As an institution or group",
  title: "Support to the next convention",
  description:
    "Monasteries, foundations and organisations already power our two flagship initiatives. Join them in bringing the Dharma to the digital age.",
  /** A way with an href renders as a link card to that page. */
  ways: [
    {
      title: "Buddhist Creators Convention",
      body: "Join us at our next convention, 18 to 21 February 2027, at Nagaloka, Nagpur.",
      href: "/convention/2027",
    },
    {
      title: "WeBuddhist Influencer Masterclass",
      body: "An intensive, practice-led training that runs at partner institutes through the year. Host the next one at your centre.",
    },
  ],
  partnersTitle: "Past organisations that supported the convention",
  partners: [
    { name: "Shechen Monastery", logo: collaboratorShechenWide, href: null },
    { name: "Khyentse Foundation", logo: collaboratorKhyentseFoundationTrimmed, href: null },
    { name: "Indrajala", logo: collaboratorIndrajalaWide, href: null },
    { name: "OpenPecha Trust", logo: collaboratorOpenpecha, href: "https://openpecha.org/" },
    { name: "Sherab", logo: collaboratorSherab, href: "https://www.sherab.org" },
    { name: "Dharmaduta", logo: collaboratorDharmaduta, href: "https://dharmaduta.in/" },
    { name: "Tibetan Nuns Project", logo: collaboratorTibetanNunsProject, href: "https://tnp.org/" },
    { name: "The Corporate Body of the Buddha Educational Foundation", logo: collaboratorBuddhaEducationalFoundation, href: "https://www.budaedu.org/" },
  ],
  action: { label: "Support the next convention", href: mailto("Partnership Inquiry") },
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
