/**
 * Admin audit APIs. Every function re-checks the caller's role server-side
 * through `has_role()` after `requireSupabaseAuth`; the route guard is UX only.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  applyAuditFilter,
  auditFilterSchema,
  encodeCursor,
  type AuditEvent,
} from "./audit-query";
import { assertAdmin, type AuthedContext } from "./audit-rbac";

export { assertAdmin, ForbiddenError } from "./audit-rbac";

export const listAuditEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => auditFilterSchema.parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    await assertAdmin(ctx);
    const limit = data.limit ?? 50;

    const query = applyAuditFilter(
      ctx.supabase
        .from("audit_events")
        .select("*", { count: "estimated" })
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit + 1),
      data,
    );

    const { data: rows, error, count } = await query;
    if (error) throw new Error("Unable to read audit events");

    const events = (rows ?? []) as AuditEvent[];
    const page = events.slice(0, limit);
    const last = page[page.length - 1];
    return {
      events: page,
      nextCursor: events.length > limit && last ? encodeCursor(last.occurred_at, last.id) : null,
      approxTotal: count ?? page.length,
    };
  });

export const verifyAuditChain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { fromId?: number }) => ({
    fromId: Math.max(0, Math.trunc(Number(input?.fromId ?? 0)) || 0),
  }))
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as AuthedContext;
    await assertAdmin(ctx);
    const { data: rows, error } = await ctx.supabase.rpc("verify_audit_chain", {
      _from_id: data.fromId,
      _limit: 10000,
    });
    if (error) throw new Error("Chain verification failed");
    const result = (Array.isArray(rows) ? rows[0] : rows) as {
      checked: number;
      first_bad_id: number | null;
      ok: boolean;
    };

    const { tryWriteAuditEvent } = await import("./audit.server");
    await tryWriteAuditEvent({
      action: "audit.verify",
      resourceType: "audit_log",
      outcome: result.ok ? "allow" : "error",
      actorId: ctx.userId,
      actorEmail: ctx.claims?.email ?? null,
      resourceId: String(data.fromId),
      context: { checked: result.checked, firstBadId: result.first_bad_id },
    });
    return result;
  });

/** Cheap role probe for the admin UI shell. */
export const currentUserIsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as AuthedContext;
    try {
      await assertAdmin(ctx);
      return { isAdmin: true, email: ctx.claims?.email ?? null };
    } catch {
      return { isAdmin: false, email: ctx.claims?.email ?? null };
    }
  });