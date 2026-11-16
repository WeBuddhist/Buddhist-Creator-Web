import type { CreatorCardStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export const CARD_STATUS_LABEL: Record<CreatorCardStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

/* The application badge's recipe (components/admin/status-badge.tsx) in a
   card's three states: waiting takes the submitted blue, the two decisions
   their own hues. The word carries the meaning; the colour helps scan. */
const tone: Record<CreatorCardStatus, { pill: string; dot: string }> = {
  pending: { pill: "bg-status-submitted-bg text-status-submitted-text", dot: "bg-status-submitted-solid" },
  approved: { pill: "bg-status-accepted-bg text-status-accepted-text", dot: "bg-status-accepted-solid" },
  rejected: { pill: "bg-status-rejected-bg text-status-rejected-text", dot: "bg-status-rejected-solid" },
};

export function CardStatusBadge({ status, className }: { status: CreatorCardStatus; className?: string }) {
  const { pill, dot } = tone[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full ps-2 pe-2.5 text-xs font-medium whitespace-nowrap",
        pill,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", dot)} />
      {CARD_STATUS_LABEL[status]}
    </span>
  );
}
