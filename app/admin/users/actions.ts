"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setUserRole } from "@/lib/applications";
import { assertRole, Unauthorized } from "@/lib/auth";
import { ROLES } from "@/lib/auth-roles";
import type { UserRole } from "@/lib/db/schema";

const schema = z.object({
  userId: z.uuid(),
  role: z.enum(ROLES as [UserRole, ...UserRole[]]),
});

export async function setRoleAction(formData: FormData): Promise<void> {
  let actor;
  try {
    actor = await assertRole("superadmin");
  } catch (error) {
    if (error instanceof Unauthorized) return;
    throw error;
  }
  const parsed = schema.safeParse({ userId: formData.get("userId"), role: formData.get("role") });
  if (!parsed.success) return;
  try {
    await setUserRole({ actorId: actor.id, userId: parsed.data.userId, role: parsed.data.role });
  } catch (error) {
    if ((error as Error).message === "CANNOT_CHANGE_OWN_ROLE") return;
    throw error;
  }
  revalidatePath("/admin/users");
}
