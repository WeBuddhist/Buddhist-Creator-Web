"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "@base-ui/react/drawer";
import { ArrowUpRightIcon, ListIcon, XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, SITE_NAME } from "@/lib/navigation";

const iconButton = cn(
  "inline-flex size-10 select-none items-center justify-center rounded-full",
  "transition-[background-color,transform] duration-150 ease-hover",
  "active:scale-[0.95]",
  "focus-visible:outline-2 focus-visible:outline-offset-2",
);
// The trigger lives in the header and follows its tone; the close button
// sits in the white drawer and keeps the page tokens.
const triggerButton = cn(
  iconButton,
  "text-(--header-fg) hover:bg-(--header-hover) focus-visible:outline-(--header-ring)",
);
const closeButton = cn(
  iconButton,
  "text-foreground hover:bg-muted focus-visible:outline-ring",
);

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close the sheet once navigation lands on the new route. Derived during
  // render rather than in an effect, so there is no extra render pass.
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} swipeDirection="right">
      <Drawer.Trigger className={triggerButton} aria-label="Open menu">
        <ListIcon className="size-5" />
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Backdrop
          className={cn(
            "fixed inset-0 z-50 min-h-dvh bg-black supports-[-webkit-touch-callout:none]:absolute",
            "[--backdrop-opacity:0.25]",
            "opacity-[calc(var(--backdrop-opacity)*(1-var(--drawer-swipe-progress)))]",
            "transition-opacity duration-[450ms] ease-drawer",
            "data-starting-style:opacity-0 data-ending-style:opacity-0",
            "data-swiping:duration-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
          )}
        />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-stretch justify-end">
          <Drawer.Popup
            className={cn(
              // --bleed lets the panel overshoot the edge during a swipe without
              // exposing a gap behind it.
              "[--bleed:3rem] relative -mr-[3rem] flex h-full w-[calc(min(20rem,100vw-3.5rem)+3rem)] flex-col",
              "bg-background pr-[3rem] text-foreground outline-none",
              "border-l border-border shadow-[-24px_0_48px_-24px] shadow-black/20",
              "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]",
              "overflow-y-auto overscroll-contain touch-auto",
              // Tracks the finger 1:1 while swiping, then settles on the
              // iOS drawer curve. Exits the way it entered: to the right.
              "[transform:translateX(var(--drawer-swipe-movement-x))]",
              "transition-transform duration-[450ms] ease-drawer",
              "data-starting-style:[transform:translateX(calc(100%-var(--bleed)+2px))]",
              "data-ending-style:[transform:translateX(calc(100%-var(--bleed)+2px))]",
              "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
              "data-swiping:select-none",
              // Reduced motion: crossfade instead of slide.
              "motion-reduce:transition-opacity motion-reduce:duration-200 motion-reduce:ease-hover",
              "motion-reduce:data-starting-style:opacity-0 motion-reduce:data-starting-style:transform-none",
              "motion-reduce:data-ending-style:opacity-0 motion-reduce:data-ending-style:transform-none",
            )}
          >
            <Drawer.Content className="flex flex-1 flex-col">
              <div className="flex h-16 items-center justify-between pl-5 pr-3">
                <Drawer.Title className="text-sm font-medium text-muted-foreground">
                  {SITE_NAME}
                </Drawer.Title>
                <Drawer.Close className={closeButton} aria-label="Close menu">
                  <XIcon className="size-5" />
                </Drawer.Close>
              </div>

              <nav aria-label="Mobile" className="px-3 pt-2">
                <ul className="flex flex-col">
                  {NAV_ITEMS.map((item, index) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <li
                        key={item.href}
                        // Stagger is decorative: 40ms apart, never blocks taps.
                        style={{ animationDelay: `${index * 40}ms` }}
                        className={cn(
                          "animate-in fade-in slide-in-from-right-2 fill-mode-both duration-300 ease-out",
                          "motion-reduce:slide-in-from-right-0",
                        )}
                      >
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-13 select-none items-center justify-between rounded-xl px-3 text-lg font-medium tracking-[-0.01em]",
                            "transition-[background-color,transform] duration-150 ease-hover",
                            "active:scale-[0.98] active:bg-muted",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                            // The current section sits on a soft pill, matching the
                            // header; aria-current carries it to assistive tech.
                            active ? "bg-muted text-foreground" : "text-foreground/80",
                          )}
                        >
                          {item.label}
                        </Link>
                        {item.children && (
                          <ul className="mb-2 flex flex-col">
                            {item.children.map((child) => {
                              const childActive =
                                !child.external &&
                                (pathname === child.href ||
                                  pathname.startsWith(`${child.href}/`));
                              const childClass = cn(
                                "flex min-h-11 select-none items-center justify-between gap-3 rounded-xl py-2 ps-6 pe-3 text-base font-medium leading-[1.3]",
                                "transition-[background-color,transform] duration-150 ease-hover",
                                "active:scale-[0.98] active:bg-muted",
                                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                                childActive ? "bg-muted text-foreground" : "text-muted-foreground",
                              );
                              return (
                                <li key={child.href}>
                                  {child.external ? (
                                    <a
                                      href={child.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={childClass}
                                    >
                                      {child.label}
                                      <ArrowUpRightIcon
                                        aria-hidden
                                        className="size-4 shrink-0"
                                        weight="bold"
                                      />
                                      <span className="sr-only">(opens in new tab)</span>
                                    </a>
                                  ) : (
                                    <Link
                                      href={child.href}
                                      aria-current={childActive ? "page" : undefined}
                                      className={childClass}
                                    >
                                      {child.label}
                                    </Link>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
