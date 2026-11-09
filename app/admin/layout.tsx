import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSidebar, AdminTopbar } from "@/components/admin/admin-shell";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Buddhist Creators" },
  robots: { index: false, follow: false },
};

/* Every admin page depends on the session and, under /applications/[id],
   on the URL, so there is no static shell worth prefetching: let the
   segment block on the server instead of flagging it at build time. */
export const instant = false;

/* The dashboard. It sits outside the (site) group, so there is no site
   header or footer: the sidebar and the top bar are the whole chrome.
   The role check reads the session, so it runs in a child behind a
   <Suspense> boundary; until it settles the same frame shows with a
   placeholder where the person goes. Each page checks again: a layout is
   not a guard. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <AdminFrame user={null}>
          <p className="text-sm text-muted-foreground">Checking access…</p>
        </AdminFrame>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin", "/admin");
  return <AdminFrame user={user}>{children}</AdminFrame>;
}

function AdminFrame({ user, children }: { user: Awaited<ReturnType<typeof requireRole>> | null; children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 bg-background">
      <AdminSidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[80rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
