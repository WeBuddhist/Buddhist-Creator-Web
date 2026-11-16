import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CardStatusBadge, CARD_STATUS_LABEL } from "@/components/admin/card-status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { panel } from "@/components/admin/panel";
import { requireRole } from "@/lib/auth";
import { creatorTypeLabel } from "@/lib/creator-card";
import { CARD_STATUSES, countCardsByStatus, listCards, type CardFilter } from "@/lib/creator-cards";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Creator cards" };

const PATH = "/admin/creator-cards";

/* The page opens on the cards waiting for a review, since that is the work
   to be done here; the other tabs are a click away. */
const FILTERS: CardFilter[] = ["pending", "approved", "rejected", "all"];
const DEFAULT_FILTER: CardFilter = "pending";

const filterLabel = (filter: CardFilter) =>
  filter === "all" ? "All" : filter === "pending" ? "Pending" : CARD_STATUS_LABEL[filter];

function listHref(filter: CardFilter, page = 1) {
  const search = new URLSearchParams();
  if (filter !== DEFAULT_FILTER) search.set("status", filter);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${PATH}?${query}` : PATH;
}

export default function CreatorCardsPage(props: PageProps<"/admin/creator-cards">) {
  return (
    <>
      <PageHeader
        title="Creator cards"
        description="Cards creators have sent in, newest first. Open one to read it and approve or reject it. A card a creator changes comes back here as pending."
        className="mb-6"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading creator cards…</p>}>
        <CardsList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

const EMPTY: Record<CardFilter, string> = {
  pending: "No cards are waiting for a review.",
  approved: "No cards have been approved yet.",
  rejected: "No cards have been rejected.",
  all: "No creator cards yet. They appear here as soon as a creator sends one.",
};

async function CardsList({ searchParams }: { searchParams: PageProps<"/admin/creator-cards">["searchParams"] }) {
  await requireRole("admin", PATH);
  const params = await searchParams;
  const asked = Array.isArray(params.status) ? params.status[0] : params.status;
  const filter = FILTERS.find((value) => value === asked) ?? DEFAULT_FILTER;
  const page = Math.max(1, Number(params.page) || 1);

  const [list, counts] = await Promise.all([listCards(filter, page), countCardsByStatus()]);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  // A page past the end (a stale link, or a review that emptied the last
  // page) lands on the last real page rather than an empty table.
  if (page > pages) redirect(listHref(filter, pages));

  const everything = CARD_STATUSES.reduce((sum, status) => sum + counts[status], 0);

  return (
    <>
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((value) => {
          const active = value === filter;
          return (
            <Link
              key={value}
              href={listHref(value)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 select-none items-center gap-1.5 rounded-full border border-transparent bg-card px-3.5 text-sm font-medium text-foreground shadow-ring",
                "transition-[color,background-color] duration-150 ease-hover hover:bg-muted",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active && "bg-brand-cyan text-white shadow-none hover:bg-brand-cyan",
              )}
            >
              {filterLabel(value)}
              <span className={cn("text-xs tabular-nums", active ? "text-white/80" : "text-muted-foreground")}>
                {value === "all" ? everything : counts[value]}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className={cn(panel, "overflow-x-auto")}>
        {list.rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">{EMPTY[filter]}</p>
        ) : (
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
                <th scope="col" className="px-4 py-3">Creator</th>
                <th scope="col" className="px-4 py-3">Creates as</th>
                <th scope="col" className="px-4 py-3">Country</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                  <td className="max-w-[22rem] px-4 py-3">
                    <Link
                      href={`${PATH}/${row.id}`}
                      className="font-medium wrap-anywhere text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
                    >
                      {row.displayName}
                    </Link>
                    <div className="text-xs wrap-anywhere text-muted-foreground">{row.email ?? "Not claimed by anyone"}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{creatorTypeLabel(row.creatorType) ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.country ?? "—"}</td>
                  <td className="px-4 py-3">
                    <CardStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                    {row.submittedAt ? formatDateTime(row.submittedAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={list.total}
        pageSize={list.pageSize}
        href={(n) => listHref(filter, n)}
        className="mt-4"
      />
    </>
  );
}
