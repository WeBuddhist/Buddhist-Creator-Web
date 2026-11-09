import Link from "next/link";
import { panel, panelLink } from "@/components/admin/panel";
import { cn } from "@/lib/utils";

export type StatTile = {
  label: string;
  count: number;
  href: string;
  /** The status dot's colour class, or none for a neutral count. */
  dot?: string;
  /** The tile whose filter the table is showing. */
  active?: boolean;
};

/* The numbers at the top of the dashboard, one tile per decision state.
   Each tile is a link to that filter, so the figure is also the way in.
   Two across even on a phone, so the table is not pushed below the fold;
   a label may wrap there, which is fine, and the row keeps one height.
   The dot takes the status badge's hue, so a tile and the badges in the
   table beneath it read as the same state. */
export function StatTiles({ tiles, className }: { tiles: StatTile[]; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 xl:grid-cols-4", className)}>
      {tiles.map((tile) => (
        <li key={tile.label}>
          <Link
            href={tile.href}
            aria-current={tile.active ? "page" : undefined}
            className={cn(panelLink, "flex h-full flex-col gap-3 p-4 sm:p-5", tile.active && "shadow-border-hover")}
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {tile.dot && <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", tile.dot)} />}
              {tile.label}
            </span>
            <span className="text-3xl font-semibold leading-none tracking-[-0.02em] text-foreground tabular-nums">
              {tile.count}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* The tiles before the counts are known: same grid, same heights. */
export function StatTilesSkeleton({ labels, className }: { labels: string[]; className?: string }) {
  return (
    <ul aria-hidden="true" className={cn("grid grid-cols-2 gap-3 xl:grid-cols-4", className)}>
      {labels.map((label) => (
        <li key={label} className={cn(panel, "flex flex-col gap-3 p-4 sm:p-5")}>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 shrink-0 rounded-full bg-muted" />
            {label}
          </span>
          <span className="block h-[1.875rem] w-12 animate-pulse rounded-md bg-muted" />
        </li>
      ))}
    </ul>
  );
}
