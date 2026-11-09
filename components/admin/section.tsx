import { panel } from "@/components/admin/panel";
import { cn } from "@/lib/utils";

/* A dashboard section: the panel with a header row carrying the title and,
   trailing, a line of metadata, then the body on the same inline padding.
   The header sits on a light grey band under a hairline, so the title
   reads as the card's label rather than its first row; the body groups
   its own content with space. The band's top corners follow the card's. */
export function Section({
  id,
  title,
  meta,
  children,
  className,
  bodyClassName,
}: {
  id: string;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn(panel, className)}>
      <header className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-t-[inherit] border-b border-border bg-muted/60 px-5 py-2.5">
        <h2 id={id} className="text-sm font-medium text-foreground">
          {title}
        </h2>
        {meta && <p className="text-xs text-muted-foreground tabular-nums">{meta}</p>}
      </header>
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export type Fact = { label: string; value: React.ReactNode };

/* Label and value pairs, dense enough that hairlines between the rows
   earn their place. On a phone the label sits over its value; from the
   small breakpoint the labels line up in one column so the values share
   an edge. A missing value shows as a dash rather than an empty row. */
export function Facts({ items, className }: { items: Fact[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-border", className)}>
      {items.map(({ label, value }) => (
        <div key={label} className="grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-4">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-sm text-foreground whitespace-pre-line">
            {value ?? <span className="text-muted-foreground">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* A set of short values as chips, for the multi-choice answers. */
export function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="-my-0.5 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="inline-flex h-6 items-center rounded-md bg-muted px-2 text-xs font-medium text-foreground whitespace-nowrap">
          {item}
        </li>
      ))}
    </ul>
  );
}
