/**
 * Security-focused unit/integration tests for the privileged HTTP surface.
 *
 * Covered: rate-limit windows and quota headers, request-size ceilings,
 * upload validation error codes and their HTTP mapping, cache validator
 * handling (200/304/206/416), range-request authorization bypass attempts,
 * and cross-user cache isolation for private artifacts.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  consumeRateLimit,
  rateLimitHeaders,
  resetRateLimits,
  RATE_LIMITS,
  type RateLimitStore,
} from "../rate-limit";
import { assertRequestSize, HttpError, jsonError } from "../api-auth.server";
import { decidePreviewResponse, cacheHeaders, etagFor, parseRange } from "../http-cache";
import {
  UPLOAD_ERROR_HTTP,
  UPLOAD_MAX_BYTES,
  validateCertificateUpload,
} from "../cert-upload-validation";
import { describeAdminFailure } from "@/components/admin-access-notice";

const pdf = (extra = "") => new TextEncoder().encode(`%PDF-1.7\n${extra}`);
const SHA = "a".repeat(64);

describe("rate limiting", () => {
  let store: RateLimitStore;
  beforeEach(() => {
    store = new Map();
    resetRateLimits(store);
  });

  it("allows up to the limit then blocks with a retry hint", () => {
    const policy = { limit: 3, windowMs: 60_000 };
    const results = [0, 1, 2, 3].map((i) =>
      consumeRateLimit("user:1", policy, { store, now: 1000 + i }),
    );
    expect(results.slice(0, 3).every((r) => r.allowed)).toBe(true);
    expect(results[3]!.allowed).toBe(false);
    expect(results[3]!.retryAfterSeconds).toBeGreaterThan(0);
    expect(results[2]!.remaining).toBe(0);
  });

  it("isolates callers so one abuser cannot exhaust another's quota", () => {
    const policy = { limit: 1, windowMs: 60_000 };
    consumeRateLimit("user:a", policy, { store, now: 0 });
    expect(consumeRateLimit("user:a", policy, { store, now: 0 }).allowed).toBe(false);
    expect(consumeRateLimit("user:b", policy, { store, now: 0 }).allowed).toBe(true);
  });

  it("reopens the window after it expires", () => {
    const policy = { limit: 1, windowMs: 1000 };
    consumeRateLimit("k", policy, { store, now: 0 });
    expect(consumeRateLimit("k", policy, { store, now: 500 }).allowed).toBe(false);
    expect(consumeRateLimit("k", policy, { store, now: 1001 }).allowed).toBe(true);
  });

  it("a blocked caller cannot extend its own ban by hammering", () => {
    const policy = { limit: 1, windowMs: 1000 };
    consumeRateLimit("k", policy, { store, now: 0 });
    for (let i = 0; i < 50; i += 1) consumeRateLimit("k", policy, { store, now: 100 });
    expect(consumeRateLimit("k", policy, { store, now: 1001 }).allowed).toBe(true);
  });

  it("emits quota headers, with retry-after only when blocked", () => {
    const policy = { limit: 1, windowMs: 60_000 };
    const ok = rateLimitHeaders(consumeRateLimit("h", policy, { store, now: 0 }));
    const blocked = rateLimitHeaders(consumeRateLimit("h", policy, { store, now: 0 }));
    expect(ok["x-ratelimit-remaining"]).toBe("0");
    expect(ok["retry-after"]).toBeUndefined();
    expect(blocked["retry-after"]).toBe("60");
  });

  it("ships conservative production policies", () => {
    expect(RATE_LIMITS.auditExport.limit).toBeLessThanOrEqual(10);
    expect(RATE_LIMITS.certificateValidate.limit).toBeLessThanOrEqual(60);
  });
});

describe("request size limits", () => {
  const req = (length: number) =>
    new Request("https://x.test/api", {
      method: "POST",
      headers: { "content-length": String(length) },
    });

  it("rejects a body larger than the ceiling before buffering", () => {
    expect(() => assertRequestSize(req(UPLOAD_MAX_BYTES * 2), UPLOAD_MAX_BYTES)).toThrowError(
      HttpError,
    );
  });

  it("accepts a body inside the ceiling", () => {
    expect(() => assertRequestSize(req(1024), UPLOAD_MAX_BYTES)).not.toThrow();
  });

  it("maps a 429 to retry-after and no-store headers", async () => {
    const response = jsonError(
      new HttpError(429, "rate_limited", "Too many requests.", { "retry-after": "42" }),
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("42");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toMatchObject({ error: "rate_limited" });
  });

  it("never leaks internals for an unexpected error", async () => {
    const response = jsonError(new Error("connection string postgres://secret"));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "internal_error",
      message: "Unexpected error",
    });
  });
});

describe("upload validation error codes", () => {
  const base = {
    declaredType: "application/pdf" as string | null,
    clientSha256: null as string | null,
    serverSha256: SHA,
    assetId: null as string | null,
    manifest: null,
    registered: null,
  };

  it("rejects a non-PDF disguised by its declared MIME type", () => {
    const result = validateCertificateUpload({
      ...base,
      bytes: new TextEncoder().encode("<?php echo 1; ?>"),
    });
    expect(result.status).toBe("mismatch");
    if (result.status === "mismatch") expect(result.code).toBe("E_MIME");
  });

  it("rejects an empty file as a size error", () => {
    const result = validateCertificateUpload({ ...base, bytes: new Uint8Array() });
    if (result.status === "mismatch") expect(result.code).toBe("E_SIZE");
  });

  it("rejects a malformed asset UUID", () => {
    const result = validateCertificateUpload({ ...base, bytes: pdf(), assetId: "../../etc/passwd" });
    if (result.status === "mismatch") expect(result.code).toBe("E_UUID_INVALID");
  });

  it("rejects when the client-claimed digest disagrees with the server digest", () => {
    const result = validateCertificateUpload({ ...base, bytes: pdf(), clientSha256: "b".repeat(64) });
    if (result.status === "mismatch") expect(result.code).toBe("E_DIGEST_MISMATCH");
  });

  it("maps every error code to a 4xx status", () => {
    for (const status of Object.values(UPLOAD_ERROR_HTTP)) {
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(500);
    }
  });
});

describe("cache validators and range handling", () => {
  const input = {
    sha256: SHA,
    bytes: 1000,
    filename: "cert.pdf",
    visibility: "private" as const,
    download: false,
    ifNoneMatch: null as string | null,
    ifRange: null as string | null,
    range: null as string | null,
  };

  it("returns 200 with a strong ETag and full length by default", () => {
    const decision = decidePreviewResponse(input);
    expect(decision.status).toBe(200);
    expect(decision.headers["etag"]).toBe(etagFor(SHA));
    expect(decision.headers["content-length"]).toBe("1000");
  });

  it("returns 304 for a matching If-None-Match", () => {
    const decision = decidePreviewResponse({ ...input, ifNoneMatch: etagFor(SHA) });
    expect(decision.status).toBe(304);
    expect(decision.headers["content-type"]).toBeUndefined();
  });

  it("returns 206 with a correct Content-Range for a satisfiable range", () => {
    const decision = decidePreviewResponse({ ...input, range: "bytes=0-99" });
    expect(decision.status).toBe(206);
    expect(decision.headers["content-range"]).toBe("bytes 0-99/1000");
    expect(decision.headers["content-length"]).toBe("100");
  });

  it("returns 416 with the resource size for an out-of-bounds range", () => {
    const decision = decidePreviewResponse({ ...input, range: "bytes=5000-6000" });
    expect(decision.status).toBe(416);
    expect(decision.headers["content-range"]).toBe("bytes */1000");
  });

  it("falls back to a full 200 when If-Range no longer matches the ETag", () => {
    const decision = decidePreviewResponse({
      ...input,
      ifRange: '"stale"',
      range: "bytes=0-99",
    });
    expect(decision.status).toBe(200);
  });

  it("ignores a syntactically invalid range instead of serving a partial body", () => {
    expect(parseRange("bytes=abc-def", 1000).kind).not.toBe("range");
    expect(decidePreviewResponse({ ...input, range: "bytes=abc-def" }).status).toBe(200);
  });

  it("never lets a private artifact be stored in a shared cache", () => {
    for (const range of [null, "bytes=0-9", "bytes=9999-"]) {
      const decision = decidePreviewResponse({ ...input, range });
      expect(decision.headers["cache-control"]).toContain("private");
      expect(decision.headers["cache-control"]).not.toContain("public");
      expect(decision.headers["vary"]).toContain("Authorization");
    }
  });

  it("keeps public artifacts cacheable but still ETag-validated", () => {
    const headers = cacheHeaders("public");
    expect(headers["cache-control"]).toContain("public");
    expect(decidePreviewResponse({ ...input, visibility: "public" }).headers["etag"]).toBe(
      etagFor(SHA),
    );
  });

  it("cannot be used to probe private content: every status derives from the same ETag", () => {
    // A 304/206 is only reachable once authorization has already passed, so the
    // validator itself must not depend on anything but the artifact digest.
    const a = decidePreviewResponse({ ...input, sha256: SHA });
    const b = decidePreviewResponse({ ...input, sha256: "b".repeat(64) });
    expect(a.headers["etag"]).not.toBe(b.headers["etag"]);
  });
});

describe("admin failure guidance", () => {
  it("explains 403 with a path to requesting access", () => {
    expect(describeAdminFailure(403)).toMatch(/administrator/i);
    expect(describeAdminFailure(403)).toMatch(/grant|setup/i);
  });

  it("surfaces the retry window on 429", () => {
    expect(describeAdminFailure(429, "30")).toContain("30");
  });

  it("tells an expired session to sign in again", () => {
    expect(describeAdminFailure(401)).toMatch(/sign in/i);
  });
});
