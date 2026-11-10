import { STATUS_LABEL } from "@/components/admin/status-badge";
import type { ApplicationStatus } from "@/lib/db/schema";
import { isDecision } from "@/lib/decisions";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/* Where an applicant stands with their decision email, in a few words for
   the line under the status badge. Null when there is nothing to say: no
   decision yet and never emailed. */
export type EmailStanding = {
  status: ApplicationStatus;
  /** The decision they were last emailed, and when. */
  notifiedStatus: ApplicationStatus | null;
  notifiedAt: Date | null;
  /** A send that has not settled: mid-call, or waiting for an admin. */
  inFlight: "sending" | "review" | null;
};

type Tone = "quiet" | "owed" | "review";

export function emailStatus({ status, notifiedStatus, notifiedAt, inFlight }: EmailStanding): { text: string; tone: Tone } | null {
  if (inFlight === "review") return { text: "Email needs review", tone: "review" };
  if (inFlight === "sending") return { text: "Sending email…", tone: "quiet" };
  const told = notifiedStatus ? STATUS_LABEL[notifiedStatus].toLowerCase() : null;
  if (!isDecision(status)) return told ? { text: `Was told ${told}`, tone: "quiet" } : null;
  if (notifiedStatus === status) return { text: `Emailed ${formatDate(notifiedAt)}`, tone: "quiet" };
  if (told) return { text: `Told ${told}, new email not sent`, tone: "owed" };
  return { text: "Email not sent", tone: "owed" };
}

const tones: Record<Tone, string> = {
  quiet: "text-muted-foreground",
  owed: "text-foreground/80",
  review: "font-medium text-brand-maroon",
};

export function EmailStatusLine({ className, ...standing }: EmailStanding & { className?: string }) {
  const state = emailStatus(standing);
  if (!state) return null;
  return <p className={cn("text-xs whitespace-nowrap tabular-nums", tones[state.tone], className)}>{state.text}</p>;
}
