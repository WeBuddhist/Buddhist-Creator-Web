import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { HeaderTone } from "@/components/header-tone";
import { SITE_NAME } from "@/lib/navigation";
import logoMark from "@/public/logo-mark.png";

export function SiteHeader() {
  return (
    <header
      className={[
        "site-header sticky top-0 z-40 w-full",
        // The text and the frosted surface take their colour from the section
        // beneath, see the header tone tokens in globals.css.
        "pt-[env(safe-area-inset-top,0px)]",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          aria-label={`${SITE_NAME} home`}
          className={[
            "group flex select-none items-center gap-2.5 rounded-full py-1 pr-2 -ml-1 pl-1",
            "transition-transform duration-[160ms] ease-out active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--header-ring)",
          ].join(" ")}
        >
          {/* No blur placeholder: .site-logo's filter applies to it too, which
              leaves a smudge beside the name on every page. */}
          <Image
            src={logoMark}
            alt=""
            width={80}
            height={80}
            preload
            className="site-logo size-10"
          />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-(--header-fg) transition-[color] duration-150 ease-hover">
            {SITE_NAME}
          </span>
        </Link>

        <div className="hidden md:block">
          <NavLinks />
        </div>

        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
      <HeaderTone />
    </header>
  );
}
