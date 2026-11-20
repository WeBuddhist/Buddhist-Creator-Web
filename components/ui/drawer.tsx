"use client";

import { useRef } from "react";
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer";
import { XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* A panel from the trailing edge on Base UI's Drawer, for a task with more
   in it than a centred dialog holds: a list to read through, then a run to
   watch. It is the full height of the screen and the full width of a
   phone. With `side="bottom"` it is a sheet from the foot of the screen
   instead, as tall as what is in it; give the Root `swipeDirection="down"`
   with it, and `"right"` with the side panel, so a swipe closes it the way
   it came. The panel is a column, header and footer fixed and the body
   scrolling, the same parts as components/ui/dialog.tsx so a view moves
   between the two by swapping the imports.

   The motion is the site's other drawers (components/mobile-nav.tsx): it
   follows a finger 1:1, settles on the drawer curve, and leaves through
   the edge it came from. Reduced motion cross-fades instead.

   Focus opens on the element marked `data-initial-focus` (the safe choice,
   usually Cancel) when there is one, not on the close button that comes
   first in the markup. */

const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;

function DrawerContent({
  className,
  children,
  initialFocus,
  locked = false,
  side = "right",
  ...props
}: DrawerPrimitive.Popup.Props & {
  /** True while the drawer must stay open: a swipe no longer moves it. */
  locked?: boolean;
  /** The edge it comes from: the trailing one, or the foot of the screen. */
  side?: "right" | "bottom";
}) {
  const popup = useRef<HTMLDivElement>(null);
  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 min-h-dvh bg-black supports-[-webkit-touch-callout:none]:absolute",
          "[--backdrop-opacity:0.25]",
          "opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))]",
          "transition-opacity duration-[450ms] ease-drawer",
          "data-starting-style:opacity-0 data-ending-style:opacity-0",
          "data-swiping:duration-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
        )}
      />
      <DrawerPrimitive.Viewport
        className={cn(
          "fixed inset-0 z-50 flex",
          side === "right" ? "items-stretch justify-end" : "items-end justify-center",
        )}
      >
        <DrawerPrimitive.Popup
          ref={popup}
          initialFocus={initialFocus ?? (() => popup.current?.querySelector<HTMLElement>("[data-initial-focus]") ?? true)}
          className={cn(
            // --bleed lets the panel overshoot the edge during a swipe without
            // exposing a gap behind it.
            "[--bleed:3rem] relative flex flex-col bg-popover text-popover-foreground outline-none touch-auto",
            "transition-transform duration-[450ms] ease-drawer",
            side === "right"
              ? [
                  "-mr-[3rem] h-full w-[calc(min(30rem,100vw)+3rem)] pr-[3rem]",
                  "border-l border-border shadow-[-24px_0_48px_-24px] shadow-black/20",
                  "pt-[env(safe-area-inset-top,0px)]",
                  "[transform:translateX(var(--drawer-swipe-movement-x))]",
                  "data-starting-style:[transform:translateX(calc(100%-var(--bleed)+2px))]",
                  "data-ending-style:[transform:translateX(calc(100%-var(--bleed)+2px))]",
                ]
              : [
                  // Short of the top, so the page shows above it and it reads as a sheet.
                  "-mb-[3rem] max-h-[calc(100dvh-env(safe-area-inset-top,0px)-1.5rem+3rem)] w-full pb-[3rem]",
                  "rounded-t-[1.25rem] border-t border-border shadow-[0_-24px_48px_-24px] shadow-black/20",
                  "[transform:translateY(var(--drawer-swipe-movement-y))]",
                  "data-starting-style:[transform:translateY(calc(100%-var(--bleed)+2px))]",
                  "data-ending-style:[transform:translateY(calc(100%-var(--bleed)+2px))]",
                ],
            "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
            "data-swiping:select-none",
            "motion-reduce:transition-opacity motion-reduce:duration-200 motion-reduce:ease-hover",
            "motion-reduce:data-starting-style:opacity-0 motion-reduce:data-starting-style:transform-none",
            "motion-reduce:data-ending-style:opacity-0 motion-reduce:data-ending-style:transform-none",
            className,
          )}
          {...props}
        >
          {/* The sheet's grip: says it can be pulled down. The close
              button in the header does the same for a pointer or a key. */}
          {side === "bottom" && (
            <span aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-ink/15" />
          )}
          <DrawerPrimitive.Content
            className="flex min-h-0 flex-1 flex-col"
            {...(locked ? { "data-base-ui-swipe-ignore": "" } : null)}
          >
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
}

/* The title and description, with the close button beside them. Pass
   `closable={false}` while closing would hide work that is still going. */
function DrawerHeader({
  className,
  children,
  closable = true,
  ...props
}: React.ComponentProps<"div"> & { closable?: boolean }) {
  return (
    <div className={cn("flex shrink-0 items-start justify-between gap-3 py-4 ps-5 pe-3", className)} {...props}>
      <div className="flex min-w-0 flex-col gap-1.5 py-1">{children}</div>
      {closable && (
        <DrawerPrimitive.Close
          aria-label="Close"
          className={cn(
            "inline-flex size-9 shrink-0 select-none items-center justify-center rounded-full text-muted-foreground",
            "transition-[background-color,color,transform] duration-150 ease-hover",
            "hover:bg-muted hover:text-foreground active:scale-[0.96]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          <XIcon aria-hidden weight="bold" className="size-4" />
        </DrawerPrimitive.Close>
      )}
    </div>
  );
}

function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-muted/60 px-5 pt-3",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
        className,
      )}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return <DrawerPrimitive.Title className={cn("text-base font-semibold tracking-[-0.01em] text-foreground", className)} {...props} />;
}

function DrawerDescription({ className, ...props }: DrawerPrimitive.Description.Props) {
  return <DrawerPrimitive.Description className={cn("text-sm leading-[1.5] text-muted-foreground", className)} {...props} />;
}

export { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger };
