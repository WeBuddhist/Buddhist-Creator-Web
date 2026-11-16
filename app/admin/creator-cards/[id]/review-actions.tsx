"use client";

import { useActionState, useState } from "react";
import { CircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreatorCardStatus } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { reviewCardAction, type ReviewState } from "./actions";

/* The same recipe as an application's decision buttons
   (app/admin/applications/[id]/status-actions.tsx): one raised button per
   view. Undecided, that is Approve; once decided, the decision taken is
   the raised one, in its own hue with a dot, and the other steps back. */
const DECISIONS: { status: CreatorCardStatus; label: string; selected: string; quiet?: string }[] = [
  { status: "approved", label: "Approve", selected: "[--btn:var(--color-status-accepted-text)]" },
  {
    status: "rejected",
    label: "Reject",
    selected: "[--btn:var(--color-status-rejected-text)]",
    quiet: "text-status-rejected-text hover:text-status-rejected-text",
  },
];

/* The review form, filling the Review card. One form, two submitters: the
   pressed button's value is the new status, and the note goes with it.
   The form names the version of the card it was rendered with, so a
   decision never lands on content the reviewer has not seen: if the card
   has moved on, the action refuses, the page shows the new version, and
   this form stays as it is, message and note included. The note is
   controlled for that reason, since React resets a form after its action
   and would otherwise take a refused note with it. */
export function ReviewActions({
  cardId,
  revision,
  status,
  reviewNote,
  reviewed,
}: {
  cardId: string;
  revision: number;
  status: CreatorCardStatus;
  reviewNote: string | null;
  /** "Approved … by …" for a reviewed card, or null. */
  reviewed: string | null;
}) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewCardAction, { ok: false });
  const [note, setNote] = useState(reviewNote ?? "");
  const message = pending ? "Saving…" : state.ok && state.at ? `Saved at ${formatDateTime(state.at)}.` : state.message;

  return (
    <form action={action}>
      <input type="hidden" name="cardId" value={cardId} />
      <input type="hidden" name="revision" value={revision} />
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-note" className="text-muted-foreground">Note to the creator</Label>
          <Textarea
            id="review-note"
            name="note"
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What needs changing before this card can be approved."
            aria-describedby="review-note-hint"
            className="min-h-20 resize-none px-3 py-2.5 leading-[1.5]"
          />
          <p id="review-note-hint" className="text-xs leading-[1.5] text-muted-foreground">
            The creator reads this on their card page when the card is rejected. It is not shown otherwise, and nothing
            is emailed.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DECISIONS.map((decision) => {
            const selected = status === decision.status;
            const primary = selected || (status === "pending" && decision.status === "approved");
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
                {selected && <CircleIcon aria-hidden weight="fill" className="size-2.5 opacity-60" />}
                {decision.label}
              </Button>
            );
          })}
        </div>
        {message && (
          <p role="status" aria-live="polite" className={cn("text-xs", state.ok || pending ? "text-brand-forest" : "text-brand-maroon")}>
            {message}
          </p>
        )}
      </div>
      {status !== "pending" && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border px-5 py-2.5">
          <p className="text-xs text-muted-foreground tabular-nums">{reviewed}</p>
          {/* A text link on the footer's own baseline: it is the way back,
              not a third decision, so it never dresses as a button. */}
          <Button
            type="submit"
            name="status"
            value="pending"
            variant="link"
            disabled={pending}
            className="h-auto p-0 text-xs font-medium text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground"
          >
            Undo review
          </Button>
        </div>
      )}
    </form>
  );
}
