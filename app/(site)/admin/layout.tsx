import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Buddhist Creators" },
  robots: { index: false, follow: false },
};

/* Every admin page depends on the session and, under /applications/[id],
   on the URL, so there is no static shell worth prefetching: let the
   segment block on the server instead of flagging it at build time. */
export const instant = false;

/* The dashboard frame. The role check reads the session, so it sits in a
   child behind a <Suspense> boundary rather than at the layout's top
   level. Each page checks again: a layout is not a guard. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Checking access…</p>}>
          <AdminShell>{children}</AdminShell>
        </Suspense>
      </div>
    </main>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin", "/admin");
  return (
    <>
      <AdminNav user={user} />
      {children}
    </>
  );
}
