import Image from "next/image";
import Link from "next/link";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { SITE_NAME } from "@/lib/navigation";

export function SiteHeader() {
  return (
    <header
      className={[
        "sticky top-0 z-40 w-full",
        "bg-background",
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
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          ].join(" ")}
        >
          {/* The JPG has a white background; multiply hides it on any light
              surface, invert+screen does the same in dark mode. */}
          <Image
            src="/logo.jpg"
            alt=""
            width={40}
            height={40}
            preload
            className="size-10 mix-blend-multiply dark:invert dark:mix-blend-screen"
          />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            {SITE_NAME}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <NavLinks />
        </nav>

        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
