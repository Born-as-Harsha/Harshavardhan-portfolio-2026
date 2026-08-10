/**
 * HTTP caching primitives for the credential preview route: strong ETags
 * derived from content digests, conditional GET, and byte ranges.
 *
 * Pure functions — the route handler wires them to storage streams, and the
 * unit tests exercise the full header matrix (200 / 304 / 206 / 416).
 */

export type Visibility = "public" | "private";

/** Strong, content-derived ETag. Stable across deploys and CDN nodes. */
export function etagFor(sha256: string): string {
  return `"sha256-${sha256.slice(0, 32)}"`;
}

/** RFC 7232 If-None-Match: `*` matches, list membership matches, W/ tolerated. */
export function ifNoneMatchSatisfied(header: string | null, etag: string): boolean {
  if (!header) return false;
  const normalize = (v: string) => v.trim().replace(/^W\//, "");
  if (header.trim() === "*") return true;
  return header.split(",").some((candidate) => normalize(candidate) === normalize(etag));
}

export function cacheHeaders(visibility: Visibility): Record<string, string> {
  return visibility === "public"
    ? {
        "cache-control":
          "public, max-age=300, s-maxage=31536000, immutable, stale-while-revalidate=86400",
        vary: "Accept-Encoding",
      }
    : {
        // A shared cache must never hold a session-scoped artifact.
        "cache-control": "private, no-store",
        vary: "Authorization, Accept-Encoding",
      };
}

export type RangeResult =
  | { kind: "full" }
  | { kind: "range"; start: number; end: number }
  | { kind: "unsatisfiable" };

/** Single-range parser; multi-range requests degrade to a full response. */
export function parseRange(header: string | null, total: number): RangeResult {
  if (!header) return { kind: "full" };
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return { kind: "full" };
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return { kind: "unsatisfiable" };

  let start: number;
  let end: number;
  if (rawStart === "") {
    const suffix = Number(rawEnd);
    if (suffix <= 0) return { kind: "unsatisfiable" };
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? total - 1 : Number(rawEnd);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { kind: "full" };
  if (start >= total || start > end) return { kind: "unsatisfiable" };
  return { kind: "range", start, end: Math.min(end, total - 1) };
}

/** A stale `If-Range` validator forces a full 200 rather than a partial. */
export function ifRangeSatisfied(header: string | null, etag: string): boolean {
  if (!header) return true;
  return header.trim().replace(/^W\//, "") === etag;
}

export function contentDisposition(filename: string, download: boolean): string {
  // Defence in depth: never let a stored filename break out of the header.
  const safe = filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "certificate.pdf";
  return `${download ? "attachment" : "inline"}; filename="${safe}"`;
}

export type PreviewDecision =
  | { status: 304; headers: Record<string, string> }
  | { status: 416; headers: Record<string, string> }
  | { status: 200; headers: Record<string, string> }
  | { status: 206; headers: Record<string, string>; start: number; end: number };

/**
 * Decides the response shape for a preview request from its validators.
 * The caller supplies the body (a stream slice) for 200/206.
 */
export function decidePreviewResponse(input: {
  sha256: string;
  bytes: number;
  filename: string;
  visibility: Visibility;
  download: boolean;
  ifNoneMatch: string | null;
  ifRange: string | null;
  range: string | null;
}): PreviewDecision {
  const etag = etagFor(input.sha256);
  const base: Record<string, string> = {
    etag,
    ...cacheHeaders(input.visibility),
    "accept-ranges": "bytes",
    "timing-allow-origin": "same-origin",
  };

  if (ifNoneMatchSatisfied(input.ifNoneMatch, etag)) return { status: 304, headers: base };

  const headers: Record<string, string> = {
    ...base,
    "content-type": "application/pdf",
    "content-disposition": contentDisposition(input.filename, input.download),
    "x-content-type-options": "nosniff",
  };

  if (!ifRangeSatisfied(input.ifRange, etag)) {
    return { status: 200, headers: { ...headers, "content-length": String(input.bytes) } };
  }

  const range = parseRange(input.range, input.bytes);
  if (range.kind === "unsatisfiable") {
    return {
      status: 416,
      headers: { ...base, "content-range": `bytes */${input.bytes}` },
    };
  }
  if (range.kind === "range") {
    return {
      status: 206,
      start: range.start,
      end: range.end,
      headers: {
        ...headers,
        "content-range": `bytes ${range.start}-${range.end}/${input.bytes}`,
        "content-length": String(range.end - range.start + 1),
      },
    };
  }
  return { status: 200, headers: { ...headers, "content-length": String(input.bytes) } };
}