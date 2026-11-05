/* Content for the Convention Ambassador Programme page. The 2026 cohort is
   not listed yet; add names to AMBASSADORS_2026 when they are confirmed. */

export const AMBASSADORS_PAGE = {
  eyebrow: "Convention",
  title: "Ambassador Programme",
  description:
    "Ambassadors are selected from each convention’s participants and carry the title of Convention Ambassador until the next convention.",
} as const;

export const HOW_IT_WORKS = {
  eyebrow: "How it works",
  title: "From participant to ambassador",
  description:
    "Every convention produces a new cohort. The title passes on when the next gathering opens.",
  steps: [
    {
      title: "Take part in a convention",
      body: "Ambassadors come only from the people in the room. Attending a Buddhist Creators Convention is the first and only requirement.",
    },
    {
      title: "Be selected by the organisers",
      body: "During the convention, the organising team selects a small group of participants whose work and conduct over the nine days stood out.",
    },
    {
      title: "Serve until the next convention",
      body: "Ambassadors hold the title for one cycle. When the next convention opens, a new cohort is selected and the previous one becomes alumni.",
    },
  ],
} as const;

export const ROLE = {
  title: "What ambassadors do",
  items: [
    {
      title: "Represent the community",
      body: "Speak for Buddhist Creators at gatherings, in interviews and on their own channels, with the title of Convention Ambassador.",
    },
    {
      title: "Welcome new creators",
      body: "Be a first point of contact for creators who want to join the community, and help them find the programs that fit.",
    },
    {
      title: "Carry the convention forward",
      body: "Share what the convention produced, from the report and the documentary to the connections made, with audiences who were not there.",
    },
    {
      title: "Shape the next one",
      body: "Join the planning conversations for the following convention and bring the perspective of someone who sat in the audience.",
    },
  ],
} as const;

export const SUPPORT = {
  title: "What ambassadors receive",
  items: [
    "A seat at the next convention.",
    "Early word on programs, masterclasses and awards.",
    "A named place on this page and in the convention report.",
    "Direct contact with the organising team through the year.",
  ],
} as const;

export type Ambassador = {
  name: string;
  location: string;
  /** Path under /public. Omitted entries show the placeholder portrait. */
  image?: { src: string; alt: string; width: number; height: number };
};

export const COHORT_2026 = {
  title: "Ambassadors 2026",
  description: "Selected at the Buddhist Creators Convention 2026 in Bodh Gaya.",
  empty: "The 2026 ambassadors will be listed here once the cohort is confirmed.",
} as const;

export const AMBASSADORS_2026: Ambassador[] = [];
