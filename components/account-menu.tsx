"use client";

import * as React from "react";
import NextLink from "next/link";
import { Menu } from "@base-ui/react/menu";
import { CaretUpDownIcon, FileTextIcon, ShieldCheckIcon, SignOutIcon, UserCircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* The signed-in corner of the header: the reader's photo, from whichever
   identity provider they signed in with, opens a small menu with their
   name, their application and sign out. The name lives in the trigger's
   accessible label, never beside the photo. The popup borrows the
   Convention dropdown's surface and motion from nav-links.tsx so the two
   menus read as one family.

   The admin dashboard uses the same menu at the foot of its sidebar, with
   appearance="card": the trigger is then a full-width row showing the
   photo, the name and the role, and the popup opens upward from it. */

/* A 40px round hit area holding a 36px photo. Hover and open fill the 2px
   of slack as a halo in the header's hover tone. */
const trigger = cn(
  "inline-flex size-10 shrink-0 select-none items-center justify-center rounded-full p-0.5",
  "text-(--header-fg) transition-[background-color,transform] duration-150 ease-hover",
  "hover:bg-(--header-hover) data-popup-open:bg-(--header-hover) active:scale-[0.95]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--header-ring)",
);

/* The sidebar row. Radius 8px = the popup items' 8px; it sits in a 12px
   gutter so nothing nests inside it. */
const cardTrigger = cn(
  "flex w-full select-none items-center gap-3 rounded-lg p-2 text-start",
  "transition-[background-color,transform] duration-150 ease-hover",
  "hover:bg-muted data-popup-open:bg-muted active:scale-[0.99]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

const item = cn(
  "flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground",
  "transition-[background-color] duration-150 ease-hover data-highlighted:bg-muted",
  // The muted fill alone is too faint to mark keyboard focus. No
  // `outline-none`: in Tailwind 4 it would also blank the ring's style.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

/* The provider's photo, or the generic icon when there is none or it fails
   to load. A plain img rather than next/image: avatar hosts differ per
   provider (Google, GitHub, Auth0's own), and none is worth a remote
   pattern for a 36px picture. No referrer, since Google's CDN refuses some
   cross-site requests that carry one. */
function Avatar({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = React.useState(false);
  if (!src || failed) {
    return <UserCircleIcon className={cn("size-full", className)} weight="bold" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("size-full rounded-full object-cover outline -outline-offset-1 outline-black/10", className)}
    />
  );
}

export function AccountMenu({
  name,
  email,
  picture,
  applicationHref,
  adminHref,
  appearance = "avatar",
  role,
}: {
  name: string | null;
  email: string;
  picture: string | null;
  applicationHref: string;
  /** Set for admins only; adds the dashboard link above sign out. */
  adminHref?: string;
  /** "avatar" is the header's round photo; "card" the sidebar row. */
  appearance?: "avatar" | "card";
  /** Shown under the name on the card trigger, as on the dashboard. */
  role?: string;
}) {
  const card = appearance === "card";
  return (
    <Menu.Root>
      {card ? (
        <Menu.Trigger className={cardTrigger} aria-label={`Account: ${name ?? email}`}>
          <span className="size-8 shrink-0 text-muted-foreground">
            <Avatar src={picture} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">{name ?? email}</span>
            <span className="truncate text-xs text-muted-foreground capitalize">{role ?? email}</span>
          </span>
          <CaretUpDownIcon className="size-4 shrink-0 text-muted-foreground" weight="bold" aria-hidden />
        </Menu.Trigger>
      ) : (
        <Menu.Trigger className={trigger} aria-label={`Account: ${name ?? email}`}>
          <span className="size-9">
            <Avatar src={picture} />
          </span>
        </Menu.Trigger>
      )}

      <Menu.Portal>
        <Menu.Positioner
          side={card ? "top" : "bottom"}
          align={card ? "start" : "end"}
          sideOffset={8}
          collisionPadding={16}
          className="z-50"
        >
          <Menu.Popup
            className={cn(
              "origin-(--transform-origin) p-1.5",
              // In the sidebar the popup takes the trigger's width, so the
              // two read as one control opening.
              card ? "w-(--anchor-width) min-w-60" : "w-60",
              // Outer radius 12px = inner 8px + 4px, concentric with the items.
              "rounded-xl border border-transparent bg-popover text-popover-foreground outline-none",
              "shadow-[0_0_0_1px_--alpha(var(--color-black)/6%),0_1px_2px_-1px_--alpha(var(--color-black)/6%),0_8px_24px_-8px_--alpha(var(--color-black)/12%)]",
              "transition-[opacity,scale] duration-200 ease-out",
              "data-starting-style:scale-95 data-starting-style:opacity-0",
              "data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-150",
              "motion-reduce:data-starting-style:scale-100 motion-reduce:data-ending-style:scale-100",
            )}
          >
            <Menu.Group>
              {/* The card trigger already shows the photo, so its popup
                  carries the name and address alone. */}
              <Menu.GroupLabel className="flex items-center gap-3 px-3 pt-2 pb-2.5">
                {!card && (
                  <span className="size-9 shrink-0 text-muted-foreground">
                    <Avatar src={picture} />
                  </span>
                )}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">{name ?? email}</span>
                  {name && <span className="truncate text-xs text-muted-foreground">{email}</span>}
                </span>
              </Menu.GroupLabel>
              {adminHref && (
                <Menu.LinkItem closeOnClick render={<NextLink href={adminHref} />} className={item}>
                  <ShieldCheckIcon className="size-4 text-muted-foreground" weight="bold" aria-hidden />
                  Admin Dashboard
                </Menu.LinkItem>
              )}
              <Menu.LinkItem closeOnClick render={<NextLink href={applicationHref} />} className={item}>
                <FileTextIcon className="size-4 text-muted-foreground" weight="bold" aria-hidden />
                Registration
              </Menu.LinkItem>
              <Menu.Separator className="mx-1.5 mb-1.5 h-px bg-border" />

              {/* A plain anchor: the SDK serves /auth/logout, so it must not be prefetched. */}
              <Menu.LinkItem closeOnClick href="/auth/logout" className={item}>
                <SignOutIcon className="size-4 text-muted-foreground" weight="bold" aria-hidden />
                Sign out
              </Menu.LinkItem>
            </Menu.Group>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
