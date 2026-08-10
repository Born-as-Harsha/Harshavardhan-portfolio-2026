import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor, auditFilterSchema } from "../audit-query";
import {
  detectSignature,
  looksLikePdf,
  isEncryptedPdf,
  validateCertificateUpload,
} from "../cert-upload-validation";
import { decidePreviewResponse, etagFor, parseRange } from "../http-cache";

const pdf = (extra = "") => new TextEncoder().encode(`%PDF-1.7\n${extra}\n%%EOF`);
const DIGEST = "a".repeat(64);

describe("audit cursor + filters", () => {
  it("round-trips a keyset cursor", () => {
    const at = "2026-08-10T16:22:41.118Z";
    expect(decodeCursor(encodeCursor(at, 42))).toEqual({ occurredAt: at, id: 42 });
  });
  it("rejects a garbage cursor", () => {
    expect(decodeCursor("not-a-cursor")).toBeNull();
  });
  it("caps the page size", () => {
    expect(() => auditFilterSchema.parse({ limit: 500 })).toThrow();
  });
});

describe("certificate upload validation", () => {
  it("accepts an unsigned PDF whose digests agree", () => {
    const bytes = pdf();
    expect(looksLikePdf(bytes)).toBe(true);
    expect(detectSignature(bytes)).toBe("unsigned");
    const r = validateCertificateUpload({ bytes, serverSha256: DIGEST, clientSha256: DIGEST });
    expect(r).toMatchObject({ status: "ok", chain: "unsigned" });
  });
  it("blocks a non-PDF", () => {
    const r = validateCertificateUpload({ bytes: new Uint8Array([1, 2, 3, 4, 5]), serverSha256: DIGEST });
    expect(r).toMatchObject({ status: "mismatch", code: "E_MIME" });
  });
  it("blocks an empty file on size", () => {
    const r = validateCertificateUpload({ bytes: new Uint8Array(0), serverSha256: DIGEST });
    expect(r).toMatchObject({ code: "E_SIZE" });
  });
  it("blocks a mismatching client digest", () => {
    const r = validateCertificateUpload({ bytes: pdf(), serverSha256: DIGEST, clientSha256: "b".repeat(64) });
    expect(r).toMatchObject({ code: "E_DIGEST_MISMATCH" });
  });
  it("blocks a manifest mismatch", () => {
    const bytes = pdf();
    const r = validateCertificateUpload({
      bytes,
      serverSha256: DIGEST,
      manifest: { assetId: "x", sha256: "b".repeat(64), bytes: bytes.byteLength },
    });
    expect(r).toMatchObject({ code: "E_MANIFEST_MISMATCH" });
  });
  it("blocks a UUID bound to different bytes", () => {
    const r = validateCertificateUpload({
      bytes: pdf(),
      serverSha256: DIGEST,
      registered: { assetId: "x", sha256: "c".repeat(64), bytes: 10 },
    });
    expect(r).toMatchObject({ code: "E_UUID_COLLISION" });
  });
  it("rejects a malformed asset UUID", () => {
    const r = validateCertificateUpload({ bytes: pdf(), serverSha256: DIGEST, assetId: "../etc/passwd" });
    expect(r).toMatchObject({ code: "E_UUID_INVALID" });
  });
  it("rejects an encrypted PDF", () => {
    const bytes = pdf("/Encrypt 5 0 R");
    expect(isEncryptedPdf(bytes)).toBe(true);
    expect(validateCertificateUpload({ bytes, serverSha256: DIGEST })).toMatchObject({
      code: "E_ENCRYPTED",
    });
  });
  it("blocks a signed PDF whose chain is not trusted", () => {
    const bytes = pdf("/SubFilter /adbe.pkcs7.detached");
    expect(detectSignature(bytes)).toBe("signed");
    expect(validateCertificateUpload({ bytes, serverSha256: DIGEST })).toMatchObject({
      code: "E_CHAIN_UNTRUSTED",
    });
  });
});

describe("preview cache headers", () => {
  const base = {
    sha256: DIGEST,
    bytes: 1000,
    filename: "cert.pdf",
    visibility: "public" as const,
    download: false,
    ifNoneMatch: null,
    ifRange: null,
    range: null,
  };

  it("serves 200 with a strong content ETag on a cold request", () => {
    const d = decidePreviewResponse(base);
    expect(d.status).toBe(200);
    expect(d.headers["etag"]).toBe(etagFor(DIGEST));
    expect(d.headers["accept-ranges"]).toBe("bytes");
  });
  it("answers 304 for a matching If-None-Match", () => {
    expect(decidePreviewResponse({ ...base, ifNoneMatch: etagFor(DIGEST) }).status).toBe(304);
  });
  it("answers 200 when the resource changed", () => {
    expect(decidePreviewResponse({ ...base, ifNoneMatch: '"sha256-stale"' }).status).toBe(200);
  });
  it("serves a 206 partial", () => {
    const d = decidePreviewResponse({ ...base, range: "bytes=0-99" });
    expect(d.status).toBe(206);
    expect(d.headers["content-range"]).toBe("bytes 0-99/1000");
    expect(d.headers["content-length"]).toBe("100");
  });
  it("serves a tail range (pdf.js xref)", () => {
    expect(parseRange("bytes=-50", 1000)).toEqual({ kind: "range", start: 950, end: 999 });
  });
  it("answers 416 for an unsatisfiable range", () => {
    const d = decidePreviewResponse({ ...base, range: "bytes=5000-6000" });
    expect(d.status).toBe(416);
    expect(d.headers["content-range"]).toBe("bytes */1000");
  });
  it("falls back to a full response on a stale If-Range", () => {
    expect(decidePreviewResponse({ ...base, ifRange: '"old"', range: "bytes=0-9" }).status).toBe(200);
  });
  it("never marks a private artifact shared-cacheable", () => {
    const d = decidePreviewResponse({ ...base, visibility: "private" });
    expect(d.headers["cache-control"]).toBe("private, no-store");
    expect(d.headers["vary"]).toContain("Authorization");
  });
  it("sanitises the filename in Content-Disposition", () => {
    const d = decidePreviewResponse({ ...base, filename: '../../etc/pa"sswd.pdf', download: true });
    expect(d.headers["content-disposition"]).toBe('attachment; filename=".._.._etc_pa_sswd.pdf"');
  });
});