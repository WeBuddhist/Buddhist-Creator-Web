import { FeedbackForm } from "@/components/home/feedback-form";
import { WaveCorner } from "@/components/mission";
import { SUGGESTION_EMAIL_MAX_LENGTH, SUGGESTION_MAX_LENGTH } from "@/lib/db/schema";
import { FEEDBACK } from "@/lib/home";

export function Feedback() {
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

        {/* The form posts to a server action that stores the suggestion; the
            lengths are the table's own limits. */}
        <FeedbackForm
          suggestionMaxLength={SUGGESTION_MAX_LENGTH}
          emailMaxLength={SUGGESTION_EMAIL_MAX_LENGTH}
        />
      </div>
    </section>
  );
}
