/**
 * Admin audit APIs. Every function re-checks the caller's role server-side
 * through `has_role()` after `requireSupabaseAuth`; the route guard is UX only.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  auditFilterSchema,
  decodeCursor,
  encodeCursor,
  type AuditEvent,
  type AuditFilter,
} from "./audit-query";

type AuthedContext = { supabase: SupabaseLike; userId: string; claims?: { email?: string } };

type SupabaseLike = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}

export async function assertAdmin(context: AuthedContext): Promise<void> {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || data !== true) throw new ForbiddenError();
}

/** Applies a validated filter to a PostgREST query builder. */
export function applyAuditFilter<T>(query: T, filter: AuditFilter): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = query as any;
  if (filter.action?.length) q = q.in("action", filter.action);
  if (filter.resourceType?.length) q = q.in("resource_type", filter.resourceType);
  if (filter.outcome?.length) q = q.in("outcome", filter.outcome);
  if (filter.from) q = q.gte("occurred_at", filter.from);
  if (filter.to) q = q.lte("occurred_at", filter.to);
  if (filter.q) {
    const term = filter.q.replace(/[%,()]/g, " ");
    q = q.or(`actor_email.ilike.%${term}%,resource_id.ilike.%${term}%,action.ilike.%${term}%`);
  }
  if (filter.cursor) {
    const cursor = decodeCursor(filter.cursor);
    if (cursor) q = q.lt("occurred_at", cursor.occurredAt);
  }
  return q as T;
}

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