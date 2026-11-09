import type { ApplicationStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
  withdrawn: "Withdrawn",
};

/* Each state has its own fill, but the word carries the meaning: the
   colours only help scan a list. */
const tone: Record<ApplicationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-brand-cyan/10 text-brand-cyan",
  accepted: "bg-brand-forest/10 text-brand-forest",
  rejected: "bg-brand-maroon/10 text-brand-maroon",
  waitlisted: "bg-brand-golden/20 text-[color-mix(in_oklch,var(--color-brand-golden),black_45%)]",
  withdrawn: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        tone[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
