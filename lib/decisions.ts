import type { ApplicationStatus } from "@/lib/db/schema";

/* The three outcomes an admin can record, each with its own email. No
   server imports, so the dashboard's client components can use it too. */
export const DECISIONS = ["accepted", "rejected", "waitlisted"] as const;

export type Decision = (typeof DECISIONS)[number];

export function isDecision(status: ApplicationStatus | null | undefined): status is Decision {
  return (DECISIONS as readonly string[]).includes(status ?? "");
}

/** The email's name in a sentence: "Send acceptance email". */
export const DECISION_EMAIL: Record<Decision, string> = {
  accepted: "acceptance",
  rejected: "rejection",
  waitlisted: "waitlist",
};
