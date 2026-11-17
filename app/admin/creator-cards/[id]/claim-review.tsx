"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settled } from "@/lib/session-ended";
import { cn } from "@/lib/utils";
import { reviewClaimAction } from "./actions";

/* The decision on one waiting claim: approve it, which makes the claimant
   the card's owner, or reject it with a note the claimant reads. The same
   shape as the card's own review form: one form, two submitters, saved
   through a React Query mutation. A decision is final, so once it lands
   the page reads the claim again and this form is gone. */
export function ClaimReview({ claimId, claimant }: { claimId: string; claimant: string }) {
  const [note, setNote] = useState("");
  const review = useMutation({ mutationFn: (data: FormData) => settled(reviewClaimAction(data)) });
  const pending = review.isPending;
  const message = pending ? "Saving…" : review.data && !review.data.ok ? review.data.message : null;
  const noteId = `claim-note-${claimId}`;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        // The button that was pressed says which decision this is.
        const pressed = (event.nativeEvent as SubmitEvent).submitter;
        if (pressed instanceof HTMLButtonElement) data.set(pressed.name, pressed.value);
        review.mutate(data);
      }}
    >
      <input type="hidden" name="claimId" value={claimId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor={noteId} className="text-muted-foreground">
          Note to {claimant}
        </Label>
        <Textarea
          id={noteId}
          name="note"
          rows={2}
          maxLength={2000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Why the claim cannot be approved, or what to do next."
          className="min-h-16 resize-none px-3 py-2.5 leading-[1.5]"
        />
        <p className="text-xs leading-[1.5] text-muted-foreground">
          They read this on their card page if the claim is rejected. Nothing is emailed.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" name="decision" value="approved" variant="emphasis" size="lg" disabled={pending} className="px-3">
          Approve claim
        </Button>
        <Button
          type="submit"
          name="decision"
          value="rejected"
          variant="outline"
          size="lg"
          disabled={pending}
          className="px-3 text-status-rejected-text hover:text-status-rejected-text"
        >
          Reject
        </Button>
      </div>
      {message && (
        <p role="status" aria-live="polite" className={cn("text-xs", pending ? "text-brand-forest" : "text-brand-maroon")}>
          {message}
        </p>
      )}
    </form>
  );
}
