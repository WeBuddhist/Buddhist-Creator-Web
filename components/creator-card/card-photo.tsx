"use client";

import * as React from "react";
import { UserIcon } from "@phosphor-icons/react";
import { cardInitials, cardPhotoSrc } from "@/lib/creator-card";
import { cn } from "@/lib/utils";

/** The circle at each size: its box, that box in pixels, and the sizes of
    the initials and of the figure that stand in for a picture. */
const SIZES = {
  card: { box: "size-26", pixels: 104, letters: "text-[2.25rem]", figure: "size-10" },
  field: { box: "size-20", pixels: 80, letters: "text-[1.75rem]", figure: "size-8" },
  row: { box: "size-12", pixels: 48, letters: "text-[1.0625rem]", figure: "size-5" },
} as const;

/* The round photo of a creator: on the card itself (`card`), smaller
   beside the form's photo field (`field`), and smallest in a row of the
   leaderboard (`row`). A plain img rather than
   next/image, for the reason the header's avatar gives: the picture comes
   from a sign-in provider's host or a presigned S3 URL, and none is worth
   a remote pattern at this size. No referrer, since Google's CDN refuses
   some cross-site requests that carry one.

   A circle suits every picture a card can have. A creator's own upload is
   a square cut around them; the picture on a card our team made is the
   creator's profile picture from the place they publish, which was
   composed for a circle and is small (Instagram hands out 150 pixels), so
   the card's 6.5rem is about as large as it stays sharp.

   With no picture, or one that will not load (a signature that lapsed, an
   avatar its owner deleted), the circle holds the creator's initials when
   it is told whose card this is, and otherwise the faint figure the Team
   page uses where a portrait is missing. */
export function CardPhoto({
  src: given,
  size = "field",
  name,
  className,
}: {
  src: string | null | undefined;
  size?: "field" | "card" | "row";
  /** Whose card it is, for the initials that stand in for a picture. */
  name?: string;
  className?: string;
}) {
  const src = cardPhotoSrc(given);
  // The src that failed, so a new src gets its own chance.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  const { box, pixels, letters, figure } = SIZES[size];
  const frame = cn("shrink-0 overflow-hidden rounded-full bg-paper-deep", box, className);
  if (!src || failedSrc === src) {
    const initials = cardInitials(name);
    return (
      <div aria-hidden className={cn(frame, "flex items-center justify-center")}>
        {initials ? (
          <span className={cn("font-display leading-none text-brand-cyan", letters)}>{initials}</span>
        ) : (
          <UserIcon className={cn("text-foreground/25", figure)} />
        )}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      // A picture can fail before React is listening: the server's markup
      // starts loading it at once. Such an img is complete with no size,
      // which is checked as soon as React has hold of the element.
      ref={(img) => {
        if (img?.complete && img.naturalWidth === 0) setFailedSrc(src);
      }}
      src={src}
      // Decorative: the name is printed right under it.
      alt=""
      width={pixels}
      height={pixels}
      // A row is one of up to a hundred, most of them far down the page.
      loading={size === "row" ? "lazy" : undefined}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={cn(frame, "object-cover outline -outline-offset-1 outline-black/10")}
    />
  );
}
