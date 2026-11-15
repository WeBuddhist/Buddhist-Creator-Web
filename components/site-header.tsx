import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";
import { HeaderTone } from "@/components/header-tone";
import { REGISTRATION } from "@/lib/convention-2027";
import { SITE_NAME } from "@/lib/navigation";
import logoMark from "@/public/logo-mark.png";

/* A frosted bar, floating a little below the top edge and narrower than the
   page, so photographs and cyan sheets show around and faintly through it.
   It takes its tone from what it floats over: light over paper, the
   band's own colour with white text over a photograph, a cyan sheet or the
   footer (HeaderTone, and the tokens in globals.css). The strip it floats in lets clicks
   through; only the bar takes them. On a phone there is no room to float:
   the bar runs edge to edge from the very top, square, with a line along
   its foot, and reaches up under the notch. */
export function SiteHeader() {
  return (
    <header className="site-header pointer-events-none sticky top-0 z-40 w-full sm:px-3 sm:pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
      <div className="pointer-events-auto mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 rounded-full border border-(--header-border) bg-(--header-surface) transition-[background-color,border-color] duration-200 ease-hover ps-2.5 pe-2 shadow-[0_1px_2px_rgb(18_34_42/0.04),0_6px_20px_-12px_rgb(18_34_42/0.14)] max-sm:shadow-none backdrop-blur-md reduced-transparency:bg-(--header-solid) reduced-transparency:backdrop-blur-none max-sm:h-[calc(3.5rem+env(safe-area-inset-top,0px))] max-sm:rounded-none max-sm:border-x-0 max-sm:border-t-0 max-sm:px-3 max-sm:pt-[env(safe-area-inset-top,0px)] sm:ps-3">
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className={[
            "group flex select-none items-center gap-2 rounded-full py-1 ps-1 pe-1 sm:pe-3",
            "transition-transform duration-[160ms] ease-out active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--header-ring)",
          ].join(" ")}
        >
          <Image
            src={logoMark}
            alt=""
            width={80}
            height={80}
            preload
            className="size-9 [filter:var(--header-logo-filter)] transition-[filter] duration-200 ease-hover"
          />
          {/* On a phone the bar shows the mark alone; the link keeps its
              name through aria-label. */}
          <span className="hidden font-display text-[1.375rem] leading-none text-(--header-fg) transition-[color] duration-200 ease-hover sm:inline">
            {SITE_NAME}
          </span>
        </Link>

        <div className="flex items-center gap-0.5 md:gap-1">
          <div className="hidden md:block">
            <NavLinks />
          </div>

          {/* Reads the session, so it streams in behind the boundary; the
              rest of the header is part of the static shell. */}
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>

          {/* The one thing the site most wants a visitor to do. Between md
              and lg the nav needs the room, so it steps aside there. */}
          {REGISTRATION.open && (
            <Link
              href="/convention/2027"
              className={[
                "hidden h-10 select-none items-center rounded-full bg-(--header-cta) px-4 text-sm font-medium text-(--header-cta-fg) sm:inline-flex md:hidden lg:inline-flex",
                "transition-[background-color,color,transform] duration-150 ease-hover hover:bg-(--header-cta-hover) active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--header-ring)",
              ].join(" ")}
            >
              {REGISTRATION.label}
            </Link>
          )}

          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
      <HeaderTone />
    </header>
  );
}
