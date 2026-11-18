import { CARD_PATH, COUNTED_SOCIALS, type CountedSocial } from "@/lib/creator-card";

/* The creators page: its copy, and how the directory is being looked at.
   The search and the country live in the URL, so a view can be shared,
   reloaded and paged through, and the server does the work: the list is
   paginated, so only the database can search all of it. No server
   imports, so the filters build the same links the page does. */

export const CREATORS_PATH = "/creators";

/** The id the directory scrolls back to when a page or a filter changes. */
export const DIRECTORY_ID = "directory";

export const CREATORS_PAGE = {
  eyebrow: "Creators",
  title: "The creators sharing the Dharma",
  description:
    "Monastics, teachers, lay practitioners and organizations who carry the Dharma on their own channels. Find them, follow them, and add your own card.",
} as const;

/* The leaderboard: the creators with the largest audiences, in all their
   counted places together and in each one. It opens on its first ten and
   can be opened to a hundred. It is on the home page and at the top of
   this one. */
export const CREATORS_LEADERBOARD = {
  eyebrow: "Leaderboard",
  title: "The most followed creators",
  description:
    "The creators with the largest audience, across all their channels and on each one. We read every count from the channel itself, once a month.",
  all: "All channels",
  updated: "Last updated",
  empty: "The leaderboard appears here after our first monthly reading of the counts.",
  change: "An arrow shows how far a count has moved since last month's reading.",
  failed: "We could not load the rest of the leaderboard. Check your connection and try again.",
  browse: "Browse all creators",
} as const;

/** How many creators a board shows before it is opened, and at most. */
export const LEADERBOARD_OPENING = 10;
export const LEADERBOARD_SIZE = 100;

/** Where the browser asks for a whole board: `?place=youtube`. */
export const LEADERBOARD_API = "/api/creators/leaderboard";

/** A board: every counted place together, or one of them. */
export type LeaderboardPlace = "all" | CountedSocial;

export const LEADERBOARD_PLACES: readonly LeaderboardPlace[] = ["all", ...COUNTED_SOCIALS.map(({ value }) => value)];

/** One of a creator's channels a figure on the board was read from. */
export type BoardSource = { place: CountedSocial; link: string; followers: number };

/** A creator on a board, as the browser gets it. */
export type BoardRow = {
  id: string;
  displayName: string;
  country: string | null;
  photoUrl: string | null;
  /** The audience the board ranks on. */
  followers: number;
  /** Since last month's reading; null when there is nothing to compare. */
  gain: number | null;
  /** The channels that figure is made of, each with its own. */
  sources: BoardSource[];
};

export type Board = {
  place: LeaderboardPlace;
  /** Its first creators, LEADERBOARD_OPENING at most. */
  rows: BoardRow[];
  /** How many creators the whole board has, LEADERBOARD_SIZE at most. */
  size: number;
};

export const CREATORS_DIRECTORY = {
  title: "Find a creator",
  /* The invitation to make a creator card (app/(site)/creator-card). */
  card: {
    action: "Create your creator card",
    note: "Share the Dharma on your own channel? Tell us who you are and what you make. Our team reads every card.",
  },
  /* In the corner of a card nobody owns yet: who it is for, then what
     they can do. Two short lines, because the corner is narrow on a
     phone. */
  claim: { ask: "Is this you?", action: "Claim & complete" },
} as const;

export const SEARCH_MAX = 80;

export type CreatorsView = {
  /** Part of a name, as typed. Empty for no search. */
  q: string;
  /** A country's name, or null for all of them. */
  country: string | null;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** The view a URL asks for. */
export function creatorsView(params: Record<string, string | string[] | undefined>): CreatorsView {
  return {
    q: first(params.q).replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX),
    country: first(params.country).trim().slice(0, SEARCH_MAX) || null,
  };
}

export function sameCreatorsView(a: CreatorsView, b: CreatorsView) {
  return a.q === b.q && a.country === b.country;
}

/** The URL for a view and a page of it. Whatever is not narrowed is left
    out, so the whole list stays at /creators. `anchor` lands on the
    directory rather than the top of the page, for a link that changes
    what the directory shows. */
export function creatorsHref(view: CreatorsView, page = 1, anchor = true) {
  const params = new URLSearchParams();
  if (view.q.trim()) params.set("q", view.q.trim());
  if (view.country) params.set("country", view.country);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `${CREATORS_PATH}${query ? `?${query}` : ""}${anchor ? `#${DIRECTORY_ID}` : ""}`;
}

/** Where claiming a card starts: the creator card page, which asks for a
    sign-in first and comes back with the card still named. */
export function claimHref(cardId: string) {
  return `${CARD_PATH}?claim=${cardId}`;
}
