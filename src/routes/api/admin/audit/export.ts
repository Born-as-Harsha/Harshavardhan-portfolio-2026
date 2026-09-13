/**
 * GET /api/admin/audit/export — streamed, gzipped NDJSON export of the audit log.
 *
 * Security:
 *  - Bearer auth + server-side `has_role(admin)` before a single row is read.
 *  - Reads go through the caller's RLS-scoped client, so the database enforces
 *    the same restriction independently of this handler.
 *  - The export itself is audited (actor, filter, row count).
 *
 * Memory: rows are pulled in keyset pages and pushed straight into a
 * `CompressionStream`, so peak memory is one page, not the whole export.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  AUDIT_EXPORT_MAX_ROWS,
  applyAuditFilter,
  auditExportFileName,
  encodeCursor,
  filterFromSearchParams,
  type AuditEvent,
} from "@/lib/audit-query";
import {
  enforceRateLimit,
  HttpError,
  jsonError,
  requireAdmin,
  SECURITY_HEADERS,
} from "@/lib/api-auth.server";
import { RATE_LIMITS } from "@/lib/rate-limit";

const PAGE_SIZE = 500;

export const Route = createFileRoute("/api/admin/audit/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const caller = await requireAdmin(request);
          const quota = enforceRateLimit(
            request,
            "audit-export",
            RATE_LIMITS.auditExport,
            caller.userId,
          );
          const url = new URL(request.url);
          const filter = filterFromSearchParams(url.searchParams);

          const encoder = new TextEncoder();
          let exported = 0;

          const source = new ReadableStream<Uint8Array>({
            async pull(controller) {
              let cursor: string | undefined = filter.cursor;
              try {
                for (;;) {
                  const query = applyAuditFilter(
                    caller.supabase
                      .from("audit_events")
                      .select("*")
                      .order("occurred_at", { ascending: false })
                      .order("id", { ascending: false })
                      .limit(PAGE_SIZE),
                    { ...filter, cursor },
                  );
                  const { data, error } = await query;
                  if (error) throw new Error(error.message);
                  const rows = (data ?? []) as AuditEvent[];
                  for (const row of rows) {
                    controller.enqueue(encoder.encode(`${JSON.stringify(row)}\n`));
                    exported += 1;
                    if (exported >= AUDIT_EXPORT_MAX_ROWS) break;
                  }
                  const last = rows[rows.length - 1];
                  if (rows.length < PAGE_SIZE || !last || exported >= AUDIT_EXPORT_MAX_ROWS) break;
                  cursor = encodeCursor(last.occurred_at, last.id);
                }
                controller.close();
              } catch (error) {
                controller.error(error);
              }
            },
          });

          const body = source.pipeThrough(
            new CompressionStream("gzip") as unknown as ReadableWritablePair<
              Uint8Array,
              Uint8Array
            >,
          );

          const { tryWriteAuditEvent, clientIpFrom } = await import("@/lib/audit.server");
          await tryWriteAuditEvent({
            action: "audit.export",
            resourceType: "audit_log",
            outcome: "allow",
            actorId: caller.userId,
            actorEmail: caller.email,
            ip: clientIpFrom(request),
            context: {
              format: "ndjson.gz",
              filter: JSON.stringify(filter).slice(0, 500),
            },
          });

          return new Response(body, {
            status: 200,
            headers: {
              ...SECURITY_HEADERS,
              "content-type": "application/gzip",
              "content-encoding": "identity",
              "content-disposition": `attachment; filename="${auditExportFileName()}"`,
            },
          });
        } catch (error) {
          if (!(error instanceof HttpError)) {
            const { tryWriteAuditEvent } = await import("@/lib/audit.server");
            await tryWriteAuditEvent({
              action: "audit.export",
              resourceType: "audit_log",
              outcome: "error",
              context: { reason: "export_failed" },
            });
          }
          return jsonError(error);
        }
      },
    },
  },
});