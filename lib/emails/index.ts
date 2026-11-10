import type { Decision } from "@/lib/decisions";
import { accepted } from "@/lib/emails/accepted";
import { renderEmail, type EmailTemplate, type EmailVars } from "@/lib/emails/layout";
import { rejected } from "@/lib/emails/rejected";
import { waitlisted } from "@/lib/emails/waitlisted";

/* One email per decision. The wording of each lives in its own file. */
export const TEMPLATES: Record<Decision, EmailTemplate> = { accepted, rejected, waitlisted };

/** Whether this decision's wording has been approved for sending. */
export function templateReady(decision: Decision) {
  return TEMPLATES[decision].approved;
}

export function renderDecisionEmail(decision: Decision, vars: EmailVars) {
  return renderEmail(TEMPLATES[decision], vars);
}

export type { EmailVars, RenderedEmail } from "@/lib/emails/layout";
