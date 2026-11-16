"use client";

import * as React from "react";
import { UserIcon } from "@phosphor-icons/react";
import { cardPhotoSrc } from "@/lib/creator-card";
import { cn } from "@/lib/utils";

/* The round photo on a creator card. A plain img rather than next/image,
   for the reason the header's avatar gives: the picture comes from a
   sign-in provider's host or a presigned S3 URL, and none is worth a
   remote pattern at this size. No referrer, since Google's CDN refuses
   some cross-site requests that carry one.

   With no picture, or one that will not load (a signature that lapsed, an
   avatar its owner deleted), it is the faint figure the People page uses
   where a portrait is missing.

   `round` is the small avatar beside the photo field; `cover` is the large
   picture across the top of the card, cut from the stored square with the
   face kept, since a portrait sits in its upper part. */
export function CardPhoto({
  src: given,
  shape = "round",
  className,
}: {
  src: string | null | undefined;
  shape?: "round" | "cover";
  className?: string;
}) {
  const src = cardPhotoSrc(given);
  // The src that failed, so a new src gets its own chance.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  const cover = shape === "cover";
  const frame = cn(
    "shrink-0 overflow-hidden bg-paper-deep",
    cover ? "aspect-[5/4] w-full rounded-xl" : "size-20 rounded-full",
    className,
  );
  if (!src || failedSrc === src) {
    return (
      <div aria-hidden className={cn(frame, "flex items-center justify-center")}>
        <UserIcon className={cover ? "size-16 text-foreground/20" : "size-8 text-foreground/25"} />
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
      width={cover ? 512 : 80}
      height={cover ? 410 : 80}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={cn(frame, "object-cover outline -outline-offset-1 outline-black/10", cover && "h-auto object-[50%_30%]")}
    />
  );
}
