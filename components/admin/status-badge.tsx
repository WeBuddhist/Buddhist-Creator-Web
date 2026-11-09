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

/* Each decided state has its own hue, bright enough to read as a verdict
   from across the table: a tinted fill, text in the same hue and a solid
   dot. Draft and withdrawn stay neutral, since neither is a decision. The
   word still carries the meaning; the colour only helps scan. */
const tone: Record<ApplicationStatus, { pill: string; dot?: string }> = {
  draft: { pill: "bg-muted text-muted-foreground" },
  submitted: { pill: "bg-status-submitted-bg text-status-submitted-text", dot: "bg-status-submitted-solid" },
  accepted: { pill: "bg-status-accepted-bg text-status-accepted-text", dot: "bg-status-accepted-solid" },
  rejected: { pill: "bg-status-rejected-bg text-status-rejected-text", dot: "bg-status-rejected-solid" },
  waitlisted: { pill: "bg-status-waitlisted-bg text-status-waitlisted-text", dot: "bg-status-waitlisted-solid" },
  withdrawn: { pill: "bg-muted text-muted-foreground line-through" },
};

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const { pill, dot } = tone[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        dot && "ps-2",
        pill,
        className,
      )}
    >
      {dot && <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", dot)} />}
      {STATUS_LABEL[status]}
    </span>
  );
}
