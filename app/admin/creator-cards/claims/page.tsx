import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CardStatusBadge, CARD_STATUS_LABEL } from "@/components/admin/card-status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { panel } from "@/components/admin/panel";
import { Pagination } from "@/components/pagination";
import { requireRole } from "@/lib/auth";
import { CLAIM_STATUSES, countClaimsByStatus, listClaims, type ClaimFilter } from "@/lib/creator-cards";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Card claims" };

const PATH = "/admin/creator-cards/claims";

/* The page opens on the claims waiting for a decision, since that is the
   work to be done here; the other tabs are a click away. */
const FILTERS: ClaimFilter[] = ["pending", "approved", "rejected", "all"];
const DEFAULT_FILTER: ClaimFilter = "pending";

const filterLabel = (filter: ClaimFilter) =>
  filter === "all" ? "All" : filter === "pending" ? "Waiting" : CARD_STATUS_LABEL[filter];

function listHref(filter: ClaimFilter, page = 1) {
  const search = new URLSearchParams();
  if (filter !== DEFAULT_FILTER) search.set("status", filter);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${PATH}?${query}` : PATH;
}

/* The claims queue: people who say a card our team made is theirs. A
   claim is decided on the card's own page, where the card, its links and
   every claim on it sit together, so each row here leads there. */
export default function CardClaimsPage(props: PageProps<"/admin/creator-cards/claims">) {
  return (
    <>
      <PageHeader
        title="Card claims"
        description="People asking for a card our team made, newest first. Open one to check the code on the creator's channel, then approve or reject it. A card only gets an owner when a claim is approved."
        className="mb-6"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading claims…</p>}>
        <ClaimsList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

const EMPTY: Record<ClaimFilter, string> = {
  pending: "No claims are waiting for a decision.",
  approved: "No claims have been approved yet.",
  rejected: "No claims have been rejected.",
  all: "Nobody has claimed a card yet.",
};

async function ClaimsList({ searchParams }: { searchParams: PageProps<"/admin/creator-cards/claims">["searchParams"] }) {
  await requireRole("admin", PATH);
  const params = await searchParams;
  const asked = Array.isArray(params.status) ? params.status[0] : params.status;
  const filter = FILTERS.find((value) => value === asked) ?? DEFAULT_FILTER;
  const page = Math.max(1, Number(params.page) || 1);

  const [list, counts] = await Promise.all([listClaims(filter, page), countClaimsByStatus()]);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  if (page > pages) redirect(listHref(filter, pages));

  const everything = CLAIM_STATUSES.reduce((sum, status) => sum + counts[status], 0);

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
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
                <th scope="col" className="px-4 py-3">Card</th>
                <th scope="col" className="px-4 py-3">Claimed by</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Sent</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                  <td className="max-w-[20rem] px-4 py-3">
                    <Link
                      href={`/admin/creator-cards/${row.cardId}`}
                      className="font-medium wrap-anywhere text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
                    >
                      {row.cardName}
                    </Link>
                  </td>
                  <td className="max-w-[20rem] px-4 py-3">
                    <div className="wrap-anywhere text-foreground">{row.claimantName ?? row.claimantEmail}</div>
                    {row.claimantName && (
                      <div className="text-xs wrap-anywhere text-muted-foreground">{row.claimantEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CardStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatDateTime(row.createdAt)}
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
