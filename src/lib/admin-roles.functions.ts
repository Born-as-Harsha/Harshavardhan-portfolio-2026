/**
 * User / role management for the admin dashboard. Every call re-checks the
 * caller's admin role through has_role() on their own RLS client before any
 * privileged client is loaded, and every change is written to the audit chain.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, type AuthedContext } from "./audit-rbac";

export type ManagedUser = { id: string; email: string | null; createdAt: string; roles: string[] };

export const listManagedUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    const ctx = context as unknown as AuthedContext;
    await assertAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error("Unable to list users");
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
      roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role as string),
    }));
  });

const roleChange = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "moderator", "user"]),
  grant: z.boolean(),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => roleChange.parse(input))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    await assertAdmin(ctx);
    if (!data.grant && data.role === "admin" && data.userId === ctx.userId) {
      throw new Error("You cannot remove your own administrator role.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditEvent } = await import("./audit.server");
    const op = data.grant
      ? supabaseAdmin.from("user_roles").upsert(
          { user_id: data.userId, role: data.role },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        )
      : supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
    const { error } = await op;
    await writeAuditEvent({
      action: data.grant ? "role.grant" : "role.revoke",
      resourceType: "user_role",
      outcome: error ? "error" : "allow",
      actorId: ctx.userId,
      actorEmail: ctx.claims?.email ?? null,
      resourceId: data.userId,
      context: { role: data.role },
    });
    if (error) throw new Error("Role change failed");
    return { ok: true };
  });
