"use client";

import * as React from "react";
import { Tooltip } from "@base-ui/react/tooltip";
import { SealCheckIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const VERIFIED_LABEL = "Verified by Buddhist Creators";

/* The mark on a card our team has approved: a seal with a tick, in brand
   cyan, sitting on the edge of the creator's photo. A tick rather than
   our lion: at this size the lion is a smudge, and a tick already means
   "checked" to anyone who has used a social app, which is the one thing
   the mark has to say. The colour makes it ours.

   Pointing at it, or reaching it with the keyboard, says who did the
   checking. A finger cannot hover, so a tap shows the same line for a
   couple of seconds. The button carries the line as its name, so a screen
   reader hears it without the tooltip. */
export function VerifiedMark({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false);
  const touch = React.useRef(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger
        delay={150}
        closeOnClick={false}
        aria-label={VERIFIED_LABEL}
        onPointerDown={(event) => {
          touch.current = event.pointerType === "touch";
        }}
        onClick={() => {
          setOpen(true);
          clearTimeout(timer.current);
          if (touch.current) timer.current = setTimeout(() => setOpen(false), 2500);
        }}
        className={cn(
          // The white disc is what shows through the tick, and its ring
          // keeps the seal clear of the photo behind it.
          "flex size-7 cursor-default items-center justify-center rounded-full bg-card text-brand-cyan ring-2 ring-card",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
      >
        <SealCheckIcon aria-hidden weight="fill" className="size-7" />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="top" sideOffset={6} collisionPadding={12} className="z-50">
          <Tooltip.Popup
            className={cn(
              "origin-(--transform-origin) rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-float",
              "transition-[opacity,scale] duration-150 ease-out",
              "data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:opacity-0",
              "motion-reduce:data-starting-style:scale-100",
            )}
          >
            {VERIFIED_LABEL}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
