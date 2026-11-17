"use client";

import * as React from "react";
import { UserIcon } from "@phosphor-icons/react";
import { cardPhotoSrc } from "@/lib/creator-card";
import { cn } from "@/lib/utils";

/** A name's initials: the first letter of its first word and of its last,
    "Ted Kunchok" → "TK". One word gives one letter. */
function cardInitials(name: string | undefined) {
  const words = (name ?? "").split(/\s+/).flatMap((word) => /[\p{L}\p{N}]/u.exec(word)?.[0] ?? []);
  if (words.length === 0) return "";
  return (words.length === 1 ? words[0] : words[0] + words[words.length - 1]).toUpperCase();
}

/* The round photo on a creator card. A plain img rather than next/image,
   for the reason the header's avatar gives: the picture comes from a
   sign-in provider's host or a presigned S3 URL, and none is worth a
   remote pattern at this size. No referrer, since Google's CDN refuses
   some cross-site requests that carry one.

   With no picture, or one that will not load (a signature that lapsed, an
   avatar its owner deleted), it is the faint figure the Team page uses
   where a portrait is missing.

   `round` is the small avatar beside the photo field; `cover` is the large
   picture across the top of the card, cut from the stored square with the
   face kept, since a portrait sits in its upper part.

   `avatar` fills the same space as `cover` with a picture that cannot be
   one: a creator's profile picture from the place they publish, which is
   small (Instagram hands out 150 pixels) and composed for a circle, often
   a logo that a wide crop would cut through. It is shown whole, as the
   circle it was made for, on a ground of its own colours: the same
   picture, enlarged and blurred. */
export function CardPhoto({
  src: given,
  shape = "round",
  name,
  className,
}: {
  src: string | null | undefined;
  shape?: "round" | "cover" | "avatar";
  /** Whose card it is. On the card itself a missing picture is then the
      creator's initials in a circle, where the picture would be, rather
      than the figure: in a directory many cards have no picture yet, and
      a wall of the same grey figure reads as something broken. */
  name?: string;
  className?: string;
}) {
  const src = cardPhotoSrc(given);
  // The src that failed, so a new src gets its own chance.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  const cover = shape !== "round";
  const frame = cn(
    "shrink-0 overflow-hidden bg-paper-deep",
    cover ? "aspect-[5/4] w-full rounded-xl" : "size-20 rounded-full",
    className,
  );
  if (!src || failedSrc === src) {
    const initials = cover ? cardInitials(name) : "";
    if (initials) {
      return (
        <div aria-hidden className={cn(frame, "flex items-center justify-center")}>
          <span className="flex size-30 items-center justify-center rounded-full bg-card font-display text-[2.5rem] leading-none text-brand-cyan shadow-border">
            {initials}
          </span>
        </div>
      );
    }
    return (
      <div aria-hidden className={cn(frame, "flex items-center justify-center")}>
        <UserIcon className={cover ? "size-16 text-foreground/20" : "size-8 text-foreground/25"} />
      </div>
    );
  }
  if (shape === "avatar") {
    return (
      <div className={cn(frame, "relative isolate flex items-center justify-center")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          aria-hidden
          referrerPolicy="no-referrer"
          className="absolute inset-0 -z-10 size-full scale-150 object-cover opacity-55 blur-2xl saturate-125"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={(img) => {
            if (img?.complete && img.naturalWidth === 0) setFailedSrc(src);
          }}
          src={src}
          alt=""
          width={150}
          height={150}
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          // 7.5rem: as large as a 150-pixel picture stays sharp.
          className="size-30 rounded-full bg-card object-cover shadow-float outline-3 outline-white"
        />
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
