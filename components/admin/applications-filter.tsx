"use client";

import { startTransition, useOptimistic, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/admin/applications-skeleton";
import type { ListFilter } from "@/lib/applications";
import { cn } from "@/lib/utils";

export type FilterOption = {
  value: ListFilter;
  label: string;
  count: number;
  href: string;
};

/* The status pills and the table beneath them. A click changes only the
   search params, so the router keeps the old table on screen until the new
   rows arrive and the page feels unresponsive. Here the clicked pill turns
   active the moment it is pressed and the table gives way to a skeleton,
   sized from the pill's count, until the navigation lands and `active`
   catches up. The optimistic value is bound to the same transition as the
   navigation, so an interrupted or failed one falls back on its own. */
export function ApplicationsFilter({
  options,
  active,
  pageSize,
  children,
}: {
  options: FilterOption[];
  active: ListFilter;
  pageSize: number;
  children: ReactNode;
}) {
  const router = useRouter();
  const [shown, setShown] = useOptimistic(active);
  const pending = shown !== active;
  const target = options.find((option) => option.value === shown);

  return (
    <>
      <nav aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.value === shown;
          return (
            <Link
              key={option.value}
              href={option.href}
              aria-current={isActive ? "page" : undefined}
              onNavigate={(event) => {
                if (option.value === shown) return;
                event.preventDefault();
                startTransition(() => {
                  setShown(option.value);
                  router.push(option.href);
                });
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

      {pending ? <TableSkeleton rows={Math.min(target?.count ?? 3, pageSize)} /> : children}
    </>
  );
}
