import { FeedbackForm } from "@/components/home/feedback-form";
import { label, panel } from "@/components/convention/section-heading";
import { SUGGESTION_EMAIL_MAX_LENGTH, SUGGESTION_MAX_LENGTH } from "@/lib/db/schema";
import { FEEDBACK } from "@/lib/home";
import { cn } from "@/lib/utils";

/* The suggestion box, on a sheet of brand cyan like the mission: the
   invitation on the left, its last word in gold italic as the mission's
   figure is, and the form on a white card on the right. */
export function Feedback() {
  return (
    <section
      aria-labelledby="feedback-title"
      data-header-tone="dark"
      className={cn(panel, "bg-brand-cyan text-white")}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28">
        <div className="max-w-xl">
          <p className={cn(label, "text-gold-soft")}>{FEEDBACK.eyebrow}</p>
          <h2
            id="feedback-title"
            className="mt-5 text-balance font-display text-[clamp(2.75rem,5vw,4.5rem)] leading-[1.04]"
          >
            {FEEDBACK.title} <em className="italic text-saffron">{FEEDBACK.highlight}</em>
          </h2>
          <p className="mt-7 max-w-[58ch] text-pretty text-lg leading-[1.6] text-white/85 sm:text-xl sm:leading-[1.55]">
            {FEEDBACK.description}
          </p>
        </div>

        {/* The form posts to a server action that stores the suggestion; the
            lengths are the table's own limits. */}
        <div className="rounded-3xl bg-card p-6 text-foreground shadow-[0_24px_48px_-24px_rgb(4_32_44/0.45)] sm:p-8">
          <FeedbackForm
            suggestionMaxLength={SUGGESTION_MAX_LENGTH}
            emailMaxLength={SUGGESTION_EMAIL_MAX_LENGTH}
          />
        </div>
      </div>
    </section>
  );
}
