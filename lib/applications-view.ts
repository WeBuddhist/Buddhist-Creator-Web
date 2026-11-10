import type { ListFilter } from "@/lib/applications";

/* How the applications table is being looked at: which status tab, which
   column it is ordered by, and which email state it is narrowed to. All of
   it lives in the URL, so a view can be bookmarked, reloaded and paged
   through, and the server does the work: the list is paginated, so only
   the database can sort or filter the whole of it. No server imports, so
   the table's client components can build the same links the page does. */

export const SORTS = ["submitted", "organisation", "location"] as const;
export type ListSort = (typeof SORTS)[number];
export type SortDir = "asc" | "desc";

/** The direction a column starts in: newest first, and A to Z. */
export const DEFAULT_DIR: Record<ListSort, SortDir> = { submitted: "desc", organisation: "asc", location: "asc" };

/* The Email column's states, as the cell shows them. "none" is the dash:
   no decision to send. */
export const EMAIL_FILTERS = ["sent", "not-sent", "review", "none"] as const;
export type EmailFilter = (typeof EMAIL_FILTERS)[number];

export const EMAIL_FILTER_LABEL: Record<EmailFilter, string> = {
  sent: "Sent",
  "not-sent": "Not sent",
  review: "Needs review",
  none: "No decision yet",
};

export type ListView = {
  status: ListFilter;
  sort: ListSort;
  dir: SortDir;
  email: EmailFilter | null;
};

export const DEFAULT_VIEW: ListView = { status: "all", sort: "submitted", dir: "desc", email: null };

export function sameView(a: ListView, b: ListView) {
  return a.status === b.status && a.sort === b.sort && a.dir === b.dir && a.email === b.email;
}

/** The view a click on a sortable heading leads to: the other direction
    when that column already leads, its starting direction otherwise. */
export function sortedBy(view: ListView, sort: ListSort): ListView {
  const dir = view.sort === sort ? (view.dir === "asc" ? "desc" : "asc") : DEFAULT_DIR[sort];
  return { ...view, sort, dir };
}

/** The URL for a view. Whatever matches the default is left out, so the
    plain list stays at /admin. */
export function viewHref(view: ListView, page = 1) {
  const params = new URLSearchParams();
  if (view.status !== "all") params.set("status", view.status);
  if (view.email) params.set("email", view.email);
  if (view.sort !== DEFAULT_VIEW.sort || view.dir !== DEFAULT_VIEW.dir) {
    params.set("sort", view.sort);
    if (view.dir !== DEFAULT_DIR[view.sort]) params.set("dir", view.dir);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

/** Reads a view back out of the search params; anything unrecognised
    falls back to the default rather than failing the page. */
export function parseView(params: Record<string, string | string[] | undefined>, statuses: readonly ListFilter[]): ListView {
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const status = statuses.find((value) => value === one("status")) ?? "all";
  const sort = SORTS.find((value) => value === one("sort")) ?? DEFAULT_VIEW.sort;
  const dirParam = one("dir");
  const dir: SortDir = dirParam === "asc" || dirParam === "desc" ? dirParam : DEFAULT_DIR[sort];
  const email = EMAIL_FILTERS.find((value) => value === one("email")) ?? null;
  return { status, sort, dir, email };
}
