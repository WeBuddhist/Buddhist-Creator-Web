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
   counted places together and in each one. It opens on its first ten, and
   the list brings in the rest, up to a hundred, as it is scrolled. It is
   on the home page and at the top of this one. */
export const CREATORS_LEADERBOARD = {
  eyebrow: "Leaderboard",
  title: "The most followed creators",
  description:
    "The creators with the largest audience, across all their channels and on each one. We read every count from the channel itself: every week, and every three months on Douyin.",
  all: "All channels",
  updated: "Last updated",
  empty: "The leaderboard appears here after our first weekly reading of the counts.",
  change:
    "Changes are since last week's reading: the triangle by a rank is places gained or lost on the board, and the arrow by a count is followers gained or lost.",
  /* The end of the list while there is more of the board to bring in. */
  more: "Load more creators",
  loading: "Loading more creators…",
  failed: "We could not load the rest of the leaderboard. Check your connection and try again.",
  retry: "Try again",
  /* Under the home page's board: the way in for a creator who is not on
     it, and the way on to everybody who is. */
  invite: {
    eyebrow: "For creators",
    title: "Not on the list yet?",
    description:
      "If you share the Dharma on your own channel, create your creator card. Our team reads every card. Once yours is approved you are in the directory, and your channels are counted for the leaderboard.",
    create: "Create your creator card",
    browse: "Browse all Buddhist creators",
  },
  /* The visitor's own place, held at the foot of every board's list
     (BoardViewer below): their rank, or where their card stands on the
     way to one. */
  yours: {
    label: "Your place",
    you: "You",
    outOf: (creators: string) => `of ${creators}`,
    /* No card yet, or nobody signed in. */
    none: {
      title: "Where do you rank?",
      description: "Create your creator card to see your place on the leaderboard.",
      action: "Create your creator card",
    },
    pending: {
      status: "In review",
      description: "Our team is reading your card. Your rank shows here once it is approved.",
      action: "View your card",
    },
    rejected: {
      status: "Not approved",
      description: "Your card was not approved yet. Open it to see what to change, then resubmit it.",
      action: "Open your card",
    },
    claim: {
      status: "Claim in review",
      description: "Our team is checking your claim. Once it is approved, this card and its rank are yours.",
      action: "View your claim",
    },
    /* An approved card with no figure on the board being looked at. */
    approved: {
      status: "Not ranked yet",
      /* With a rank, the way to the creator's own page; without one, to
         the form, where the missing link is added. */
      view: "View your card",
      action: "Edit your card",
      uncounted: "Your followers have not been counted yet. Your rank shows here after our next reading.",
      unlinked: "Add a YouTube, Instagram, TikTok, Facebook or Douyin link to your card to be ranked.",
      uncountedOn: (site: string) =>
        `Your ${site} followers have not been counted yet. Your rank shows here after our next reading.`,
      unlinkedOn: (site: string) => `Your card has no ${site} link. Add one to be ranked on this board.`,
    },
  },
} as const;

/** How many creators a board opens on, how many each further stretch
    brings in, and how many it shows at most. */
export const LEADERBOARD_OPENING = 10;
export const LEADERBOARD_PAGE = 30;
export const LEADERBOARD_SIZE = 100;

/** Where the browser asks for the next stretch of a board:
    `?place=youtube&offset=10`. */
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
  /** The country's ISO code, for its flag; null when it has none we know. */
  countryCode: string | null;
  photoUrl: string | null;
  /** The audience the board ranks on. */
  followers: number;
  /** Since last week's reading; null when there is nothing to compare. */
  gain: number | null;
  /** Places gained on the board since last week's reading, less than
      nothing for places lost; null when there is nothing to compare. */
  climbed: number | null;
  /** On the board for the first time this week. */
  fresh: boolean;
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

/** Where one creator stands on one board, however far down it they are. */
export type Standing = {
  rank: number;
  /** How many creators the board ranks in all, past the hundred it shows. */
  outOf: number;
  row: BoardRow;
};

/* The visitor, as the leaderboard knows them. It is made on the server
   for the person the session names and is sent to nobody else, so it may
   carry a card that is not public yet.

   - "none": nobody is signed in, or the person has no card and no claim
     waiting. `photoUrl` is their sign-in picture, when there is one.
   - "pending", "rejected": their card, which is not on any board.
   - "claim": a card the team made that they have asked for; it is theirs
     only once an admin approves the claim.
   - "approved": their card and its standing on each board it has a figure
     for. `links` are the counted places the card has a link to, so a
     board they are missing from can say whether the link or its count is
     what is wanting. */
export type BoardViewer =
  | { state: "none"; photoUrl: string | null }
  | {
      state: "pending" | "rejected" | "claim";
      displayName: string;
      country: string | null;
      photoUrl: string | null;
    }
  | {
      state: "approved";
      id: string;
      displayName: string;
      country: string | null;
      photoUrl: string | null;
      links: CountedSocial[];
      standings: Partial<Record<LeaderboardPlace, Standing>>;
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
