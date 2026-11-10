"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { ArrowDownIcon, ArrowUpIcon, CaretUpDownIcon, CheckIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import {
  EMAIL_FILTERS,
  EMAIL_FILTER_LABEL,
  sortedBy,
  viewHref,
  type EmailFilter,
  type ListSort,
  type ListView,
} from "@/lib/applications-view";
import { cn } from "@/lib/utils";

/* The applications table's heading row. Organisation, Location and
   Submitted are links that order the list by that column, a second click
   turning it round; Email opens a short menu that narrows the list to one
   email state. Both change only the URL and the server does the rest.

   The row reads the view from ApplicationsFilter's context, which answers
   with the view a click has just asked for rather than the one on screen,
   so the arrow or the filter's name changes on the press, before the rows
   arrive. With no context (the page's first loading skeleton) the row is
   plain text. */

export type ListViewContextValue = {
  /** The view on screen, or the one a click is on its way to. */
  view: ListView;
  /** True from the click until the new rows land. */
  pending: boolean;
  go: (next: ListView) => void;
};

export const ListViewContext = createContext<ListViewContextValue | null>(null);

export function useListView() {
  return useContext(ListViewContext);
}

type Column = { label: string; sort?: ListSort; email?: true };

const COLUMNS: Column[] = [
  { label: "Applicant" },
  { label: "Organisation", sort: "organisation" },
  { label: "Location", sort: "location" },
  { label: "Email", email: true },
  { label: "Status" },
  { label: "Submitted", sort: "submitted" },
];

/* A heading that does something. The padding and the matching negative
   margin give a 28px target without moving the label off the column's
   edge. No `outline-none`: in Tailwind 4 it blanks the ring below. */
const control = cn(
  "-mx-2 -my-1.5 inline-flex select-none items-center gap-1 rounded-md px-2 py-1.5",
  "text-xs font-medium uppercase tracking-[0.05em] whitespace-nowrap",
  "transition-[color,background-color] duration-150 ease-hover hover:bg-muted hover:text-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

function SortHeading({ label, sort, context }: { label: string; sort: ListSort; context: ListViewContextValue }) {
  const { view, go } = context;
  const active = view.sort === sort;
  const next = sortedBy(view, sort);
  const SortIcon = !active ? CaretUpDownIcon : view.dir === "asc" ? ArrowUpIcon : ArrowDownIcon;
  return (
    <th scope="col" aria-sort={active ? (view.dir === "asc" ? "ascending" : "descending") : undefined} className="px-4 py-3">
      <Link
        href={viewHref(next)}
        scroll={false}
        onNavigate={(event) => {
          event.preventDefault();
          go(next);
        }}
        className={cn(control, "group", active && "text-foreground")}
      >
        {label}
        <SortIcon
          aria-hidden
          weight="bold"
          className={cn("size-3 shrink-0", !active && "text-muted-foreground/60 group-hover:text-foreground")}
        />
      </Link>
    </th>
  );
}

const menuItem = cn(
  "grid cursor-default grid-cols-[1rem_1fr] items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground",
  "transition-[background-color] duration-150 ease-hover data-highlighted:bg-muted",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

function EmailHeading({ label, context }: { label: string; context: ListViewContextValue }) {
  const { view, go } = context;
  return (
    <th scope="col" className="px-4 py-3">
      <Menu.Root>
        <Menu.Trigger
          aria-label={view.email ? `${label}, showing ${EMAIL_FILTER_LABEL[view.email]}. Change filter` : `${label}. Filter`}
          className={cn(control, "cursor-default aria-expanded:bg-muted aria-expanded:text-foreground", view.email && "text-foreground")}
        >
          {/* The filter's name sits in the heading while it is on, so the
              narrowed list is never signalled by the icon's colour alone. */}
          <span>{view.email ? `${label}: ${EMAIL_FILTER_LABEL[view.email]}` : label}</span>
          <FunnelSimpleIcon
            aria-hidden
            weight="bold"
            className={cn("size-3 shrink-0", view.email ? "text-brand-cyan" : "text-muted-foreground/60")}
          />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={16} className="z-50">
            <Menu.Popup
              className={cn(
                // Outer radius 12px = the items' 8px + 4px of padding.
                "origin-(--transform-origin) w-52 rounded-xl p-1",
                "border border-transparent bg-popover text-popover-foreground outline-none",
                "shadow-[0_0_0_1px_--alpha(var(--color-black)/6%),0_1px_2px_-1px_--alpha(var(--color-black)/6%),0_8px_24px_-8px_--alpha(var(--color-black)/12%)]",
                "transition-[opacity,scale] duration-200 ease-out",
                "data-starting-style:scale-95 data-starting-style:opacity-0",
                "data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150",
                "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
              )}
            >
              <Menu.Group>
                <Menu.GroupLabel className="px-3 pt-2 pb-1.5 text-xs font-medium text-muted-foreground">Show emails</Menu.GroupLabel>
                <Menu.RadioGroup
                  value={view.email ?? "all"}
                  onValueChange={(value: EmailFilter | "all") => go({ ...view, email: value === "all" ? null : value })}
                >
                  {(["all", ...EMAIL_FILTERS] as const).map((value) => (
                    <Menu.RadioItem key={value} value={value} closeOnClick className={menuItem}>
                      <Menu.RadioItemIndicator className="col-start-1 flex">
                        <CheckIcon aria-hidden weight="bold" className="size-4" />
                      </Menu.RadioItemIndicator>
                      <span className="col-start-2">{value === "all" ? "All" : EMAIL_FILTER_LABEL[value]}</span>
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
              </Menu.Group>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </th>
  );
}

export function TableHead() {
  const context = useListView();
  return (
    <thead>
      <tr className="border-b border-border bg-muted/60 text-left text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
        {COLUMNS.map((column) =>
          context && column.sort ? (
            <SortHeading key={column.label} label={column.label} sort={column.sort} context={context} />
          ) : context && column.email ? (
            <EmailHeading key={column.label} label={column.label} context={context} />
          ) : (
            <th key={column.label} scope="col" className="px-4 py-3">
              {column.label}
            </th>
          ),
        )}
      </tr>
    </thead>
  );
}

/* The table's card. While a sort or a filter is on its way the rows stay
   where they are and fade back a little, so the list reorders in place
   rather than blinking through a skeleton. The fade waits 150ms: a reply
   quicker than that never shows it. */
export function ListFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  const pending = useListView()?.pending ?? false;
  return (
    <div
      aria-busy={pending || undefined}
      className={cn(className, "transition-opacity duration-150 ease-hover", pending && "opacity-60 delay-150")}
    >
      {children}
    </div>
  );
}
