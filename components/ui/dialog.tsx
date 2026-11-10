"use client";

import { useRef } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

/* A centred modal on Base UI's Dialog, dressed like the dashboard's menus
   (components/admin/export-menu.tsx): the popover surface, the same lifted
   shadow, the same scale-and-fade. The popup is a column, header and footer
   fixed and the body scrolling, so a long list never pushes the buttons
   off a phone screen.

   Focus opens on the element marked `data-initial-focus` (the safe choice,
   usually Cancel) when there is one, not on whatever control happens to
   come first in the markup. */

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({ className, children, initialFocus, ...props }: DialogPrimitive.Popup.Props) {
  const popup = useRef<HTMLDivElement>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 min-h-dvh bg-black/30 transition-opacity duration-150",
          "data-starting-style:opacity-0 data-ending-style:opacity-0",
          // iOS Safari: a fixed backdrop leaves a gap under the toolbar.
          "supports-[-webkit-touch-callout:none]:absolute",
        )}
      />
      <DialogPrimitive.Popup
        ref={popup}
        initialFocus={initialFocus ?? (() => popup.current?.querySelector<HTMLElement>("[data-initial-focus]") ?? true)}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col",
          "rounded-xl border border-transparent bg-popover text-popover-foreground outline-none",
          "shadow-[0_0_0_1px_--alpha(var(--color-black)/6%),0_1px_2px_-1px_--alpha(var(--color-black)/6%),0_16px_48px_-12px_--alpha(var(--color-black)/24%)]",
          "transition-[opacity,scale] duration-200 ease-out",
          "data-starting-style:scale-95 data-starting-style:opacity-0",
          "data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150",
          "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 px-5 pt-5 pb-4", className)} {...props} />;
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 pb-5", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2 rounded-b-[inherit] border-t border-border bg-muted/60 px-5 py-3", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title className={cn("text-base font-semibold tracking-[-0.01em] text-foreground", className)} {...props} />;
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description className={cn("text-sm leading-[1.5] text-muted-foreground", className)} {...props} />;
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
};
