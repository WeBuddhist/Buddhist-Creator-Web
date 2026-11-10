import type { Icon } from "@phosphor-icons/react";
import { CheckCircleIcon, CircleDashedIcon, PaperPlaneTiltIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { STATUS_LABEL } from "@/components/admin/status-badge";
import type { ApplicationStatus } from "@/lib/db/schema";
import { isDecision } from "@/lib/decisions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* Where an applicant stands with their decision email, for the Email
   column of the applications table: an icon and a word or two, "Sent" or
   "Not sent" in all but the unsettled cases. The detail a row has no room
   for (the date, or the decision they were told before this one) goes in
   `detail`. Null when there is no decision to send. */
export type EmailStanding = {
  status: ApplicationStatus;
  /** The decision they were last emailed, and when. */
  notifiedStatus: ApplicationStatus | null;
  notifiedAt: Date | null;
  /** A send that has not settled: mid-call, or waiting for an admin. */
  inFlight: "sending" | "review" | null;
};

type Tone = "sent" | "owed" | "sending" | "review";

export function emailStatus({ status, notifiedStatus, notifiedAt, inFlight }: EmailStanding): { text: string; tone: Tone; detail?: string } | null {
  if (inFlight === "review") return { text: "Needs review", tone: "review", detail: "A send did not confirm. Open the application to settle it." };
  if (inFlight === "sending") return { text: "Sending…", tone: "sending" };
  if (!isDecision(status)) return null;
  if (notifiedStatus === status) return { text: "Sent", tone: "sent", detail: `Emailed ${formatDate(notifiedAt)}` };
  const told = notifiedStatus ? STATUS_LABEL[notifiedStatus].toLowerCase() : null;
  return { text: "Not sent", tone: "owed", detail: told ? `Told ${told}, new email not sent` : undefined };
}

/* The word carries the state and the icon repeats it, so neither the
   colour nor the shape is the only cue. Sent is the quiet one; the states
   that want something done are darker. */
const tones: Record<Tone, { icon: Icon; fill?: true; text: string; mark: string }> = {
  sent: { icon: CheckCircleIcon, fill: true, text: "text-muted-foreground", mark: "text-status-accepted-solid" },
  owed: { icon: CircleDashedIcon, text: "text-foreground/80", mark: "text-muted-foreground" },
  sending: { icon: PaperPlaneTiltIcon, text: "text-muted-foreground", mark: "text-muted-foreground" },
  review: { icon: WarningIcon, fill: true, text: "font-medium text-brand-maroon", mark: "text-brand-maroon" },
};

/* The cell. With nothing to say it is the same dash an empty Submitted
   cell shows, so the column never leaves a hole in the row. */
export function EmailStatusLine({ className, ...standing }: EmailStanding & { className?: string }) {
  const state = emailStatus(standing);
  if (!state) return <span className={cn("text-muted-foreground", className)}>—</span>;
  const { icon: StateIcon, fill, text, mark } = tones[state.tone];
  return (
    <p title={state.detail} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap", text, className)}>
      <StateIcon aria-hidden weight={fill ? "fill" : "bold"} className={cn("size-4 shrink-0", mark)} />
      {state.text}
    </p>
  );
}
