"use client";

import * as React from "react";
import NextLink from "next/link";
import { Menu } from "@base-ui/react/menu";
import { FileTextIcon, ShieldCheckIcon, SignOutIcon, UserCircleIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* The signed-in corner of the header: the reader's photo, from whichever
   identity provider they signed in with, opens a small menu with their
   name, their application and sign out. The name lives in the trigger's
   accessible label, never beside the photo. The popup borrows the
   Convention dropdown's surface and motion from nav-links.tsx so the two
   menus read as one family. */

/* A 40px round hit area holding a 36px photo. Hover and open fill the 2px
   of slack as a halo in the header's hover tone. */
const trigger = cn(
  "inline-flex size-10 shrink-0 select-none items-center justify-center rounded-full p-0.5",
  "text-(--header-fg) transition-[background-color,transform] duration-150 ease-hover",
  "hover:bg-(--header-hover) data-popup-open:bg-(--header-hover) active:scale-[0.95]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--header-ring)",
);

const item = cn(
  "flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground outline-none",
  "transition-[background-color] duration-150 ease-hover data-highlighted:bg-muted",
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
}: {
  name: string | null;
  email: string;
  picture: string | null;
  applicationHref: string;
  /** Set for admins only; adds the dashboard link above sign out. */
  adminHref?: string;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger className={trigger} aria-label={`Account: ${name ?? email}`}>
        <span className="size-9">
          <Avatar src={picture} />
        </span>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={16} className="z-50">
          <Menu.Popup
            className={cn(
              "w-60 origin-(--transform-origin) p-1.5",
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
              <Menu.GroupLabel className="flex items-center gap-3 px-3 pt-2 pb-2.5">
                <span className="size-9 shrink-0 text-muted-foreground">
                  <Avatar src={picture} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">{name ?? email}</span>
                  {name && <span className="truncate text-xs text-muted-foreground">{email}</span>}
                </span>
              </Menu.GroupLabel>
              {adminHref && (
                <Menu.LinkItem closeOnClick render={<NextLink href={adminHref} />} className={item}>
                  <ShieldCheckIcon className="size-4 text-muted-foreground" weight="bold" aria-hidden />
                  Admin dashboard
                </Menu.LinkItem>
              )}
              <Menu.LinkItem closeOnClick render={<NextLink href={applicationHref} />} className={item}>
                <FileTextIcon className="size-4 text-muted-foreground" weight="bold" aria-hidden />
                My application
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
