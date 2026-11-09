"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth-roles";
import { cn } from "@/lib/utils";

const pill = cn(
  "inline-flex h-9 select-none items-center rounded-full px-3.5 text-sm font-medium",
  "text-muted-foreground transition-[color,background-color] duration-150 ease-hover hover:bg-muted hover:text-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
);

export function AdminNav({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Applications", active: pathname === "/admin" || pathname.startsWith("/admin/applications") },
    ...(hasRole(user, "superadmin")
      ? [{ href: "/admin/users", label: "Users & roles", active: pathname.startsWith("/admin/users") }]
      : []),
  ];
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.05em] text-brand-cyan">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground">Convention 2027 applications</h1>
      </div>
      <nav aria-label="Admin" className="flex items-center gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(pill, item.active && "bg-muted text-foreground")}
          >
            {item.label}
          </Link>
        ))}
        <span className="ml-2 hidden text-sm text-muted-foreground sm:inline" title={user.email}>
          {user.name ?? user.email} · {user.role}
        </span>
      </nav>
    </header>
  );
}
