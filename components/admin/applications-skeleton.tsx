import Link from "next/link";
import { TableHead } from "@/components/admin/applications-head";
import { panel } from "@/components/admin/panel";
import { cn } from "@/lib/utils";

/* The table with nothing in it. Under an email filter the heading row
   stays above the message, since that is where the filter is changed, and
   the message offers the way back to the whole list. */
export function EmptyRows({ clearHref }: { clearHref?: string }) {
  if (!clearHref) return <p className="px-5 py-10 text-center text-sm text-muted-foreground">No applications here yet.</p>;
  return (
    <>
      <table className="w-full min-w-[48rem] text-sm">
        <TableHead />
      </table>
      <p className="px-5 py-10 text-center text-sm text-muted-foreground">
        No applications match this email filter.{" "}
        <Link
          href={clearHref}
          className="font-medium text-foreground underline decoration-foreground/20 underline-offset-4 hover:decoration-foreground"
        >
          Show all
        </Link>
      </p>
    </>
  );
}

const bar = "block h-3.5 rounded bg-muted";

/* Placeholder widths per column, cycled so the rows do not line up into a
   grid of identical bars. The applicant cell carries two lines, name and
   email, so a skeleton row keeps the height of a real one. */
const WIDTHS = [
  ["w-32", "w-20", "w-14", "w-20", "w-20", "w-28"],
  ["w-24", "w-24", "w-16", "w-14", "w-20", "w-28"],
  ["w-36", "w-16", "w-12", "w-20", "w-20", "w-28"],
];

/* The applications table with its rows replaced by placeholders. Zero rows
   render the same empty state the real table shows, so a filter known to be
   empty settles the instant it is clicked. */
export function TableSkeleton({ rows, className }: { rows: number; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading applications" className={cn(panel, "overflow-x-auto", className)}>
      <>
        {rows <= 0 ? (
          <EmptyRows />
        ) : (
          <table className="w-full min-w-[48rem] text-sm">
            <TableHead />
            <tbody className="animate-pulse">
              {Array.from({ length: rows }, (_, i) => {
                const w = WIDTHS[i % WIDTHS.length];
                return (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <span className={cn(bar, w[0], "my-[3px]")} />
                      <span className={cn(bar, "mt-1.5 h-3 w-40 opacity-70")} />
                    </td>
                    {w.slice(1, 4).map((width, j) => (
                      <td key={j} className="px-4 py-3">
                        <span className={cn(bar, width)} />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <span className={cn("block h-6 rounded-full bg-muted", w[4])} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(bar, w[5])} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </>
    </div>
  );
}

/* The filter row before the counts are known: the same pills, inert, with
   a blank where each count goes, so the page loads without a jump. */
export function FilterSkeleton({ labels }: { labels: string[] }) {
  return (
    <div aria-hidden="true" className="mb-6 flex flex-wrap gap-2">
      {labels.map((label, i) => (
        <span
          key={label}
          className={cn(
            "inline-flex h-9 select-none items-center gap-1.5 rounded-full border border-transparent px-3.5 text-sm font-medium shadow-ring",
            i === 0 ? "bg-brand-cyan text-white shadow-none" : "bg-card text-foreground",
          )}
        >
          {label}
          <span className={cn("inline-block h-3 w-3 rounded", i === 0 ? "bg-white/30" : "bg-muted")} />
        </span>
      ))}
    </div>
  );
}
