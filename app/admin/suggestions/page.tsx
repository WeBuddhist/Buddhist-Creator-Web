import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { panel } from "@/components/admin/panel";
import { RemoveSuggestion } from "@/components/admin/remove-suggestion";
import { hasRole, requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { listSuggestions } from "@/lib/suggestions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Suggestions" };

const PATH = "/admin/suggestions";
const pageHref = (page: number) => (page <= 1 ? PATH : `${PATH}?page=${page}`);

export default function SuggestionsPage(props: PageProps<"/admin/suggestions">) {
  return (
    <>
      <PageHeader
        title="Suggestions"
        description="What visitors have left in the suggestion box on the homepage, newest first. An email is there only when they asked to be written back to. Superadmins can remove one."
        className="mb-6"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading suggestions…</p>}>
        <SuggestionsList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

/* The address is whatever was typed into a public form. It becomes a link
   only when it has the shape of one, and is escaped on the way into the
   mailto so it cannot carry a subject or a body of its own. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mailto = (email: string) => `mailto:${encodeURIComponent(email).replace("%40", "@")}`;

/* The columns from the small breakpoint up: the suggestion takes the room,
   the email and the date keep theirs, and a superadmin gets a last one for
   the bin. Below it each suggestion stacks, words first, so nothing is
   read by scrolling sideways; the bin sits beside the words. */
const columns = "grid grid-cols-[minmax(0,1fr)] gap-x-3 sm:grid-cols-[minmax(0,1fr)_14rem_9.5rem] sm:gap-x-6";
const columnsWithBin = "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 sm:grid-cols-[minmax(0,1fr)_14rem_9.5rem_2.25rem] sm:gap-x-6";
/* On a phone the three lines keep to the first column, beside the bin. */
const line = "col-start-1 sm:col-auto";

/* Where focus goes when a removed suggestion takes its bin with it. */
const LIST_ID = "suggestions-list";

/* Admins and superadmins read; superadmins can also remove, and the
   action checks that again. A list rather than a table: a suggestion is a
   paragraph or several, and a table's columns would leave a phone a few
   words per line. */
async function SuggestionsList({ searchParams }: { searchParams: PageProps<"/admin/suggestions">["searchParams"] }) {
  const user = await requireRole("admin", PATH);
  const canRemove = hasRole(user, "superadmin");
  const grid = canRemove ? columnsWithBin : columns;
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const list = await listSuggestions(page);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  // A page past the end (a stale link) lands on the last real page.
  if (page > pages) redirect(pageHref(pages));

  if (list.total === 0) {
    return (
      <section id={LIST_ID} aria-label="Suggestions list" tabIndex={-1} className={cn(panel, "outline-none")}>
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No suggestions yet. They appear here as soon as someone sends one from the homepage.
        </p>
      </section>
    );
  }

  return (
    <section id={LIST_ID} aria-label="Suggestions list" tabIndex={-1} className="outline-none">
      <p className="mb-3 text-sm text-muted-foreground tabular-nums">
        {list.total} {list.total === 1 ? "suggestion" : "suggestions"}
      </p>
      <div className={panel}>
        {/* Column labels for the eye; each row below names its own parts. */}
        <div
          aria-hidden="true"
          className={cn(
            grid,
            "max-sm:hidden rounded-t-[inherit] border-b border-border bg-muted/60 px-4 py-3 text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground",
          )}
        >
          <span>Suggestion</span>
          <span>Email</span>
          <span>Received</span>
          {canRemove && <span />}
        </div>
        <ul>
          {list.rows.map((row) => (
            <li key={row.id} className={cn(grid, "border-b border-border px-4 py-3.5 text-sm last:border-b-0")}>
              {/* Line breaks are kept as written; a long link or an unbroken
                  run of characters wraps rather than widening the page. */}
              <p className={cn(line, "max-w-[72ch] whitespace-pre-line wrap-anywhere leading-[1.6] text-foreground")}>{row.body}</p>
              <p className={cn(line, "mt-2 min-w-0 wrap-anywhere text-muted-foreground sm:mt-0")}>
                <span className="sr-only">Email: </span>
                {!row.email ? (
                  <>
                    <span aria-hidden="true" className="max-sm:hidden">—</span>
                    <span className="sm:sr-only">No email left</span>
                  </>
                ) : EMAIL_SHAPE.test(row.email) ? (
                  <a
                    href={mailto(row.email)}
                    className="rounded-sm text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {row.email}
                  </a>
                ) : (
                  row.email
                )}
              </p>
              <p className={cn(line, "mt-0.5 text-muted-foreground tabular-nums sm:mt-0")}>
                <span className="sr-only">Received </span>
                <time dateTime={row.createdAt.toISOString()}>{formatDateTime(row.createdAt)}</time>
              </p>
              {canRemove && (
                // Pulled into the row's padding, so a one-line suggestion
                // keeps the height it has for an admin.
                <div className="col-start-2 row-start-1 -my-1.5 -me-1.5 self-start justify-self-end sm:col-auto sm:row-auto">
                  <RemoveSuggestion
                    suggestionId={row.id}
                    body={row.body}
                    hasEmail={!!row.email}
                    received={formatDateTime(row.createdAt)}
                    listId={LIST_ID}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={list.total}
        pageSize={list.pageSize}
        href={pageHref}
        className="mt-4"
      />
    </section>
  );
}
