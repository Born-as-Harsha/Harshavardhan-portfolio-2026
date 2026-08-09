/**
 * Upload/download consistency for certificate PDFs.
 *
 * Every certificate artifact that ships with the site is pinned to the
 * SHA-256 digest and byte length of the file that was uploaded. The CDN URL
 * already carries an immutable UUID, so the digest is a second, independent
 * check: if the bytes a visitor downloads differ from the bytes that were
 * uploaded, `verifyCertificateBytes` fails closed and the UI degrades to a
 * "download only, unverified" state instead of silently serving a mismatch.
 */

export type CertChecksum = {
  /** Asset UUID from the Lovable asset pointer (immutable per upload). */
  assetId: string;
  /** Lowercase hex SHA-256 of the uploaded file. */
  sha256: string;
  /** Exact byte length of the uploaded file. */
  bytes: number;
};

/** assetId -> checksum record. Keyed by UUID so renames never break the map. */
export const CERT_CHECKSUMS: Record<string, CertChecksum> = {};

export function registerChecksums(records: CertChecksum[]) {
  for (const r of records) CERT_CHECKSUMS[r.assetId] = r;
}

/** Extracts the asset UUID from a `/__l5e/assets-v1/<uuid>/<file>` URL. */
export function assetIdFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = /assets-v1\/([0-9a-f-]{36})\//i.exec(url);
  return m ? m[1]!.toLowerCase() : null;
}

export function checksumForUrl(url: string | undefined): CertChecksum | null {
  const id = assetIdFromUrl(url);
  return id ? (CERT_CHECKSUMS[id] ?? null) : null;
}

export async function sha256Hex(data: ArrayBuffer): Promise<string | null> {
  if (typeof crypto === "undefined" || !crypto.subtle) return null;
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type IntegrityResult =
  | { state: "verified"; sha256: string }
  | { state: "unknown"; reason: string }
  | { state: "mismatch"; expected: CertChecksum; actual: { sha256: string | null; bytes: number } };

/** Compares downloaded bytes against the pinned upload record. */
export async function verifyCertificateBytes(
  url: string | undefined,
  data: ArrayBuffer,
): Promise<IntegrityResult> {
  const expected = checksumForUrl(url);
  if (!expected) return { state: "unknown", reason: "no checksum pinned for this artifact" };
  const actualHash = await sha256Hex(data);
  if (actualHash === null) return { state: "unknown", reason: "WebCrypto unavailable" };
  if (actualHash === expected.sha256 && data.byteLength === expected.bytes) {
    return { state: "verified", sha256: actualHash };
  }
  return { state: "mismatch", expected, actual: { sha256: actualHash, bytes: data.byteLength } };
}