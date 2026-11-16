"use client";

import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, CircleNotchIcon, PaperPlaneTiltIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { postFeedback, submitFeedback, type FeedbackState } from "@/app/actions";
import { primaryButton } from "@/components/convention/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK } from "@/lib/home";
import { cn } from "@/lib/utils";

/* Fields on the form's white card: a hairline edge at 45% ink (3.3:1, the
   contrast a field boundary needs) that turns brand cyan on focus. A field
   that needs fixing takes the destructive red on its edge, and says why in
   words underneath. */
const well = cn(
  "rounded-xl border-input bg-card text-foreground placeholder:text-muted-foreground",
  "transition-[border-color,box-shadow] duration-150 ease-hover",
  "focus-visible:border-brand-cyan focus-visible:ring-3 focus-visible:ring-brand-cyan/20",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
);

/* While a suggestion is on its way the button stays focusable and only
   stops answering the pointer. */
const sendButton = cn(
  primaryButton,
  "aria-disabled:cursor-default aria-disabled:hover:bg-brand-cyan aria-disabled:active:translate-y-0",
);

/* The button's two labels and three icons each share one grid cell, so the
   button keeps the width of its widest state and nothing beside it moves.
   The icons cross-fade with the values every icon swap on the site uses;
   with reduced motion only the fade is left. */
const stacked = "[grid-area:1/1]";
const labelLayer = cn(stacked, "transition-opacity duration-150 ease-out");
const iconLayer = cn(
  stacked,
  "transition-[opacity,filter,scale] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
  "motion-reduce:scale-100 motion-reduce:blur-[0px]",
);
const iconShown = "scale-100 opacity-100 blur-[0px]";
const iconHidden = "scale-[0.25] opacity-0 blur-[4px]";

const TOAST_ID = "suggestion";
/* How long the button reads "Suggestion sent" before it offers to send
   another. Long enough to be read, short enough that the box never looks
   closed after one suggestion. */
const SENT_FOR_MS = 3000;

/* The suggestion box's form. Sending shows on the button itself: the paper
   plane gives way to a spinner while the suggestion is saved, then to a
   tick and "Suggestion sent" for a few seconds, after which it is "Send
   suggestion" again, ready for the next one. A toast says the same, and
   the fields clear.

   The limits come from the server component, so the table's schema stays
   out of the browser bundle. */
export function FeedbackForm({
  suggestionMaxLength,
  emailMaxLength,
}: {
  suggestionMaxLength: number;
  emailMaxLength: number;
}) {
  const { form } = FEEDBACK;
  const formRef = React.useRef<HTMLFormElement>(null);
  const suggestionRef = React.useRef<HTMLTextAreaElement>(null);
  // The wait before a sent suggestion's tick gives way to the plane again.
  const settle = React.useRef<number>(undefined);

  /* Sending is a React Query mutation, and each result is acted on once,
     in its callbacks. A request that fails outright is the same to the
     visitor as a save that failed. */
  const send = useMutation({
    mutationFn: (data: FormData) => submitFeedback(data).catch((): FeedbackState => ({ status: "failed" })),
    onSuccess: ({ status }) => {
      if (status === "sent") {
        formRef.current?.reset();
        toast.success(form.sent.title, { id: TOAST_ID, description: form.sent.description, duration: 5000 });
        settle.current = window.setTimeout(() => send.reset(), SENT_FOR_MS);
      } else if (status === "empty") {
        // Focus on the field is the announcement: it is read with its error.
        toast.dismiss(TOAST_ID);
        suggestionRef.current?.focus();
      } else if (status === "failed") {
        toast.error(form.failed.title, {
          id: TOAST_ID,
          description: form.failed.description,
          duration: 8000,
          closeButton: true,
        });
      }
    },
  });

  // A result is shown until it is cleared: by the visitor typing again,
  // which starts the next suggestion or mends this one, or, for a sent
  // one, by the few seconds running out.
  const pending = send.isPending;
  const result = pending ? "idle" : (send.data?.status ?? "idle");
  const sent = result === "sent";
  const icon = pending ? "spinner" : sent ? "tick" : "plane";
  const clear = () => {
    window.clearTimeout(settle.current);
    if (send.data) send.reset();
  };

  return (
    <form
      ref={formRef}
      /* Sent by hand: the mutation keeps the fields when a save fails,
         which the form's own action would clear. Before the page's scripts
         have loaded, and without them, `action` still posts it. */
      action={postFeedback}
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        window.clearTimeout(settle.current);
        send.mutate(new FormData(event.currentTarget));
      }}
      onInput={clear}
      className="flex flex-col gap-5"
    >
      {/* Fields are grouped by space: 8px inside a field, 20px between
          fields. The lengths are the table's own limits. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="feedback-suggestion" className="text-foreground">
          {form.suggestion.label}
        </Label>
        <Textarea
          ref={suggestionRef}
          id="feedback-suggestion"
          name="suggestion"
          required
          maxLength={suggestionMaxLength}
          rows={5}
          placeholder={form.suggestion.placeholder}
          aria-invalid={result === "empty" || undefined}
          aria-describedby={result === "empty" ? "feedback-suggestion-error" : undefined}
          // Grows with its content, so the drag grip is redundant and hidden.
          className={cn(well, "min-h-32 resize-none px-3.5 py-3 leading-[1.5]")}
        />
        {result === "empty" && (
          <p id="feedback-suggestion-error" className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <WarningCircleIcon className="size-4 shrink-0" weight="fill" aria-hidden />
            {form.empty}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="feedback-email" className="text-foreground">
          {form.email.label}
          <span className="font-normal text-muted-foreground">({form.email.optional})</span>
        </Label>
        <Input
          id="feedback-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={emailMaxLength}
          placeholder={form.email.placeholder}
          aria-describedby="feedback-email-hint"
          className={cn(well, "h-12 px-3.5")}
        />
        <p id="feedback-email-hint" className="text-sm text-muted-foreground">
          {form.email.hint}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
        <Button type="submit" size="pill" aria-disabled={pending || undefined} className={sendButton}>
          <span className="grid">
            <span className={cn(labelLayer, sent && "opacity-0")} aria-hidden={sent || undefined}>
              {form.submit}
            </span>
            <span className={cn(labelLayer, !sent && "opacity-0")} aria-hidden={!sent || undefined}>
              {form.sent.button}
            </span>
          </span>
          <span data-icon="inline-end" className="grid place-items-center" aria-hidden>
            <span className={cn(iconLayer, icon === "plane" ? iconShown : iconHidden)}>
              <PaperPlaneTiltIcon weight="bold" />
            </span>
            <span className={cn(iconLayer, icon === "spinner" ? iconShown : iconHidden)}>
              {/* Paused rather than stopped when hidden, so it fades out at
                  the angle it reached. */}
              <CircleNotchIcon
                weight="bold"
                className={cn("animate-spin [animation-duration:700ms]", !pending && "[animation-play-state:paused]")}
              />
            </span>
            <span className={cn(iconLayer, icon === "tick" ? iconShown : iconHidden)}>
              <CheckIcon weight="bold" />
            </span>
          </span>
        </Button>

        {/* The toast announces a failed save; this line is what is left
            when the toast has gone. */}
        {result === "failed" && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
            <WarningCircleIcon className="size-4 shrink-0" weight="fill" aria-hidden />
            <span>
              {form.failed.title}. {form.failed.description}
            </span>
          </p>
        )}
      </div>
    </form>
  );
}
