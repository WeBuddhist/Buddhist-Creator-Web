"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckIcon, CircleNotchIcon, PaperPlaneTiltIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { submitFeedback, type FeedbackState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FEEDBACK } from "@/lib/home";
import { cn } from "@/lib/utils";

/* Fields on the brand band itself, no card. Each is a well sunk into the
   band (black at 20%) with a light edge (white at 60%, which measures 3.3:1
   on the band, the contrast a field boundary needs). Typed text is white,
   10:1 on the well; the placeholder is white at 70%, 5:1. Focus turns the
   edge solid white, 6.2:1 on the band. A field that needs fixing takes the
   same solid white edge, and says why in words underneath: the shared
   destructive red is not legible on the band. */
const well = cn(
  "rounded-xl border-white/60 bg-black/20 text-white placeholder:text-white/70",
  "transition-[border-color,box-shadow] duration-150 ease-hover",
  "focus-visible:border-white focus-visible:ring-3 focus-visible:ring-white/25",
  "aria-invalid:border-white aria-invalid:ring-white/25",
);

/* The golden surface from the awards badge, as a button: a 14% lighter top
   fading to brand golden, a 1px highlight along the top edge, a soft drop
   and a 10% darker ring. No border, for the reason given at primaryButton
   in components/convention/section-heading.tsx. The label is the same golden with 50% black, which measures
   5.3:1 on the top of the gradient and 4.7:1 at the bottom. While a
   suggestion is on its way the button stays focusable and only stops
   answering the pointer. */
const goldenButton =
  "border-0 forced-colors:border bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-golden),white_14%)] to-brand-golden font-semibold text-[color-mix(in_oklch,var(--color-brand-golden),black_50%)] shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--color-brand-golden),white_30%),0_1.5px_2px_0_--alpha(var(--color-black)/12%),0_0_0_1px_color-mix(in_oklch,var(--color-brand-golden),black_10%)] transition-[filter,translate] hover:brightness-[1.04] focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white aria-disabled:cursor-default aria-disabled:hover:brightness-100 aria-disabled:active:translate-y-0";

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
const INITIAL: FeedbackState = { status: "idle" };

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
  const [state, formAction, pending] = useActionState(submitFeedback, INITIAL);
  const formRef = React.useRef<HTMLFormElement>(null);
  const suggestionRef = React.useRef<HTMLTextAreaElement>(null);

  // A result is shown until it is cleared: by the visitor typing again,
  // which starts the next suggestion or mends this one, or, for a sent
  // one, by the few seconds running out.
  const [cleared, setCleared] = React.useState<FeedbackState | null>(null);
  const result = pending || cleared === state ? "idle" : state.status;
  const sent = result === "sent";
  const icon = pending ? "spinner" : sent ? "tick" : "plane";

  React.useEffect(() => {
    if (!sent) return;
    const timer = window.setTimeout(() => setCleared(state), SENT_FOR_MS);
    return () => window.clearTimeout(timer);
  }, [sent, state]);

  // Each result is handled once. One the page arrived with, from a post
  // made before it hydrated, is shown by the button and the lines below
  // and is not toasted.
  const handled = React.useRef(state);
  React.useEffect(() => {
    if (handled.current === state) return;
    handled.current = state;

    if (state.status === "sent") {
      formRef.current?.reset();
      toast.success(FEEDBACK.form.sent.title, {
        id: TOAST_ID,
        description: FEEDBACK.form.sent.description,
        duration: 5000,
      });
    } else if (state.status === "empty") {
      // Focus on the field is the announcement: it is read with its error.
      toast.dismiss(TOAST_ID);
      suggestionRef.current?.focus();
    } else if (state.status === "failed") {
      toast.error(FEEDBACK.form.failed.title, {
        id: TOAST_ID,
        description: FEEDBACK.form.failed.description,
        duration: 8000,
        closeButton: true,
      });
    }
  }, [state]);

  /* Sent by hand rather than through the form's own action, which would
     clear the fields whatever came back, a failed save included. Before
     the page hydrates, and without JavaScript, `action` still posts it. */
  function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    React.startTransition(() => formAction(data));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={send}
      onInput={() => {
        if (cleared !== state) setCleared(state);
      }}
      className="flex flex-col gap-5"
    >
      {/* Fields are grouped by space: 8px inside a field, 20px between
          fields. The lengths are the table's own limits. */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="feedback-suggestion" className="text-white">
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
          <p id="feedback-suggestion-error" className="flex items-center gap-1.5 text-sm text-white">
            <WarningCircleIcon className="size-4 shrink-0" weight="fill" aria-hidden />
            {form.empty}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="feedback-email" className="text-white">
          {form.email.label}
          <span className="font-normal text-white/80">({form.email.optional})</span>
        </Label>
        <Input
          id="feedback-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={emailMaxLength}
          placeholder={form.email.placeholder}
          aria-describedby="feedback-email-hint"
          className={cn(well, "h-11 px-3.5")}
        />
        <p id="feedback-email-hint" className="text-sm text-white/80">
          {form.email.hint}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pt-1">
        <Button type="submit" size="pill" aria-disabled={pending || undefined} className={goldenButton}>
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
          <p className="flex items-center gap-1.5 text-sm text-white">
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
