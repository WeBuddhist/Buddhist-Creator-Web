"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer } from "@base-ui/react/drawer";
import {
  ArrowSquareOutIcon,
  CaretRightIcon,
  ChatTeardropTextIcon,
  ClipboardTextIcon,
  HouseIcon,
  ListIcon,
  TrayIcon,
  UsersThreeIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AccountMenu } from "@/components/account-menu";
import { ExportMenu, type ExportCounts } from "@/components/admin/export-menu";
import type { CurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth-roles";
import { SITE_NAME } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import logoMark from "@/public/logo-mark.png";

/* The dashboard's chrome: a sidebar down the left on a wide screen, a bar
   across the top of the content, and on a phone the same sidebar in a
   drawer behind a menu button in that bar. Every piece reads the route to
   mark the current section, so the whole file is client code; the layout
   hands it the signed-in user, or null while access is still being
   checked, and it draws placeholders for the parts that need one. */

const REGISTER = "/convention/2027/register";

type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  /** Which routes light this item up; defaults to the href and below. */
  match?: (pathname: string) => boolean;
  /** Superadmins only. */
  superadmin?: true;
  external?: true;
};

const WORKSPACE: NavItem[] = [
  {
    href: "/admin",
    label: "Applications",
    icon: TrayIcon,
    match: (p) => p === "/admin" || p.startsWith("/admin/applications"),
  },
  { href: "/admin/suggestions", label: "Suggestions", icon: ChatTeardropTextIcon },
  { href: "/admin/users", label: "Users & roles", icon: UsersThreeIcon, superadmin: true },
];

const SITE: NavItem[] = [
  { href: "/", label: "Website", icon: HouseIcon, external: true },
  { href: REGISTER, label: "Registration page", icon: ClipboardTextIcon, external: true },
];

/* A nav row. The current one sits on a soft fill with dark ink and icon;
   the rest keep grey icons so the labels lead. Radius 8px, in a 12px
   gutter, so the rows never nest inside another rounded surface. */
const row = cn(
  "flex h-10 select-none items-center gap-3 rounded-lg px-3 text-sm font-medium",
  "transition-[background-color,color,transform] duration-150 ease-hover",
  "hover:bg-muted active:scale-[0.99]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

function NavGroup({
  label,
  items,
  user,
  pathname,
  className,
}: {
  label: string;
  items: NavItem[];
  user: CurrentUser | null;
  pathname: string;
  className?: string;
}) {
  const shown = items.filter((item) => !item.superadmin || hasRole(user, "superadmin"));
  const id = `admin-nav-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p id={id} className="px-3 pt-4 pb-1 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <ul aria-labelledby={id} className="flex flex-col gap-0.5">
        {shown.map((item) => {
          const active = !item.external && (item.match ? item.match(pathname) : pathname.startsWith(item.href));
          const ItemIcon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(row, active ? "bg-muted text-foreground" : "text-foreground/80 hover:text-foreground")}
              >
                <ItemIcon
                  aria-hidden
                  weight={active ? "fill" : "regular"}
                  className={cn("size-5 shrink-0", active ? "text-foreground" : "text-muted-foreground")}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.external && (
                  <ArrowSquareOutIcon aria-hidden weight="bold" className="size-3.5 shrink-0 text-muted-foreground/70" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* What both the sidebar and the drawer hold: the mark, the groups of
   links and, at the foot, the signed-in person as a menu. */
function SidebarContent({ user, trailing }: { user: CurrentUser | null; trailing?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 ps-4 pe-3">
        <Link
          href="/admin"
          aria-label={`${SITE_NAME} admin home`}
          className={cn(
            "group flex min-w-0 select-none items-center gap-2.5 rounded-full py-1 pe-2 -ms-1 ps-1",
            "transition-transform duration-[160ms] ease-out active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          <Image src={logoMark} alt="" width={80} height={80} className="size-9 shrink-0" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold tracking-[-0.01em] text-foreground">{SITE_NAME}</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </span>
        </Link>
        {trailing}
      </div>

      {/* The workspace links at the top; the links off the dashboard sit at
          the foot, just above the account, so the dashboard's own sections
          come first and the way out is where a hand expects it. */}
      <nav aria-label="Dashboard" className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-3 pb-4">
        <NavGroup label="Convention 2027" items={WORKSPACE} user={user} pathname={pathname} />
        <NavGroup label="Site" items={SITE} user={user} pathname={pathname} className="mt-auto" />
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        {user ? (
          <AccountMenu
            appearance="card"
            name={user.name}
            email={user.email}
            picture={user.picture}
            role={user.role}
            applicationHref={REGISTER}
          />
        ) : (
          <div aria-hidden="true" className="flex items-center gap-3 p-2">
            <span className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="block h-3.5 w-28 animate-pulse rounded bg-muted" />
              <span className="block h-3 w-16 animate-pulse rounded bg-muted opacity-70" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* The sidebar proper: fixed to the viewport's height, scrolling its own
   links, from the large breakpoint up. */
export function AdminSidebar({ user }: { user: CurrentUser | null }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-68 shrink-0 flex-col self-start border-e border-border bg-sidebar lg:flex">
      <SidebarContent user={user} />
    </aside>
  );
}

const iconButton = cn(
  "inline-flex size-10 select-none items-center justify-center rounded-full text-foreground",
  "transition-[background-color,transform] duration-150 ease-hover hover:bg-muted active:scale-[0.95]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

/* The sidebar as a drawer from the leading edge, for narrow screens. The
   motion is the site's mobile nav mirrored (components/mobile-nav.tsx). */
function MobileMenu({ user }: { user: CurrentUser | null }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Close once navigation lands, derived in render rather than an effect.
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} swipeDirection="left">
      <Drawer.Trigger className={cn(iconButton, "-ms-2 lg:hidden")} aria-label="Open menu">
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
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-stretch justify-start">
          <Drawer.Popup
            className={cn(
              "[--bleed:3rem] relative -ms-[3rem] flex h-full w-[calc(min(20rem,100vw-3.5rem)+3rem)] flex-col",
              "bg-sidebar ps-[3rem] text-foreground outline-none",
              "border-e border-border shadow-[24px_0_48px_-24px] shadow-black/20",
              "pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]",
              "overflow-y-auto overscroll-contain touch-auto",
              "[transform:translateX(var(--drawer-swipe-movement-x))]",
              "transition-transform duration-[450ms] ease-drawer",
              "data-starting-style:[transform:translateX(calc(-100%+var(--bleed)-2px))]",
              "data-ending-style:[transform:translateX(calc(-100%+var(--bleed)-2px))]",
              "data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
              "data-swiping:select-none",
              "motion-reduce:transition-opacity motion-reduce:duration-200 motion-reduce:ease-hover",
              "motion-reduce:data-starting-style:opacity-0 motion-reduce:data-starting-style:transform-none",
              "motion-reduce:data-ending-style:opacity-0 motion-reduce:data-ending-style:transform-none",
            )}
          >
            <Drawer.Content className="flex flex-1 flex-col">
              <Drawer.Title className="sr-only">Dashboard menu</Drawer.Title>
              <SidebarContent
                user={user}
                trailing={
                  <Drawer.Close className={iconButton} aria-label="Close menu">
                    <XIcon className="size-5" />
                  </Drawer.Close>
                }
              />
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/* Where the reader is, from the route: the section, and under it the
   record. Short enough to sit in the bar beside the menu button. */
function Breadcrumb() {
  const pathname = usePathname();
  const crumbs: { label: string; href?: string }[] = pathname.startsWith("/admin/users")
    ? [{ label: "Users & roles" }]
    : pathname.startsWith("/admin/suggestions")
      ? [{ label: "Suggestions" }]
      : pathname.startsWith("/admin/applications/")
      ? [{ label: "Applications", href: "/admin" }, { label: "Application" }]
      : [{ label: "Applications" }];
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.label} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && <CaretRightIcon aria-hidden weight="bold" className="size-3 shrink-0 text-muted-foreground/60" />}
              {crumb.href && !last ? (
                <Link
                  href={crumb.href}
                  className="truncate rounded text-muted-foreground transition-[color] duration-150 ease-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", last ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* The bar over the content. It is sticky and 4rem tall like the site's
   header, so --header-height from globals.css still describes it and the
   detail page's sticky column sits under it. */
export function AdminTopbar({ user, exportCounts }: { user: CurrentUser | null; exportCounts: ExportCounts | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 pt-[env(safe-area-inset-top,0px)] backdrop-blur-sm reduced-transparency:bg-background reduced-transparency:backdrop-blur-none">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <MobileMenu user={user} />
          <Breadcrumb />
        </div>
        <ExportMenu counts={exportCounts} />
      </div>
    </header>
  );
}
