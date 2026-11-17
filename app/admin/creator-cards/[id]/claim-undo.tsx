"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settled } from "@/lib/session-ended";
import { undoClaimAction, type UndoResult } from "./actions";

/* For the approval that was a mistake: takes the card back from the
   person a claim gave it to. It sits under the approved claim as a quiet
   link, the way "Undo review" sits under a card's review, and asks first,
   since it takes a card away from somebody. The dialog opens with focus
   on Cancel and has room for a line to the person.

   Undoing is a React Query mutation around the server action. Once it is
   done the page shows the claim as rejected and this link is gone, so
   what it did is said in a toast. */
export function ClaimUndo({
  claimId,
  claimant,
  cardName,
  edited,
}: {
  claimId: string;
  claimant: string;
  cardName: string;
  /** The owner has changed the card since it became theirs. */
  edited: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const undo = useMutation({
    mutationFn: (data: FormData): Promise<UndoResult> => settled(undoClaimAction(data)),
    onSuccess: (result) => {
      if (!result.ok) return;
      setOpen(false);
      toast.success("Approval undone", { description: result.message, duration: 10000, closeButton: true });
    },
  });
  const pending = undo.isPending;
  const error = !pending && undo.data && !undo.data.ok ? undo.data.message : undefined;
  const noteId = `undo-note-${claimId}`;

  return (
    <>
      <Button
        type="button"
        variant="link"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          undo.reset();
          setOpen(true);
        }}
        className="h-auto self-start p-0 text-xs font-medium text-muted-foreground underline decoration-muted-foreground/40 underline-offset-4 hover:text-foreground hover:decoration-foreground"
      >
        Undo approval
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)} disablePointerDismissal={pending}>
        <DialogContent className="max-w-md">
          {/* A second press while it is working does nothing. */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!pending) undo.mutate(new FormData(event.currentTarget));
            }}
            className="flex min-h-0 flex-col"
          >
            <input type="hidden" name="claimId" value={claimId} />
            <DialogHeader>
              <DialogTitle>Undo this approval?</DialogTitle>
              <DialogDescription>
                {claimant} stops being the owner of <span className="font-medium text-foreground">{cardName}</span>, and
                the card can be claimed again. Any other claim this approval turned away goes back to waiting.
                {edited &&
                  " They have changed the card since it became theirs, so it also leaves the directory until you have reviewed it."}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor={noteId} className="text-muted-foreground">
                  Note to {claimant} (optional)
                </Label>
                <Textarea
                  id={noteId}
                  name="note"
                  rows={3}
                  maxLength={2000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Left empty, they are told the claim was approved by mistake."
                  className="min-h-20 resize-none px-3 py-2.5 leading-[1.5]"
                />
                <p className="text-xs leading-[1.5] text-muted-foreground">
                  They read this on their card page. Nothing is emailed.
                </p>
              </div>
              {error && (
                <p role="alert" className="flex items-center gap-1.5 text-sm text-brand-maroon">
                  <WarningCircleIcon aria-hidden weight="fill" className="size-4 shrink-0" />
                  {error}
                </p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="px-3"
                disabled={pending}
                onClick={() => setOpen(false)}
                data-initial-focus
              >
                Cancel
              </Button>
              {/* Stays focusable while it works: a disabled button would
                  drop focus out of the dialog. */}
              <Button
                type="submit"
                variant="destructive"
                size="lg"
                aria-disabled={pending || undefined}
                className="px-3 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                {pending ? "Undoing…" : "Undo approval"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
