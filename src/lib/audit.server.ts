/**
 * Server-only audit writer.
 *
 * Writes go through the `append_audit_event` database function, which locks
 * the chain head and hashes the row inside a single transaction — concurrent
 * appends cannot fork the chain. The function is executable by `service_role`
 * only, and the table has no client write path plus a trigger that rejects
 * every UPDATE/DELETE, so records cannot be silently altered.
 */
import { redactMessage } from "./telemetry";
import type { AuditAction, AuditOutcome } from "./audit-query";

export type AuditWrite = {
  action: AuditAction;
  resourceType: string;
  outcome: AuditOutcome;
  actorId?: string | null;
  actorEmail?: string | null;
  resourceId?: string | null;
  context?: Record<string, unknown>;
  /** Raw client IP; only its salted hash is ever stored. */
  ip?: string | null;
};

const SENSITIVE_KEY = /(token|secret|password|key|authorization|cookie|jwt|bearer)/i;

/** Drops credential-shaped keys and redacts free text before anything is stored. */
export function redactContext(context: Record<string, unknown> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    if (typeof value === "string") out[key] = redactMessage(value);
    else if (value === null || ["number", "boolean"].includes(typeof value)) out[key] = value;
    else if (Array.isArray(value)) out[key] = value.slice(0, 20).map((v) => String(v).slice(0, 120));
    else if (typeof value === "object") out[key] = redactContext(value as Record<string, unknown>);
  }
  return out;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Daily-rotating salt keeps IP hashes unlinkable across days. */
async function hashIp(ip: string | null | undefined): Promise<string | null> {
  if (!ip) return null;
  const salt = process.env["AUDIT_IP_SALT"] ?? "audit-default-salt";
  const day = new Date().toISOString().slice(0, 10);
  return (await sha256Hex(`${salt}:${day}:${ip}`)).slice(0, 32);
}

export function clientIpFrom(request: Request | undefined): string | null {
  if (!request) return null;
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

export const auditEnabled = () => process.env["AUDIT_ENABLED"] !== "false";

export type AuditWriteResult = { id: number; row_hash: string } | null;

/**
 * Appends one audit record. Throws when the write fails so the calling action
 * fails closed — an unaudited privileged action must not silently succeed.
 */
export async function writeAuditEvent(event: AuditWrite): Promise<AuditWriteResult> {
  if (!auditEnabled()) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("append_audit_event", {
    _action: event.action,
    _resource_type: event.resourceType,
    _outcome: event.outcome,
    _actor_id: event.actorId ?? undefined,
    _actor_email: event.actorEmail ?? undefined,
    _actor_ip_hash: (await hashIp(event.ip)) ?? undefined,
    _resource_id: event.resourceId ?? undefined,
    _context: redactContext(event.context ?? {}),
  });
  if (error) throw new Error(`audit write failed: ${error.message}`);
  const row = data as unknown as { id: number; row_hash: string };
  return { id: row.id, row_hash: row.row_hash };
}

/** Best-effort variant for non-gating observability paths (never throws). */
export async function tryWriteAuditEvent(event: AuditWrite): Promise<void> {
  try {
    await writeAuditEvent(event);
  } catch (error) {
    console.error("[audit] write failed", error instanceof Error ? error.message : "unknown");
  }
}