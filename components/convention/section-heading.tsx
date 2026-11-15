import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "start" | "center";
  /** h2 is a page section; h3 is a subsection one step smaller. */
  level?: "h2" | "h3";
  /** The title's size, when it should not follow from the level: a page
      section set as quietly as a subsection is `level="h2" size="h3"`. */
  size?: "h2" | "h3";
  /** On a cyan sheet the stack takes the sheet's own text colour, and the
      label the soft gold, instead of ink, cyan and muted. */
  onPanel?: boolean;
  className?: string;
};

/* The label / title / description stack every section opens with: a small
   spaced label, the title in the serif, the description in plain text. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = "start",
  level = "h2",
  size = level,
  onPanel,
  className,
}: SectionHeadingProps) {
  const centered = align === "center";
  const Heading = level;
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center", className)}>
      <p className={cn(label, onPanel ? "text-gold-soft" : "text-brand-cyan")}>{eyebrow}</p>
      <Heading
        id={id}
        className={cn(
          "mt-4 text-balance font-display",
          !onPanel && "text-foreground",
          size === "h2" ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl lg:text-5xl",
          /* After the sizes: each text-* size carries its own line-height,
             and cn drops a leading-* that comes before one. */
          "leading-[1.06]",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            "mt-5 max-w-[58ch] text-pretty text-lg leading-[1.6]",
            centered && "mx-auto",
            onPanel ? "text-white/85" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

/* The small spaced label above a title, and wherever a card needs to say
   what kind of thing it is. The colour is the caller's: brand cyan on
   paper, gold-soft on a cyan sheet (4.7:1). */
export const label = "text-[0.8125rem] font-semibold uppercase leading-[1.3] tracking-[0.14em]";

/* A sheet: a full-width band of colour. The mission, the feedback form and
   the cyan sections of the convention pages each sit in one. The caller
   adds the colour. */
export const panel = "";

/* A card: one white surface with a hairline. `card` is the list item or
   wrapper and only carries the radius; `cardInner` is the surface. */
export const card = "rounded-2xl";
export const cardInner = "rounded-2xl border border-border bg-card";

/* A small quiet label for dates, places and states. */
export const tag =
  "inline-flex items-center rounded-full border border-border px-2.5 py-1 text-[0.6875rem] font-semibold uppercase leading-none tracking-[0.1em] text-muted-foreground";

/* Content photos get a 1px inset outline in pure black so the edge never
   reads as a tinted fringe. */
export const photo = "outline -outline-offset-1 outline-black/10";

/* The site's main button, with `size="pill"`: brand cyan, white label
   (6.2:1). It is the Button's own default on the site; the name is kept for
   call sites that say so. On a cyan sheet use `accentButton`. */
export const primaryButton = "bg-brand-cyan text-white hover:bg-sky-deep";

/* The main button on a cyan sheet or a photograph: the banners' gold, ink
   label (8.6:1), and a white focus ring, since the cyan one would be lost. */
export const accentButton =
  "bg-saffron text-ink hover:bg-gold-soft focus-visible:border-white focus-visible:ring-white/60";

/* The quiet button on a cyan sheet or a photograph: a white outline. */
export const ghostButton =
  "border-white/60 bg-transparent text-white hover:bg-white/12 hover:text-white focus-visible:border-white focus-visible:ring-white/60";
