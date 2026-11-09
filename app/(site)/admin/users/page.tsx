import type { Metadata } from "next";
import { Suspense } from "react";
import { StatusBadge } from "@/components/admin/status-badge";
import { card, cardInner } from "@/components/convention/section-heading";
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
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading users…</p>}>
      <UsersList />
    </Suspense>
  );
}

/* Superadmins only. Each row is its own form: pick a role, press Save.
   Your own row is read-only, so nobody locks themself out. */
async function UsersList() {
  const me = await requireRole("superadmin", "/admin/users");
  const rows = await listUsers();

  return (
    <>
      <p className="mb-6 max-w-[58ch] text-sm text-muted-foreground">
        Everyone who has signed in. Members can only see their own application; admins can review
        applications; superadmins can also change roles here.
      </p>
      <div className={card}>
        <div className={cn(cardInner, "overflow-x-auto")}>
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground">
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Application</th>
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
                    <td className="px-4 py-3">
                      {row.applicationStatus ? <StatusBadge status={row.applicationStatus} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3">
                      {self ? (
                        <span className="text-foreground">{row.role}</span>
                      ) : (
                        <form action={setRoleAction} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={row.id} />
                          <label className="sr-only" htmlFor={`role-${row.id}`}>
                            Role for {row.email}
                          </label>
                          <select
                            id={`role-${row.id}`}
                            name="role"
                            defaultValue={row.role}
                            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
      </div>
    </>
  );
}
