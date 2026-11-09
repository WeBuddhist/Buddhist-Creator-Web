import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { panel } from "@/components/admin/panel";
import { Button } from "@/components/ui/button";
import { listUsers } from "@/lib/applications";
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/auth-roles";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { setRoleAction } from "./actions";

export const metadata: Metadata = { title: "Users & roles" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users & roles"
        description="Everyone who has signed in. Members can only see their own application; admins can review applications; superadmins can also change roles here."
        className="mb-6"
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading users…</p>}>
        <UsersList />
      </Suspense>
    </>
  );
}

/* Superadmins only. Each row is its own form: pick a role, press Save.
   Your own row is read-only, so nobody locks themself out. */
async function UsersList() {
  const me = await requireRole("superadmin", "/admin/users");
  const rows = await listUsers();

  return (
    <div className={cn(panel, "overflow-x-auto")}>
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
            <th scope="col" className="px-4 py-3">User</th>
            <th scope="col" className="px-4 py-3">Joined</th>
            <th scope="col" className="px-4 py-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const self = row.id === me.id;
            return (
              <tr key={row.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{row.name ?? row.email}</div>
                  <div className="text-xs text-muted-foreground">{row.email}{self ? " (you)" : ""}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3">
                  {self ? (
                    <span className="text-foreground capitalize">{row.role}</span>
                  ) : (
                    <form action={setRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={row.id} />
                      <label className="sr-only" htmlFor={`role-${row.id}`}>
                        Role for {row.email}
                      </label>
                      {/* The select is uncontrolled, so React applies defaultValue
                          on mount only and resets the form to it once the action
                          is done. Keying on the role mounts a fresh select when the
                          saved role changes, so the row shows what was saved. */}
                      <select
                        key={row.role}
                        id={`role-${row.id}`}
                        name="role"
                        defaultValue={row.role}
                        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground capitalize outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
