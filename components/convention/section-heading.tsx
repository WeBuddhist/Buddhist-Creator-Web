import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  /** h2 is a page section; h3 is a subsection one step smaller. */
  level?: "h2" | "h3";
  className?: string;
};

/* The eyebrow / title / description stack used by every section on the
   homepage, so the convention page reads as the same site. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "start",
  level = "h2",
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  const Heading = level;
  return (
    <div
      className={cn(
        "max-w-2xl",
        centered && "mx-auto text-center",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">
        {eyebrow}
      </p>
      <Heading
        id={id}
        className={cn(
          "mt-4 text-balance font-semibold leading-[1.15] tracking-[-0.02em] text-foreground",
          level === "h2"
            ? "text-3xl sm:text-4xl lg:text-5xl"
            : "text-2xl sm:text-3xl lg:text-4xl",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6] text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

/* Card chrome shared across the page, matching the homepage stats cards:
   a muted frame with a hairline ring, and inside it the white surface with
   its own ring plus lift. Two rings read as a double border. Outer radius
   16px = inner 12px + 4px padding (concentric). The transparent borders are
   what forced-colors mode paints in place of the shadows. */
export const card = "rounded-2xl border border-transparent bg-muted/40 p-1 shadow-ring";
export const cardInner = "rounded-xl border border-transparent bg-card shadow-border";

/* Content photos get a 1px inset outline in pure black so the edge never
   reads as a tinted fringe. */
export const photo = "outline -outline-offset-1 outline-black/10";

/* The primary button, in the homepage hero's recipe: a lighter top fading
   to brand cyan, a 1px highlight along the top edge, a soft drop and a
   ring one shade darker. No border: an inset shadow is clipped at the
   padding box, so a transparent border would leave a band of plain
   gradient between the ring and the highlight, and on a pill the top then
   reads as a stepped double edge. Forced-colors mode gets the border back,
   since it drops every shadow. */
export const primaryButton =
  "border-0 forced-colors:border bg-linear-to-b from-[color-mix(in_oklch,var(--color-brand-cyan),white_14%)] to-brand-cyan text-white shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--color-brand-cyan),white_30%),0_1.5px_2px_0_--alpha(var(--color-black)/12%),0_0_0_1px_color-mix(in_oklch,var(--color-brand-cyan),black_10%)] transition-[filter,translate] hover:brightness-[1.06]";
