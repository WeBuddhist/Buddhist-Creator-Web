import type { CreatorCardStatus } from "@/lib/db/schema";

/* How the dashboard's list of creator cards is being looked at: which
   tab, and which part of a name. Both live in the URL, so a view can be
   reloaded and linked, and the server does the narrowing. No server
   imports, so the page and the filter that drives it build the same
   links. */

export type CardsTab = "all" | CreatorCardStatus;

export type CardsView = { status: CardsTab; q: string };

export const CARDS_PATH = "/admin/creator-cards";

/* The page opens on the cards waiting for a review, since that is the work
   to be done there; the other tabs are a click away. */
export const CARDS_TABS: readonly CardsTab[] = ["pending", "approved", "rejected", "all"];

/** How long a name search may be. */
export const CARDS_SEARCH_MAX = 80;

/** The tab a view lands on when none is named: the cards waiting for a
    review, or, with a search, every card. A creator being looked for is
    seldom among the few that are pending. */
export const defaultTab = (q: string): CardsTab => (q ? "all" : "pending");

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** A search as it is kept: one line, trimmed, no longer than the limit. */
export const cleanSearch = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, CARDS_SEARCH_MAX);

/** The view a URL asks for. */
export function cardsView(params: Record<string, string | string[] | undefined>): CardsView {
  const q = cleanSearch(first(params.q));
  const asked = first(params.status);
  return { status: CARDS_TABS.find((tab) => tab === asked) ?? defaultTab(q), q };
}

export const sameCardsView = (a: CardsView, b: CardsView) => a.status === b.status && a.q === b.q;

/** The URL for a view and a page of it. Whatever is the default is left out. */
export function cardsHref(view: CardsView, page = 1) {
  const search = new URLSearchParams();
  if (view.q) search.set("q", view.q);
  if (view.status !== defaultTab(view.q)) search.set("status", view.status);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${CARDS_PATH}?${query}` : CARDS_PATH;
}
