/* Homepage content for the sections between the mission band and the
   convention flyer. Only the copy written for the homepage lives here. The
   events, partner logos and get-involved audiences are read from their own
   pages' data, so the homepage never drifts from them. */

import { CREATOR, GET_INVOLVED_PAGE, PARTNER, SUPPORT } from "@/lib/get-involved";

export const PARTNERS = {
  title: PARTNER.partnersTitle,
  action: { label: "Support the next convention", href: `/get-involved#${PARTNER.id}` },
} as const;

export type Program = {
  /** Keys the icon the component draws beside the title. */
  id: "convention" | "awards" | "campaigns";
  title: string;
  body: string;
  href: string;
  /** Verb-first, and names where the link goes. */
  cta: string;
};

export const PROGRAMS = {
  eyebrow: "What we do",
  title: "Where creators learn, meet and publish",
  description:
    "A global convention, an awards night and campaigns through the year, each one another chance to create alongside the community.",
  items: [
    {
      id: "convention",
      title: "Buddhist Creators Convention",
      body: "Our annual global gathering. In 2026, 110 creators from 10 countries spent nine days together in Bodh Gaya. The next one opens in Nagpur in February 2027.",
      href: "/convention/2026",
      cta: "Read the 2026 report",
    },
    {
      id: "awards",
      title: "Buddhist Influencer of the Year Awards",
      body: "Five awards presented at each convention, from Rising Star to Buddhist Influencer of the Year, recognising the creators whose work reached furthest.",
      href: "/convention/2026#awards",
      cta: "Meet the 2026 winners",
    },
    {
      id: "campaigns",
      title: "Creator campaigns",
      body: "Collaborative campaigns around sacred days such as Saka Dawa and Guru Rinpoche Day. Five so far, with over 1.26 million views between them.",
      href: "/program#past",
      cta: "See past campaigns",
    },
  ] satisfies Program[],
} as const;

export const WHATS_ON = {
  eyebrow: "Program",
  title: "What’s on",
  description: "What creators can join now, and what is coming next.",
  action: { label: "See full program", href: "/program" },
} as const;

/* Three audiences of the Get Involved page, each linking to its section
   there. Read from that page's data so the two never name things differently. */
export const JOIN = {
  eyebrow: "Get involved",
  title: "Find your place in the community",
  description: GET_INVOLVED_PAGE.description,
  audiences: [CREATOR, PARTNER, SUPPORT].map(({ id, eyebrow, title }) => ({
    id,
    eyebrow,
    title,
    href: `/get-involved#${id}`,
  })),
} as const;

/* The suggestion box. The title is the invitation; the description names
   the three things we are asking for. */
export const FEEDBACK = {
  eyebrow: "Suggestion box",
  /* The title's last word is set in brand golden, as the mission's figure is. */
  title: "This convention is",
  highlight: "yours.",
  description:
    "Tell us what you’d like to see. Suggest a topic for the next convention, a place we should gather, or something we’re missing.",
  form: {
    suggestion: {
      label: "Your suggestion",
      placeholder: "A session on filming teachings with a phone, or the next convention in Nepal",
    },
    email: {
      label: "Email",
      optional: "optional",
      placeholder: "name@example.com",
      hint: "Only if you’d like us to follow up.",
    },
    submit: "Send suggestion",
    /* What the visitor is told once it is stored. The button reads
       `button` for a few seconds; the toast carries the rest. */
    sent: {
      button: "Suggestion sent",
      title: "Suggestion sent",
      description: "Thank you for helping shape the convention.",
    },
    /* Nothing but spaces passes the browser's own `required`. */
    empty: "Write your suggestion before sending it.",
    failed: {
      title: "Could not send your suggestion",
      description: "Please try again in a moment.",
    },
  },
} as const;
