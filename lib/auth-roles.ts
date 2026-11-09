import type { UserRole } from "@/lib/db/schema";

/* The role ladder, shared by the server (lib/auth.ts) and client
   components that only need to decide what to show. */

export const ROLES: readonly UserRole[] = ["member", "admin", "superadmin"];

const RANK: Record<UserRole, number> = { member: 0, admin: 1, superadmin: 2 };

export function hasRole(user: { role: UserRole } | null | undefined, role: UserRole) {
  return !!user && RANK[user.role] >= RANK[role];
}
