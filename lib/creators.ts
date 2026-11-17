import { CARD_PATH } from "@/lib/creator-card";

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

export const CREATORS_DIRECTORY = {
  title: "Find a creator",
  /* The invitation to make a creator card (app/(site)/creator-card). */
  card: {
    action: "Create your creator card",
    note: "Share the Dharma on your own channel? Tell us who you are and what you make. Our team reads every card.",
  },
  /* Under a card nobody owns yet. */
  claim: "Is this you? Claim this card",
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
