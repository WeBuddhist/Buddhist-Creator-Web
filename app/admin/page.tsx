import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApplicationsFilter, type FilterOption } from "@/components/admin/applications-filter";
import { EmptyRows, FilterSkeleton, TableHead, TableSkeleton } from "@/components/admin/applications-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { panel } from "@/components/admin/panel";
import { StatTiles, StatTilesSkeleton, type StatTile } from "@/components/admin/stat-tiles";
import { StatusBadge, STATUS_LABEL } from "@/components/admin/status-badge";
import { countByStatus, listApplications, PAGE_SIZE, type ListFilter } from "@/lib/applications";
import { requireRole } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { labelFor, PLATFORMS } from "@/lib/registration-2027";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Applications" };

const FILTERS: ListFilter[] = ["all", "submitted", "accepted", "waitlisted", "rejected", "withdrawn", "draft"];

const filterLabel = (filter: ListFilter) => (filter === "all" ? "All" : STATUS_LABEL[filter]);

/* The figures at the top: the states a reviewer acts on or has decided.
   Each dot is the status badge's solid, so tile and badge match. */
const TILES: { status: ApplicationStatus; label: string; dot: string }[] = [
  { status: "submitted", label: "Awaiting review", dot: "bg-status-submitted-solid" },
  { status: "accepted", label: "Accepted", dot: "bg-status-accepted-solid" },
  { status: "waitlisted", label: "Waitlisted", dot: "bg-status-waitlisted-solid" },
  { status: "rejected", label: "Rejected", dot: "bg-status-rejected-solid" },
];

function pageHref(filter: ListFilter, page: number) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Everyone who has applied to Convention 2027, newest first. Open one to watch the intro video, read the answers and record a decision."
        className="mb-6"
      />
      <Suspense
        fallback={
          <>
            <StatTilesSkeleton labels={TILES.map((tile) => tile.label)} className="mb-6" />
            <FilterSkeleton labels={FILTERS.map(filterLabel)} />
            <TableSkeleton rows={4} />
          </>
        }
      >
        <ApplicationsList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function ApplicationsList({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await requireRole("admin", "/admin");
  const params = await searchParams;
  const requested = typeof params.status === "string" ? params.status : "all";
  const filter = (FILTERS as string[]).includes(requested) ? (requested as ListFilter) : "all";
  const page = Math.max(1, Number(params.page) || 1);

  const [list, counts] = await Promise.all([listApplications(filter, page), countByStatus()]);
  const totalExceptDrafts = Object.entries(counts)
    .filter(([status]) => status !== "draft")
    .reduce((sum, [, n]) => sum + (n ?? 0), 0);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  // A page past the end (a stale link, or a decision that emptied the last
  // page) lands on the last real page rather than an empty table.
  if (page > pages) redirect(pageHref(filter, pages));

  const tiles: StatTile[] = TILES.map((tile) => ({
    label: tile.label,
    count: counts[tile.status] ?? 0,
    href: pageHref(tile.status, 1),
    dot: tile.dot,
    active: filter === tile.status,
  }));

  const options: FilterOption[] = FILTERS.map((value) => ({
    value,
    label: filterLabel(value),
    count: value === "all" ? totalExceptDrafts : (counts[value as ApplicationStatus] ?? 0),
    href: pageHref(value, 1),
  }));

  return (
    <>
      <StatTiles tiles={tiles} className="mb-6" />
      <ApplicationsFilter options={options} active={filter} pageSize={PAGE_SIZE}>
        <div className={cn(panel, "overflow-x-auto")}>
          {list.rows.length === 0 ? (
            <EmptyRows />
          ) : (
            <table className="w-full min-w-[48rem] text-sm">
              <TableHead />
              <tbody>
                {list.rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/applications/${row.id}`}
                        className="font-medium text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
                      >
                        {row.fullName || row.userName || row.email}
                      </Link>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.organization}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.location}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {(row.platforms ?? []).map((p) => labelFor(PLATFORMS, p)).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
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
          href={(n) => pageHref(filter, n)}
          className="mt-4"
        />
      </ApplicationsFilter>
    </>
  );
}
