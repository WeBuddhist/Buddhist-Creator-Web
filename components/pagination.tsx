import Link from "next/link";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const pill = cn(
  "inline-flex h-9 min-w-9 select-none items-center justify-center rounded-full px-3 text-sm font-medium tabular-nums",
  "text-muted-foreground transition-[color,background-color] duration-150 ease-hover hover:bg-muted hover:text-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

/* Which page numbers to show. Up to seven pages are all listed; past that
   the first, the last and the current page with one neighbour either side,
   with a gap where numbers are skipped. The window near either edge widens
   so the row always holds seven slots and nothing shifts between pages. */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "gap", total];
  if (current >= total - 3) return [1, "gap", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "gap", current - 1, current, current + 1, "gap", total];
}

/* Page links for a long list. Renders nothing for a single page. Previous
   and Next stay in place when there is nowhere to go, disabled rather than
   removed, so the row keeps its shape as the reader pages through.

   The seven numbered slots and the two arrows need 22.25rem. A phone
   narrower than 26rem does not have that beside the page's gutters, so
   there the numbers give way to "Page 4 of 8" between the arrows. */
export function Pagination({
  page,
  pages,
  total,
  pageSize,
  href,
  className,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  /** Builds the URL for a page number, keeping the current filter. */
  href: (page: number) => string;
  className?: string;
}) {
  if (pages <= 1) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const arrow = (target: number, label: string, Icon: typeof CaretLeftIcon) =>
    target < 1 || target > pages ? (
      <span aria-disabled="true" className={cn(pill, "w-9 px-0 text-muted-foreground/40 hover:bg-transparent hover:text-muted-foreground/40")}>
        <Icon aria-label={label} weight="bold" className="size-4" />
      </span>
    ) : (
      <Link href={href(target)} aria-label={label} className={cn(pill, "w-9 px-0")}>
        <Icon weight="bold" className="size-4" />
      </Link>
    );

  return (
    <nav aria-label="Pages" className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-3", className)}>
      <p className="text-sm text-muted-foreground tabular-nums">
        Showing {first}–{last} of {total}
      </p>
      <div className="flex items-center gap-1">
        {arrow(page - 1, "Previous page", CaretLeftIcon)}
        <span className="px-2 text-sm font-medium text-foreground tabular-nums min-[26rem]:hidden">
          Page {page} of {pages}
        </span>
        <div className="hidden items-center gap-1 min-[26rem]:flex">
          {pageWindow(page, pages).map((item, i) =>
            item === "gap" ? (
              <span key={`gap-${i}`} aria-hidden="true" className="inline-flex w-9 justify-center text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                key={item}
                href={href(item)}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Page ${item}`}
                className={cn(pill, item === page && "bg-muted text-foreground")}
              >
                {item}
              </Link>
            ),
          )}
        </div>
        {arrow(page + 1, "Next page", CaretRightIcon)}
      </div>
    </nav>
  );
}
