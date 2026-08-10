/**
 * Client-safe audit query primitives: action taxonomy, filter schema and
 * keyset cursor encoding. Pure functions only — imported by the admin UI, the
 * server functions and the export route, and covered by unit tests.
 */
import { z } from "zod";

export const AUDIT_ACTIONS = [
  "debug_gate.verify",
  "debug_panel.open",
  "telemetry.export",
  "certificate.upload",
  "certificate.reject",
  "audit.export",
  "audit.verify",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_RESOURCE_TYPES = [
  "debug_panel",
  "certificate",
  "telemetry_export",
  "audit_log",
] as const;

export const AUDIT_OUTCOMES = ["allow", "deny", "error"] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export type AuditEvent = {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_ip_hash: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  outcome: string;
  context: { [k: string]: JsonValue };
  prev_hash: string;
  row_hash: string;
};

export const AUDIT_LIST_LIMIT_MAX = 100;
/** Hard ceiling on a single export; larger ranges must be narrowed by filters. */
export const AUDIT_EXPORT_MAX_ROWS = 250_000;

export const auditFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  action: z.array(z.string().max(64)).max(20).optional(),
  resourceType: z.array(z.string().max(64)).max(20).optional(),
  outcome: z.array(z.enum(AUDIT_OUTCOMES)).max(3).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().max(200).optional(),
  limit: z.number().int().min(1).max(AUDIT_LIST_LIMIT_MAX).optional(),
});

export type AuditFilter = z.infer<typeof auditFilterSchema>;

/* ------------------------------------------------------------------ cursor */

function b64encode(value: string): string {
  if (typeof btoa === "function") return btoa(value);
  return Buffer.from(value, "utf8").toString("base64");
}

function b64decode(value: string): string {
  if (typeof atob === "function") return atob(value);
  return Buffer.from(value, "base64").toString("utf8");
}

/** Keyset cursor over `(occurred_at desc, id desc)` — offsets drift on append. */
export function encodeCursor(occurredAt: string, id: number): string {
  return b64encode(`${occurredAt}|${id}`);
}

export function decodeCursor(cursor: string): { occurredAt: string; id: number } | null {
  try {
    const [occurredAt, rawId] = b64decode(cursor).split("|");
    const id = Number(rawId);
    if (!occurredAt || !Number.isSafeInteger(id) || id < 0) return null;
    if (Number.isNaN(Date.parse(occurredAt))) return null;
    return { occurredAt, id };
  } catch {
    return null;
  }
}

/** Parses search params into a validated filter (used by the export route). */
export function filterFromSearchParams(params: URLSearchParams): AuditFilter {
  const list = (key: string) => {
    const all = params.getAll(key).flatMap((v) => v.split(",")).filter(Boolean);
    return all.length ? all : undefined;
  };
  return auditFilterSchema.parse({
    q: params.get("q") ?? undefined,
    action: list("action"),
    resourceType: list("resourceType"),
    outcome: list("outcome"),
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    limit: params.get("limit") ? Number(params.get("limit")) : undefined,
  });
}

export function auditExportFileName(now = new Date()): string {
  return `audit-${now.toISOString().slice(0, 10)}.json.gz`;
}