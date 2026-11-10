"use client";

import { useActionState } from "react";
import { CircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationStatus } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setStatusAction, type DecisionState } from "./actions";

/* One raised button per view. Undecided, that is Accept in the
   dashboard's action blue, with the other two as quiet outlines so the eye
   lands on the primary. Once decided, the decision taken is the raised
   one instead, in its own status hue, with a small dot as the second
   cue, and Accept steps back to an outline so nothing competes with the
   current state. Accepted and Rejected use the badge's text colour, dark
   enough for white; Waitlisted has its own fill token, since its text
   colour reads brown on a button and its solid is too light for white.
   Reject's label stays in the rejected red either way, so it reads as
   the destructive one. */
const DECISIONS: { status: ApplicationStatus; label: string; selected: string; quiet?: string }[] = [
  { status: "accepted", label: "Accept", selected: "[--btn:var(--color-status-accepted-text)]" },
  {
    status: "waitlisted",
    label: "Waitlist",
    selected: "[--btn:var(--color-status-waitlisted-fill)]",
  },
  {
    status: "rejected",
    label: "Reject",
    selected: "[--btn:var(--color-status-rejected-text)]",
    quiet: "text-status-rejected-text hover:text-status-rejected-text",
  },
];

/* The decision form, filling the Decision card. One form, three
   submitters: the clicked button's value is the new status, and the note
   goes along with whichever is pressed. The footer carries what was
   decided and, beside it, the way back. */
export function StatusActions({
  applicationId,
  status,
  reviewNote,
  decided,
  told,
}: {
  applicationId: string;
  status: ApplicationStatus;
  reviewNote: string | null;
  /** "Decided … by …" for a decided application, or null. */
  decided: string | null;
  /** A line on what saving does and does not do about the email. */
  told: string;
}) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(setStatusAction, { ok: false });
  const reviewable = status !== "draft" && status !== "withdrawn";

  if (!reviewable) {
    return (
      <p className="px-5 py-4 text-sm text-muted-foreground">
        {status === "draft" ? "Not submitted yet, so there is nothing to decide." : "Withdrawn by the applicant."}
      </p>
    );
  }

  const message = pending ? "Saving…" : state.ok && state.at ? `Saved at ${formatDateTime(state.at)}.` : state.message;

  return (
    <form action={action}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-note" className="text-muted-foreground">Note for the committee</Label>
          <Textarea
            id="review-note"
            name="note"
            rows={3}
            defaultValue={reviewNote ?? ""}
            placeholder="Why this decision. Only the committee sees this; it is never put in an email."
            className="min-h-20 resize-none px-3 py-2.5 leading-[1.5]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DECISIONS.map((decision) => {
            const selected = status === decision.status;
            const primary = selected || (status === "submitted" && decision.status === "accepted");
            return (
              <Button
                key={decision.status}
                type="submit"
                name="status"
                value={decision.status}
                variant={primary ? "emphasis" : "outline"}
                size="lg"
                disabled={pending}
                aria-pressed={selected}
                className={cn("px-3", selected ? cn("ps-2.5", decision.selected) : decision.quiet)}
              >
                {selected && (
                  <CircleIcon aria-hidden weight="fill" className="size-2.5 opacity-60" />
                )}
                {decision.label}
              </Button>
            );
          })}
        </div>
        <p className="text-xs leading-[1.5] text-muted-foreground">{told}</p>
        {message && (
          <p role="status" aria-live="polite" className={cn("text-xs", state.ok ? "text-brand-forest" : "text-brand-maroon")}>
            {message}
          </p>
        )}
      </div>
      {(decided || status !== "submitted") && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border px-5 py-2.5">
          <p className="text-xs text-muted-foreground tabular-nums">{decided}</p>
          {status !== "submitted" && (
            /* A text link on the footer's own baseline: it is the way back,
               not a fourth decision, so it never dresses as a button. */
            <Button
              type="submit"
              name="status"
              value="submitted"
              variant="link"
              disabled={pending}
              className="h-auto p-0 text-xs font-medium text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground"
            >
              Undo decision
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
