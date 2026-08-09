import { describe, expect, it } from "vitest";
import { CREDENTIALS } from "../resume-data";
import { CERT_UPLOAD_RECORDS } from "../cert-manifest";
import {
  assetIdFromUrl,
  checksumForUrl,
  verifyCertificateBytes,
} from "../cert-integrity";

describe("certificate upload/download consistency", () => {
  it("pins a sha256 and byte length for every uploaded artifact", () => {
    for (const r of CERT_UPLOAD_RECORDS) {
      expect(r.sha256, `missing sha256 for ${r.assetId}`).toMatch(/^[0-9a-f]{64}$/);
      expect(r.bytes).toBeGreaterThan(0);
    }
  });

  it("gives every shipped PDF credential a resolvable checksum record", () => {
    const pdfs = CREDENTIALS.filter((c) => c.isPdf);
    expect(pdfs.length).toBeGreaterThan(0);
    for (const c of pdfs) {
      expect(assetIdFromUrl(c.url), `no asset UUID in ${c.url}`).not.toBeNull();
      const checksum = checksumForUrl(c.url);
      expect(checksum, `no checksum pinned for ${c.slug}`).not.toBeNull();
      // The asset pointer's size must agree with the pinned upload record.
      expect(c.fileSize).toBe(checksum!.bytes);
    }
  });

  it("reports mismatch when downloaded bytes differ from the upload", async () => {
    const record = CERT_UPLOAD_RECORDS[0]!;
    const url = `/__l5e/assets-v1/${record.assetId}/file.pdf`;
    const result = await verifyCertificateBytes(url, new TextEncoder().encode("tampered").buffer);
    expect(result.state).toBe("mismatch");
  });

  it("returns unknown for artifacts with no pinned checksum", async () => {
    const result = await verifyCertificateBytes(
      "https://example.com/other.pdf",
      new ArrayBuffer(4),
    );
    expect(result.state).toBe("unknown");
  });
});