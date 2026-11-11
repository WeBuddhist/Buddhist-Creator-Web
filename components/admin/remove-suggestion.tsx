"use client";

import { useActionState, useRef, useState } from "react";
import { TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { removeSuggestionAction, type RemoveState } from "@/app/admin/suggestions/actions";
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

/* Removing a suggestion, for superadmins. It cannot be undone, so the bin
   asks first: the dialog shows the suggestion itself, since nothing else
   names it, and opens with focus on Cancel.

   Once it is gone so is its row, and this button with it. Focus then goes
   to the bin on the next suggestion, or the one before, so a run of them
   can be cleared from the keyboard; with none left on the page it goes to
   the list itself (`listId`) rather than to nowhere. */
export function RemoveSuggestion({
  suggestionId,
  body,
  hasEmail,
  received,
  listId,
}: {
  suggestionId: string;
  body: string;
  hasEmail: boolean;
  /** When it arrived, as the list shows it. Tells one bin from the next. */
  received: string;
  listId: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  // Set once the suggestion is gone: where focus goes as the dialog closes.
  const focusAfter = useRef<(() => HTMLElement | null) | null>(null);
  const [state, action, pending] = useActionState<RemoveState, FormData>(
    async (previous, formData) => {
      // Looked up while this row is still in the list.
      const row = trigger.current?.closest("li");
      const neighbour = (row?.nextElementSibling ?? row?.previousElementSibling)?.querySelector<HTMLElement>("button");
      const result = await removeSuggestionAction(previous, formData);
      if (result.ok) {
        focusAfter.current = () => (neighbour?.isConnected ? neighbour : document.getElementById(listId));
        setOpen(false);
        toast.success("Suggestion removed");
      }
      return result;
    },
    { ok: false },
  );
  // A failure is shown until the dialog is next opened.
  const [seen, setSeen] = useState(state);
  const error = !pending && state !== seen ? state.message : undefined;

  return (
    <>
      <Button
        ref={trigger}
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label={`Remove suggestion received ${received}`}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive aria-expanded:bg-destructive/10 aria-expanded:text-destructive"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setSeen(state);
          setOpen(true);
        }}
      >
        <TrashIcon aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)} disablePointerDismissal={pending}>
        <DialogContent
          className="max-w-md"
          finalFocus={() => focusAfter.current?.() ?? true}
        >
          {/* A second press while it is being removed does nothing. */}
          <form
            action={action}
            onSubmit={(event) => {
              if (pending) event.preventDefault();
            }}
            className="flex min-h-0 flex-col"
          >
            <input type="hidden" name="suggestionId" value={suggestionId} />
            <DialogHeader>
              <DialogTitle>Remove this suggestion?</DialogTitle>
              <DialogDescription>
                It is deleted for good{hasEmail ? ", along with the email left with it" : ""}. You can’t undo this.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-3">
              <blockquote className="max-h-40 overflow-y-auto overscroll-contain rounded-lg bg-muted px-3 py-2.5 text-sm leading-[1.6] whitespace-pre-line wrap-anywhere text-foreground">
                {body}
              </blockquote>
              {error && (
                <p role="alert" className="flex items-center gap-1.5 text-sm text-brand-maroon">
                  <WarningCircleIcon aria-hidden weight="fill" className="size-4 shrink-0" />
                  {error}
                </p>
              )}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" size="lg" className="px-3" disabled={pending} onClick={() => setOpen(false)} data-initial-focus>
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
                {pending ? "Removing…" : "Remove suggestion"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
