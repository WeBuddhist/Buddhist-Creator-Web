import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { VideoCameraIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge, STATUS_LABEL } from "@/components/admin/status-badge";
import { card, cardInner } from "@/components/convention/section-heading";
import { countByStatus, listApplications, type ListFilter } from "@/lib/applications";
import { requireRole } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { labelFor, PLATFORMS } from "@/lib/registration-2027";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Applications" };

const FILTERS: ListFilter[] = ["all", "submitted", "accepted", "waitlisted", "rejected", "withdrawn", "draft"];

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading applications…</p>}>
      <ApplicationsList searchParams={props.searchParams} />
    </Suspense>
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

  return (
    <>
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((value) => {
          const count = value === "all" ? totalExceptDrafts : (counts[value as ApplicationStatus] ?? 0);
          const active = value === filter;
          return (
            <Link
              key={value}
              href={value === "all" ? "/admin" : `/admin?status=${value}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 select-none items-center gap-1.5 rounded-full border border-transparent bg-card px-3.5 text-sm font-medium text-foreground shadow-ring",
                "transition-[color,background-color] duration-150 ease-hover hover:bg-muted",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active && "bg-brand-cyan text-white shadow-none hover:bg-brand-cyan",
              )}
            >
              {value === "all" ? "All" : STATUS_LABEL[value as ApplicationStatus]}
              <span className={cn("text-xs", active ? "text-white/80" : "text-muted-foreground")}>{count}</span>
            </Link>
          );
        })}
      </nav>

      <div className={card}>
        <div className={cn(cardInner, "overflow-x-auto")}>
          {list.rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No applications here yet.</p>
          ) : (
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
                  <th scope="col" className="px-4 py-3">Applicant</th>
                  <th scope="col" className="px-4 py-3">Organisation</th>
                  <th scope="col" className="px-4 py-3">Location</th>
                  <th scope="col" className="px-4 py-3">Platforms</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
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
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {row.email}
                        {row.hasVideo && <VideoCameraIcon aria-label="Has video" className="size-3.5" weight="bold" />}
                      </div>
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
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          {page > 1 && (
            <Link href={`/admin?status=${filter}&page=${page - 1}`} className="underline underline-offset-4">
              Previous
            </Link>
          )}
          <span>
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={`/admin?status=${filter}&page=${page + 1}`} className="underline underline-offset-4">
              Next
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
