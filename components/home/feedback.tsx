import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr";
import { submitFeedback } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WaveCorner } from "@/components/mission";
import { cn } from "@/lib/utils";
import { FEEDBACK } from "@/lib/home";

/* Fields on the brand band itself, no card. Each is a well sunk into the
   band (black at 20%) with a light edge (white at 60%, which measures 3.3:1
   on the band, the contrast a field boundary needs). Typed text is white,
   10:1 on the well; the placeholder is white at 70%, 5:1. Focus turns the
   edge solid white, 6.2:1 on the band. */
const well = cn(
  "rounded-xl border-white/60 bg-black/20 text-white placeholder:text-white/70",
  "transition-[border-color,box-shadow] duration-150 ease-hover",
  "focus-visible:border-white focus-visible:ring-3 focus-visible:ring-white/25",
);

/* The golden surface from the awards badge, as a button: a 14% lighter top
   fading to brand golden, a 1px highlight along the top edge, a soft drop
   and a 10% darker ring. No border, for the reason given at primaryButton
   in components/convention/section-heading.tsx. The label is the same golden with 50% black, which measures
   5.3:1 on the top of the gradient and 4.7:1 at the bottom. */
const goldenButton =
  "border-0 forced-colors:border bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-golden),white_14%)] to-brand-golden font-semibold text-[color-mix(in_oklch,var(--color-brand-golden),black_50%)] shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--color-brand-golden),white_30%),0_1.5px_2px_0_--alpha(var(--color-black)/12%),0_0_0_1px_color-mix(in_oklch,var(--color-brand-golden),black_10%)] transition-[filter,translate] hover:brightness-[1.04] focus-visible:border-transparent focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function Feedback() {
  const { form } = FEEDBACK;

  return (
    <section
      aria-labelledby="feedback-title"
      className="relative isolate overflow-hidden bg-brand-cyan"
      data-header-tone="brand"
    >
      <WaveCorner className="-top-16 -left-16" />
      <WaveCorner className="-right-16 -bottom-16 -scale-100" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.05em] text-white/80">
            {FEEDBACK.eyebrow}
          </p>
          <h2
            id="feedback-title"
            className="mt-4 text-balance text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl lg:text-5xl"
          >
            {FEEDBACK.title}{" "}
            {/* Brand golden measures 2.98:1 on brand cyan; a 10% lift reaches 3.21:1 for large text. */}
            <span className="text-[color-mix(in_oklch,var(--color-brand-golden),white_10%)]">
              {FEEDBACK.highlight}
            </span>
          </h2>
          <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-white/80">
            {FEEDBACK.description}
          </p>
        </div>

        {/* The form posts to a server action that does nothing yet. Fields are
            grouped by space: 8px inside a field, 20px between fields. */}
        <form action={submitFeedback} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="feedback-suggestion" className="text-white">
              {form.suggestion.label}
            </Label>
            <Textarea
              id="feedback-suggestion"
              name="suggestion"
              required
              rows={5}
              placeholder={form.suggestion.placeholder}
              // Grows with its content, so the drag grip is redundant and hidden.
              className={cn(well, "min-h-32 resize-none px-3.5 py-3 leading-[1.5]")}
            />
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
              placeholder={form.email.placeholder}
              aria-describedby="feedback-email-hint"
              className={cn(well, "h-11 px-3.5")}
            />
            <p id="feedback-email-hint" className="text-sm text-white/80">
              {form.email.hint}
            </p>
          </div>

          <div className="pt-1">
            <Button type="submit" size="pill" className={goldenButton}>
              {form.submit}
              <PaperPlaneTiltIcon data-icon="inline-end" weight="bold" />
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
