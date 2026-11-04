"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-9 select-none items-center rounded-full px-3.5 text-sm font-medium",
                // Hover is seen tens of times a day: a near-imperceptible color
                // change only. Tailwind v4 already gates hover: behind
                // (hover: hover).
                "text-muted-foreground transition-[color,background-color,transform] duration-150 ease-hover",
                "hover:bg-muted hover:text-foreground",
                // Press feedback: the interface heard the tap.
                "active:scale-[0.97]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active && "text-foreground",
              )}
            >
              {item.label}
              {/* Golden dot marks the current section. Static; it never animates. */}
              <span
                aria-hidden
                className={cn(
                  "absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-golden transition-opacity duration-150 ease-hover",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
