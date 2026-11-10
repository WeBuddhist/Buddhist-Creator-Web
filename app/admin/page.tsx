import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApplicationsFilter, type FilterOption } from "@/components/admin/applications-filter";
import { BulkSend } from "@/components/admin/bulk-send";
import { EmailStatusLine } from "@/components/admin/email-status";
import { ListFrame, TableHead } from "@/components/admin/applications-head";
import { EmptyRows, FilterSkeleton, TableSkeleton } from "@/components/admin/applications-skeleton";
import { PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { panel } from "@/components/admin/panel";
import { StatusBadge, STATUS_LABEL } from "@/components/admin/status-badge";
import { countByStatus, listApplications, PAGE_SIZE, type ListFilter } from "@/lib/applications";
import { requireRole } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/db/schema";
import { parseView, viewHref } from "@/lib/applications-view";
import { DECISIONS, isDecision, type Decision } from "@/lib/decisions";
import { formatDateTime } from "@/lib/format";
import { owedSummary } from "@/lib/notifications";
import { locationLabel } from "@/lib/registration-2027";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Applications" };

const FILTERS: ListFilter[] = ["all", "submitted", "accepted", "waitlisted", "rejected", "withdrawn", "draft"];

const filterLabel = (filter: ListFilter) => (filter === "all" ? "All" : STATUS_LABEL[filter]);

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
  const view = parseView(params, FILTERS);
  const filter = view.status;
  const page = Math.max(1, Number(params.page) || 1);

  // The tab decides who a bulk send reaches: one decision's tab is that
  // email alone, "All" is all three. The other tabs hold nobody to write to.
  const scope: Decision[] | null = filter === "all" ? [...DECISIONS] : isDecision(filter) ? [filter] : null;
  const [list, counts, emails] = await Promise.all([
    listApplications(view, page),
    // Under an email filter the pills count what their tab would show.
    countByStatus(view.email),
    scope ? owedSummary(scope) : null,
  ]);
  const totalExceptDrafts = Object.entries(counts)
    .filter(([status]) => status !== "draft")
    .reduce((sum, [, n]) => sum + (n ?? 0), 0);
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize));
  // A page past the end (a stale link, or a decision that emptied the last
  // page) lands on the last real page rather than an empty table.
  if (page > pages) redirect(viewHref(view, pages));

  const options: FilterOption[] = FILTERS.map((value) => ({
    value,
    label: filterLabel(value),
    count: value === "all" ? totalExceptDrafts : (counts[value as ApplicationStatus] ?? 0),
  }));

  return (
    <ApplicationsFilter options={options} view={view} pageSize={PAGE_SIZE}>
      {scope && emails && <BulkSend key={filter} scope={scope} summary={emails} />}
      <ListFrame className={cn(panel, "overflow-x-auto")}>
        {list.rows.length === 0 ? (
          <EmptyRows clearHref={view.email ? viewHref({ ...view, email: null }) : undefined} />
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
                  <td className="px-4 py-3 text-muted-foreground">{locationLabel(row.state, row.country)}</td>
                  <td className="px-4 py-3">
                    <EmailStatusLine
                      status={row.status}
                      notifiedStatus={row.notifiedStatus}
                      notifiedAt={row.notifiedAt}
                      inFlight={row.inFlight}
                    />
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
      </ListFrame>

      <Pagination
        page={page}
        pages={pages}
        total={list.total}
        pageSize={list.pageSize}
        href={(n) => viewHref(view, n)}
        className="mt-4"
      />
    </ApplicationsFilter>
  );
}
