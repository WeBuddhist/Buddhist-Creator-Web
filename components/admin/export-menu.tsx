"use client";

import { Menu } from "@base-ui/react/menu";
import { CaretDownIcon, MicrosoftExcelLogoIcon } from "@phosphor-icons/react";
import { STATUS_LABEL } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import type { ListFilter } from "@/lib/applications";
import type { ApplicationStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

/* The top bar's export: a button that opens the same list of statuses as
   the applications page's pills, each a CSV download of that list. "All"
   is everything but drafts, as on the page. The popup borrows the account
   menu's surface so the two read as one family. Items are plain anchors,
   not router links: the router would otherwise prefetch each download. */

/* The same order as the page's status pills: decisions first, drafts last. */
const FILTERS: ListFilter[] = ["all", "submitted", "accepted", "waitlisted", "rejected", "withdrawn", "draft"];

export type ExportCounts = Partial<Record<ApplicationStatus, number>>;

/* Hover and arrow keys highlight a row with the muted fill. That fill is
   too close to the popup to serve as a focus indicator on its own, so a
   keyboard focus also draws the project's ring. No `outline-none` here:
   in Tailwind 4 it also sets the outline-style variable the ring reads,
   which would leave the ring invisible. */
const item = cn(
  "flex cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground",
  "transition-[background-color] duration-150 ease-hover data-highlighted:bg-muted",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

function exportHref(filter: ListFilter) {
  return filter === "all" ? "/admin/export" : `/admin/export?status=${filter}`;
}

function applicationsLabel(count: number) {
  return count === 1 ? "1 application" : `${count} applications`;
}

export function ExportMenu({ counts }: { counts: ExportCounts | null }) {
  const allButDrafts = Object.entries(counts ?? {})
    .filter(([status]) => status !== "draft")
    .reduce((sum, [, n]) => sum + (n ?? 0), 0);
  const countOf = (filter: ListFilter) => (filter === "all" ? allButDrafts : (counts?.[filter] ?? 0));

  return (
    <Menu.Root>
      {/* Disabled only while the layout is still checking access, when
          there are no counts to list yet. */}
      <Menu.Trigger
        disabled={counts === null}
        render={<Button variant="outline" size="lg" className="shrink-0 ps-2.5 pe-2" />}
      >
        <MicrosoftExcelLogoIcon aria-hidden weight="fill" className="size-4.5 text-logo-excel" />
        Export CSV
        {/* The open state also shows in the button's filled background,
            so the caret's turn is decoration and stops under reduced motion. */}
        <CaretDownIcon
          aria-hidden
          weight="bold"
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-150 ease-hover",
            "group-aria-expanded/button:rotate-180 motion-reduce:transition-none",
          )}
        />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={16} className="z-50">
          <Menu.Popup
            className={cn(
              // Outer radius 12px = the items' 8px + 4px of padding.
              "origin-(--transform-origin) w-56 rounded-xl p-1",
              "border border-transparent bg-popover text-popover-foreground outline-none",
              "shadow-[0_0_0_1px_--alpha(var(--color-black)/6%),0_1px_2px_-1px_--alpha(var(--color-black)/6%),0_8px_24px_-8px_--alpha(var(--color-black)/12%)]",
              "transition-[opacity,scale] duration-200 ease-out",
              "data-starting-style:scale-95 data-starting-style:opacity-0",
              "data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150",
              "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
            )}
          >
            <Menu.Group>
              <Menu.GroupLabel className="px-3 pt-2 pb-1.5 text-xs font-medium text-muted-foreground">
                Export which list?
              </Menu.GroupLabel>
              {FILTERS.map((filter) => {
                const count = countOf(filter);
                return (
                  <Menu.LinkItem key={filter} closeOnClick href={exportHref(filter)} download className={item}>
                    <span className="flex-1">{filter === "all" ? "All" : STATUS_LABEL[filter]}</span>
                    {/* The bare number is enough to see; a screen reader
                        hears what it counts. */}
                    <span aria-hidden className="text-xs tabular-nums text-muted-foreground">
                      {count}
                    </span>
                    <span className="sr-only">, {applicationsLabel(count)}</span>
                  </Menu.LinkItem>
                );
              })}
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
