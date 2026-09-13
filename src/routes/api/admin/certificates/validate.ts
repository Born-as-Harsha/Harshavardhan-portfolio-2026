/**
 * POST /api/admin/certificates/validate — authoritative certificate upload check.
 *
 * The browser runs the same pure validators for instant feedback, but the
 * verdict here is recomputed from the bytes the server actually received:
 * magic bytes, declared MIME, size ceiling, server-side SHA-256, pinned
 * manifest record and the registry row bound to the asset UUID.
 *
 * Admin-only. Every decision (accept and reject) is written to the audit log.
 */
import { createFileRoute } from "@tanstack/react-router";
import {
  UPLOAD_ERROR_HTTP,
  UPLOAD_MAX_BYTES,
  isUuid,
  isSha256,
  sha256Of,
  validateCertificateUpload,
  type ManifestRecord,
} from "@/lib/cert-upload-validation";
import { CERT_UPLOAD_RECORDS } from "@/lib/cert-manifest";
import {
  assertRequestSize,
  enforceRateLimit,
  HttpError,
  jsonError,
  requireAdmin,
  SECURITY_HEADERS,
} from "@/lib/api-auth.server";
import { RATE_LIMITS } from "@/lib/rate-limit";

export const Route = createFileRoute("/api/admin/certificates/validate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const caller = await requireAdmin(request);
          const quota = enforceRateLimit(
            request,
            "cert-validate",
            RATE_LIMITS.certificateValidate,
            caller.userId,
          );

          // Reject oversized bodies before buffering anything.
          assertRequestSize(request, Math.ceil(UPLOAD_MAX_BYTES * 1.1));

          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) {
            throw new HttpError(400, "E_MIME", "A PDF file is required.");
          }
          if (file.size > UPLOAD_MAX_BYTES) {
            throw new HttpError(413, "E_SIZE", "The upload exceeds the 20 MB limit.");
          }

          const rawAssetId = form.get("assetId");
          const assetId = typeof rawAssetId === "string" && rawAssetId ? rawAssetId : null;
          const rawClientSha = form.get("clientSha256");
          const clientSha256 =
            typeof rawClientSha === "string" && isSha256(rawClientSha)
              ? rawClientSha.toLowerCase()
              : null;

          const bytes = new Uint8Array(await file.arrayBuffer());
          const serverSha256 = await sha256Of(bytes);

          let manifest: ManifestRecord | null = null;
          let registered: ManifestRecord | null = null;
          if (assetId && isUuid(assetId)) {
            manifest = CERT_UPLOAD_RECORDS.find((r) => r.assetId === assetId) ?? null;
            const { data } = await caller.supabase
              .from("certificate_artifacts")
              .select("asset_id, sha256, bytes")
              .eq("asset_id", assetId)
              .maybeSingle();
            if (data) {
              registered = { assetId: data.asset_id, sha256: data.sha256, bytes: Number(data.bytes) };
            }
          }

          const result = validateCertificateUpload({
            bytes,
            declaredType: file.type || null,
            clientSha256,
            serverSha256,
            assetId,
            manifest,
            registered,
          });

          const { tryWriteAuditEvent, clientIpFrom } = await import("@/lib/audit.server");
          await tryWriteAuditEvent({
            action: result.status === "ok" ? "certificate.upload" : "certificate.reject",
            resourceType: "certificate",
            outcome: result.status === "ok" ? "allow" : "deny",
            actorId: caller.userId,
            actorEmail: caller.email,
            resourceId: assetId,
            ip: clientIpFrom(request),
            context: {
              sha256: serverSha256,
              bytes: bytes.byteLength,
              // The original filename is never stored verbatim.
              filenameLength: file.name.length,
              ...(result.status === "ok" ? { chain: result.chain } : { code: result.code }),
            },
          });

          const status = result.status === "ok" ? 200 : UPLOAD_ERROR_HTTP[result.code];
          return Response.json(result, { status, headers: SECURITY_HEADERS });
        } catch (error) {
          return jsonError(error);
        }
      },
    },
  },
});