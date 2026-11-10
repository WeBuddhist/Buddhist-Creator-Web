"use client";

import { useActionState, useState } from "react";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DECISION_EMAIL, type Decision } from "@/lib/decisions";
import { cn } from "@/lib/utils";
import {
  resendDecisionEmailAction,
  resolveNotificationAction,
  sendDecisionEmailAction,
  type EmailState,
} from "./actions";

/* What can be done about this applicant's decision email, under the line
   that says where it stands. One of three things shows:
   - a send that never confirmed, with the two ways of settling it;
   - the decision they have not been told, with the button that sends it;
   - the email they already have, with a quiet way to send it again.
   Sending again asks first: it is the one path that writes to someone
   twice, so it is never one click. */

export type EmailActionsProps = {
  applicationId: string;
  /** The current decision, or null when there is none to send. */
  decision: Decision | null;
  /** True when that decision has not been emailed. */
  owed: boolean;
  /** When the current decision was emailed, as shown on the page. */
  notifiedAt: string | null;
  recipient: string;
  /** A send waiting for an admin to say whether it arrived. */
  review: { id: string; decision: Decision } | null;
  /** A send in progress right now. */
  sending: boolean;
  /** False when this environment may not write to applicants. */
  canSend: boolean;
};

const quietLink =
  "h-auto p-0 text-xs font-medium text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground";

export function EmailActions({ applicationId, decision, owed, notifiedAt, recipient, review, sending, canSend }: EmailActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState<EmailState, FormData>(
    async (previous, formData) => {
      const intent = formData.get("intent");
      const result =
        intent === "resend"
          ? await resendDecisionEmailAction(previous, formData)
          : intent === "resolve"
            ? await resolveNotificationAction(previous, formData)
            : await sendDecisionEmailAction(previous, formData);
      setConfirming(false);
      return result;
    },
    { ok: false },
  );

  const message = pending ? "Working…" : state.message;
  const status = message && (
    <p role="status" aria-live="polite" className={cn("text-xs", pending ? "text-muted-foreground" : state.ok ? "text-brand-forest" : "text-brand-maroon")}>
      {message}
    </p>
  );

  if (review) {
    return (
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="intent" value="resolve" />
        <input type="hidden" name="notificationId" value={review.id} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" name="outcome" value="sent" variant="outline" size="lg" className="px-3" disabled={pending}>
            Mark as sent
          </Button>
          <Button type="submit" name="outcome" value="not_sent" variant="outline" size="lg" className="px-3" disabled={pending}>
            Not sent, allow retry
          </Button>
        </div>
        {status}
      </form>
    );
  }

  if (!decision || sending) return status || null;

  if (owed) {
    return (
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="intent" value="send" />
        <input type="hidden" name="applicationId" value={applicationId} />
        <input type="hidden" name="expectedStatus" value={decision} />
        <div>
          <Button type="submit" variant="emphasis" size="lg" className="px-3" disabled={pending || !canSend}>
            <PaperPlaneTiltIcon aria-hidden weight="fill" />
            Send {DECISION_EMAIL[decision]} email
          </Button>
        </div>
        {status}
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {canSend && notifiedAt && (
        <div>
          <Button type="button" variant="link" className={quietLink} disabled={pending} onClick={() => setConfirming(true)}>
            Send again…
          </Button>
        </div>
      )}
      {status}
      <Dialog open={confirming} onOpenChange={(next) => !pending && setConfirming(next)} disablePointerDismissal={pending}>
        <DialogContent className="max-w-md">
          <form action={action}>
            <input type="hidden" name="intent" value="resend" />
            <input type="hidden" name="applicationId" value={applicationId} />
            <input type="hidden" name="expectedStatus" value={decision} />
            <input type="hidden" name="expectedNotifiedAt" value={notifiedAt ?? ""} />
            <DialogHeader>
              <DialogTitle>Send the {DECISION_EMAIL[decision]} email again?</DialogTitle>
              <DialogDescription>
                <span className="break-all">{recipient}</span> has already been sent this email. They will receive a second
                copy.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" size="lg" className="px-3" disabled={pending} onClick={() => setConfirming(false)} data-initial-focus>
                Cancel
              </Button>
              <Button type="submit" variant="emphasis" size="lg" className="px-3" disabled={pending}>
                {pending ? "Sending…" : "Send again"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
