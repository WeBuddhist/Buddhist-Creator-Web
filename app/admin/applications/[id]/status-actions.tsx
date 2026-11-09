"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationStatus } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setStatusAction, type DecisionState } from "./actions";

const DECISIONS: { status: ApplicationStatus; label: string; className: string }[] = [
  { status: "accepted", label: "Accept", className: "bg-brand-forest text-white hover:bg-brand-forest/90" },
  { status: "waitlisted", label: "Waitlist", className: "bg-brand-golden text-black/80 hover:bg-brand-golden/90" },
  { status: "rejected", label: "Reject", className: "bg-brand-maroon text-white hover:bg-brand-maroon/90" },
];

/* The decision buttons. One form, three submitters: the clicked button's
   value is the new status. The note goes along with whichever is pressed. */
export function StatusActions({
  applicationId,
  status,
  reviewNote,
}: {
  applicationId: string;
  status: ApplicationStatus;
  reviewNote: string | null;
}) {
  const [state, action, pending] = useActionState<DecisionState, FormData>(setStatusAction, { ok: false });
  const reviewable = status !== "draft" && status !== "withdrawn";

  if (!reviewable) {
    return (
      <p className="text-sm text-muted-foreground">
        {status === "draft" ? "Not submitted yet, so there is nothing to decide." : "Withdrawn by the applicant."}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="review-note">Note for the committee (optional)</Label>
        <Textarea
          id="review-note"
          name="note"
          rows={3}
          defaultValue={reviewNote ?? ""}
          placeholder="Why this decision, or anything the mailing should mention."
          className="min-h-20 px-3.5 py-3 leading-[1.5]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {DECISIONS.map((decision) => (
          <Button
            key={decision.status}
            type="submit"
            name="status"
            value={decision.status}
            size="pill"
            disabled={pending}
            aria-pressed={status === decision.status}
            className={cn(decision.className, status === decision.status && "ring-3 ring-ring/40")}
          >
            {decision.label}
          </Button>
        ))}
        {status !== "submitted" && (
          <Button type="submit" name="status" value="submitted" size="pill" variant="outline" disabled={pending}>
            Undo decision
          </Button>
        )}
      </div>
      <p role="status" aria-live="polite" className={cn("text-sm", state.ok ? "text-brand-forest" : "text-brand-maroon")}>
        {pending ? "Saving…" : state.ok && state.at ? `Saved at ${formatDateTime(state.at)}.` : state.message}
      </p>
    </form>
  );
}
