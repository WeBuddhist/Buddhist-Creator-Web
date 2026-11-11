/* Content for the Buddhist Creators Convention 2027 page. The flyer at the
   top of the page is the one on the homepage; what follows it is the
   announcement copy below, in the order the page shows it. */

/* The theme is two sentences, and the page sets each on its own line. */
const THEME_LINES = ["Walk the path.", "Share your journey."] as const;

export const CONVENTION_2027 = {
  year: 2027,
  title: "Buddhist Creators Convention 2027",
  shortTitle: "BCC 2027",
  theme: THEME_LINES.join(" "),
  location: "Nagaloka, Nagpur, India",
  dates: { label: "18 – 21 February 2027", start: "2027-02-18", end: "2027-02-21" },
  /** The line in the flyer's status pill. */
  status: "Registration open",
} as const;

/* Who runs the convention and who supports it. The registration panel
   lists each under its own label. */
export const ORGANISER = { name: "WeBuddhist", href: "https://webuddhist.com/" } as const;
export const SUPPORTER = {
  name: "Nagarjuna Training Institute, Nagaloka",
  href: "https://www.nagarjunatraininginstitute.org/",
} as const;

export const WELCOME = {
  eyebrow: "The 2027 theme",
  /** One line per sentence, so the break falls at the full stop. */
  title: THEME_LINES,
  /** Set larger than the paragraphs after it. */
  lede: "The Buddha walked from village to village, sharing the Dharma in words people could understand. Today that path runs through screens and stories, and we’d love for you to walk it with us!",
  paragraphs: [
    "For our second convention, Buddhist creators from around the world are gathering at Nagaloka, under the gentle gaze of its great Walking Buddha. Monastics and lay followers, Theravada, Mahayana and Vajrayana, big voices and brand-new ones: everyone is welcome.",
    "Come share your practice journey: the joys, the struggles, and what keeps you going. That’s how we become kalyanamitras, good friends on the path for one another.",
  ],
} as const;

export type ProgrammeItem = {
  /** Keys the icon the page draws beside the title. */
  id: "journeys" | "dharma" | "tools" | "create" | "sangha";
  title: string;
  body: string;
};

export const IN_STORE = {
  title: "What We’ll Do Together",
  items: [
    {
      id: "journeys",
      title: "Creator Journeys",
      body: "Inspiring creators share the real stories behind their practice and their work.",
    },
    {
      id: "dharma",
      title: "Dharma Made Simple",
      body: "Fun, hands-on workshops on sharing your journey clearly in any language.",
    },
    {
      id: "create",
      title: "Create Together",
      body: "Team up across countries and traditions to make content for people new to the Dharma.",
    },
    {
      id: "tools",
      title: "Creating with AI",
      body: "Practical sessions on using AI tools to brainstorm, edit, translate and share your content, while keeping your own voice at the heart of it.",
    },
    {
      id: "sangha",
      title: "Sangha Without Borders",
      body: "Good food, great conversations, friends for life.",
    },
  ] satisfies ProgrammeItem[],
} as const;

export const BRING_HOME = {
  eyebrow: "For organizations and communities",
  title: "Bring the convention home!",
  description:
    "The convention is meant to travel. Buddhist organizations and communities everywhere are invited to join us as partners, and maybe host the next one!",
  /** Goes to the partner section of the Get Involved page; the page builds
      the address from that section's id. */
  actionLabel: "Become a partner",
} as const;

export const CLOSING = {
  /** The second sentence takes the golden highlight. */
  title: ["Come as a creator.", "Leave as a kalyanamitra."],
  body: "Registration is open. It takes just 10 minutes.",
} as const;

export const REGISTRATION = {
  title: "Registration is open",
  /** Flip to false to take the form offline: the register button is then
      shown disabled. Keep `status` above in step with this. */
  open: true,
  /** The registration form. Signing in is required, see proxy.ts. */
  href: "/convention/2027/register",
  label: "Apply now",
  note: "Applying takes about 10 minutes and needs a short intro video. You can save a draft and come back. Sign in with Google or Apple first so we can reach you.",
  previous: { label: "Read the 2026 report", href: "/convention/2026" },
} as const;
