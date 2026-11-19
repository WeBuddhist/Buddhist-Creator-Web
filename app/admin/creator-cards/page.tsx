import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import { CardsFilterSkeleton, CardsTableSkeleton } from "@/components/admin/card-skeleton";
import { CardStatusBadge, CARD_STATUS_LABEL } from "@/components/admin/card-status-badge";
import { CardsFilter, type CardsTabOption } from "@/components/admin/cards-filter";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/pagination";
import { panel } from "@/components/admin/panel";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth";
import { creatorTypeLabel } from "@/lib/creator-card";
import {
  CARD_STATUSES,
  countCardsByStatus,
  countClaimsByStatus,
  listCards,
  listUnreadLinks,
} from "@/lib/creator-cards";
import { CARDS_PATH as PATH, CARDS_TABS, cardsHref, cardsView, type CardsTab } from "@/lib/creator-cards-view";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Creator cards" };

const tabLabel = (tab: CardsTab) => (tab === "all" ? "All" : tab === "pending" ? "Pending" : CARD_STATUS_LABEL[tab]);

export default function CreatorCardsPage(props: PageProps<"/admin/creator-cards">) {
  return (
    <>
      <PageHeader
        title="Creator cards"
        description="Cards creators have sent in, and the ones our team made for creators it knows, newest first. Open one to read it and approve or reject it, or to change a card our team keeps. A card a creator changes comes back here as pending."
        actions={
          <Button variant="emphasis" size="lg" className="px-3" nativeButton={false} render={<Link href={`${PATH}/new`} />}>
            <PlusIcon data-icon="inline-start" weight="bold" aria-hidden />
            Add a creator
          </Button>
        }
        className="mb-6"
      />
      {/* The page's first load: the search, the tabs and the table as
          shapes. After that a search or a tab swaps only the table
          (CardsFilter). */}
      <Suspense
        fallback={
          <>
            <CardsFilterSkeleton labels={CARDS_TABS.map(tabLabel)} />
            <CardsTableSkeleton rows={4} />
          </>
        }
      >
        <CardsList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

const EMPTY: Record<CardsTab, string> = {
  pending: "No cards are waiting for a review.",
  approved: "No cards have been approved yet.",
  rejected: "No cards have been rejected.",
  all: "No creator cards yet. They appear here as soon as a creator sends one.",
};

async function CardsList({ searchParams }: { searchParams: PageProps<"/admin/creator-cards">["searchParams"] }) {
  await requireRole("admin", PATH);
  const params = await searchParams;
  const view = cardsView(params);
  const { status: filter, q } = view;
  const page = Math.max(1, Number(params.page) || 1);

  const [list, counts, claims, unread] = await Promise.all([
    listCards(filter, page, q),
    countCardsByStatus(),
    countClaimsByStatus(),
    listUnreadLinks(),
  ]);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  // A page past the end (a stale link, or a review that emptied the last
  // page) lands on the last real page rather than an empty table.
  if (page > pages) redirect(cardsHref(view, pages));

  const everything = CARD_STATUSES.reduce((sum, status) => sum + counts[status], 0);
  const options: CardsTabOption[] = CARDS_TABS.map((value) => ({
    value,
    label: tabLabel(value),
    count: value === "all" ? everything : counts[value],
  }));

  return (
    <>
      {/* Claims are decided from their own queue; this says when there is
          something in it. */}
      {claims.pending > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          <Link
            href={`${PATH}/claims`}
            className="font-medium text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
          >
            {claims.pending === 1 ? "1 claim is waiting" : `${claims.pending} claims are waiting`}
          </Link>{" "}
          for a decision.
        </p>
      )}
      {/* The monthly reading of follower counts says here when a link gave
          it nothing, which is most often a link that is wrong. */}
      {unread.length > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          <Link
            href={`${PATH}/followers`}
            className="font-medium text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
          >
            {unread.length === 1 ? "1 link gave no follower count" : `${unread.length} links gave no follower count`}
          </Link>{" "}
          at the last reading.
        </p>
      )}
      <CardsFilter view={view} options={options} matching={list.total} pageSize={list.pageSize}>
      <div className={cn(panel, "overflow-x-auto")}>
        {list.rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            {q ? "No card matches that search. Try part of the name, or another tab." : EMPTY[filter]}
          </p>
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
        href={(n) => cardsHref(view, n)}
        className="mt-4"
      />
      </CardsFilter>
    </>
  );
}
