"use client";

import { startTransition, useMemo, useOptimistic, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ListViewContext, type ListViewContextValue } from "@/components/admin/applications-head";
import { TableSkeleton } from "@/components/admin/applications-skeleton";
import type { ListFilter } from "@/lib/applications";
import { sameView, viewHref, type ListView } from "@/lib/applications-view";
import { cn } from "@/lib/utils";

export type FilterOption = {
  value: ListFilter;
  label: string;
  count: number;
};

/* The status pills and the table beneath them, and the one place that
   knows which view the reader has asked for. A click on a pill, a column
   heading or the email filter changes only the search params, so the
   router keeps the old table on screen until the new rows arrive and the
   page feels unresponsive. Here the view turns over the moment it is
   pressed: the pill goes active, the heading's arrow or filter updates,
   and the table answers until the navigation lands and `view` catches up.
   A new status gives way to a skeleton sized from the pill's count; a new
   order or email filter keeps the rows and dims them (ListFrame), since
   the same kind of list is coming back. The optimistic value is bound to
   the same transition as the navigation, so an interrupted or failed one
   falls back on its own. */
export function ApplicationsFilter({
  options,
  view,
  pageSize,
  children,
}: {
  options: FilterOption[];
  view: ListView;
  pageSize: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [shown, setShown] = useOptimistic(view);
  const pending = !sameView(shown, view);
  const statusPending = shown.status !== view.status;
  const target = options.find((option) => option.value === shown.status);

  const context = useMemo<ListViewContextValue>(
    () => ({
      view: shown,
      pending,
      go: (next) => {
        if (sameView(next, shown)) return;
        startTransition(() => {
          setShown(next);
          router.push(viewHref(next), { scroll: false });
        });
      },
    }),
    [shown, pending, router, setShown],
  );

  return (
    <ListViewContext value={context}>
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.value === shown.status;
          // A pill keeps the order and the email filter the reader chose.
          const next = { ...shown, status: option.value };
          return (
            <Link
              key={option.value}
              href={viewHref(next)}
              aria-current={isActive ? "page" : undefined}
              onNavigate={(event) => {
                // The active pill stays a plain link: it leads back to page one.
                if (isActive) return;
                event.preventDefault();
                context.go(next);
              }}
              className={cn(
                "inline-flex h-9 select-none items-center gap-1.5 rounded-full border border-transparent bg-card px-3.5 text-sm font-medium text-foreground shadow-ring",
                "transition-[color,background-color] duration-150 ease-hover hover:bg-muted",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                isActive && "bg-brand-cyan text-white shadow-none hover:bg-brand-cyan",
              )}
            >
              {option.label}
              <span className={cn("text-xs", isActive ? "text-white/80" : "text-muted-foreground")}>{option.count}</span>
            </Link>
          );
        })}
      </nav>

      {statusPending ? <TableSkeleton rows={Math.min(target?.count ?? 3, pageSize)} /> : children}
    </ListViewContext>
  );
}
