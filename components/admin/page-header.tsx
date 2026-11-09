import { cn } from "@/lib/utils";

/* The top of every dashboard page: an optional eyebrow, the title, a line
   of description and, trailing, whatever acts on the page (a badge, a
   button). The row wraps on a phone, with the actions dropping under the
   text; on a wide screen they sit on the title's baseline. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">{eyebrow}</p>}
        <h1 className={cn("text-2xl font-semibold tracking-[-0.02em] text-foreground", eyebrow && "mt-1")}>{title}</h1>
        {description && <p className="mt-1.5 max-w-[64ch] text-sm leading-[1.6] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
