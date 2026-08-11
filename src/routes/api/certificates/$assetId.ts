/**
 * GET /api/certificates/$assetId — cache-aware certificate PDF delivery.
 *
 * Authorization runs BEFORE any header, validator or byte is produced:
 * `visibility = 'public'` artifacts are anonymous-readable, everything else
 * requires a signed-in caller. A 304 or 206 is therefore never reachable
 * without first passing the same check as a 200, so validators cannot be used
 * to confirm or fetch private content.
 *
 * Private responses carry `private, no-store` + `Vary: Authorization` so a
 * shared cache can never hand one user's artifact to another.
 */
import { createFileRoute } from "@tanstack/react-router";
import { decidePreviewResponse } from "@/lib/http-cache";
import { isUuid } from "@/lib/cert-upload-validation";
import { CERT_ASSETS } from "@/lib/cert-manifest";
import { HttpError, jsonError, requireUser, SECURITY_HEADERS } from "@/lib/api-auth.server";

type Artifact = {
  asset_id: string;
  sha256: string;
  bytes: number;
  filename: string;
  visibility: string;
};

export const Route = createFileRoute("/api/certificates/$assetId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const assetId = params.assetId;
          // Strict UUID matching also removes any path-traversal surface.
          if (!isUuid(assetId)) throw new HttpError(404, "not_found", "Unknown certificate");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("certificate_artifacts")
            .select("asset_id, sha256, bytes, filename, visibility")
            .eq("asset_id", assetId)
            .maybeSingle();
          if (error) throw new HttpError(500, "internal_error", "Unable to read artifact");
          const artifact = data as Artifact | null;
          if (!artifact) throw new HttpError(404, "not_found", "Unknown certificate");

          const visibility = artifact.visibility === "public" ? "public" : "private";
          if (visibility === "private") {
            // Throws 401 for anonymous and malformed-token callers.
            await requireUser(request);
          }

          const decision = decidePreviewResponse({
            sha256: artifact.sha256,
            bytes: Number(artifact.bytes),
            filename: artifact.filename,
            visibility,
            download: new URL(request.url).searchParams.get("download") === "1",
            ifNoneMatch: request.headers.get("if-none-match"),
            ifRange: request.headers.get("if-range"),
            range: request.headers.get("range"),
          });

          const baseHeaders = {
            ...decision.headers,
            "x-content-type-options": "nosniff",
            "referrer-policy": "no-referrer",
          };

          if (decision.status === 304 || decision.status === 416) {
            return new Response(null, { status: decision.status, headers: baseHeaders });
          }

          const asset = CERT_ASSETS.find((a) => a.asset_id === assetId);
          if (!asset) throw new HttpError(404, "not_found", "Unknown certificate");
          const upstreamUrl = new URL(asset.url, request.url).toString();

          const range =
            decision.status === 206 ? `bytes=${decision.start}-${decision.end}` : undefined;
          const upstream = await fetch(upstreamUrl, {
            headers: range ? { range } : undefined,
          });
          if (!upstream.ok && upstream.status !== 206) {
            throw new HttpError(502, "upstream_unavailable", "Certificate is temporarily unavailable");
          }

          // If the origin ignored the range, degrade to a complete 200 rather
          // than mislabelling a full body as partial content.
          if (decision.status === 206 && upstream.status !== 206) {
            const { "content-range": _cr, ...rest } = baseHeaders as Record<string, string>;
            void _cr;
            return new Response(upstream.body, {
              status: 200,
              headers: { ...rest, "content-length": String(artifact.bytes) },
            });
          }

          return new Response(upstream.body, { status: decision.status, headers: baseHeaders });
        } catch (error) {
          const response = jsonError(error);
          // Error bodies must never be cached against a resource URL.
          for (const [k, v] of Object.entries(SECURITY_HEADERS)) response.headers.set(k, v);
          return response;
        }
      },
    },
  },
});