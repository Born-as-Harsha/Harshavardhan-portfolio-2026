/**
 * First-run administrator bootstrap.
 *
 * The decision is made entirely inside the database function
 * `claim_admin_bootstrap()`, which takes an advisory lock, refuses once any
 * admin already exists, and writes an audit record for both outcomes. The
 * client can therefore never talk itself into the admin role: it only asks,
 * and the database answers.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AuthedContext } from "./audit-rbac";

export type BootstrapStatus = { available: boolean };
export type BootstrapResult = { granted: boolean; reason?: string };

/** Is first-run setup still open (i.e. no administrator exists yet)? */
export const adminBootstrapAvailable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BootstrapStatus> => {
    const ctx = context as unknown as AuthedContext;
    const { data, error } = await ctx.supabase.rpc("admin_bootstrap_available", {});
    if (error) return { available: false };
    return { available: data === true };
  });

/** Claims the administrator role for the signed-in caller, once, audited. */
export const claimAdminBootstrap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BootstrapResult> => {
    const ctx = context as unknown as AuthedContext;
    const { data, error } = await ctx.supabase.rpc("claim_admin_bootstrap", {});
    if (error) return { granted: false, reason: "unavailable" };
    const result = (data ?? {}) as BootstrapResult;
    return { granted: result.granted === true, ...(result.reason ? { reason: result.reason } : {}) };
  });
