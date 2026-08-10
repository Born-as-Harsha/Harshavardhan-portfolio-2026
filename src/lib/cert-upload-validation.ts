/**
 * Certificate upload validation — pure, isomorphic checks.
 *
 * The same functions run in the browser (instant feedback while a file is
 * picked) and on the server (authoritative decision, recomputed from the bytes
 * the server actually received). The client never decides the outcome.
 */

export const UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export type UploadErrorCode =
  | "E_MIME"
  | "E_SIZE"
  | "E_DIGEST_MISMATCH"
  | "E_MANIFEST_MISMATCH"
  | "E_UUID_COLLISION"
  | "E_UUID_INVALID"
  | "E_ENCRYPTED"
  | "E_CHAIN_UNTRUSTED"
  | "E_CHAIN_EXPIRED";

export const UPLOAD_ERROR_HTTP: Record<UploadErrorCode, number> = {
  E_MIME: 415,
  E_SIZE: 413,
  E_DIGEST_MISMATCH: 409,
  E_MANIFEST_MISMATCH: 409,
  E_UUID_COLLISION: 409,
  E_UUID_INVALID: 400,
  E_ENCRYPTED: 422,
  E_CHAIN_UNTRUSTED: 422,
  E_CHAIN_EXPIRED: 422,
};

export const UPLOAD_REMEDIATION: Record<UploadErrorCode, string> = {
  E_MIME: "Upload the original PDF issued by the provider; images and archives are not accepted.",
  E_SIZE: "The file must be a non-empty PDF of at most 20 MB.",
  E_DIGEST_MISMATCH:
    "The file changed in transit. Re-select the original file and upload it again.",
  E_MANIFEST_MISMATCH:
    "Re-export the certificate from the issuer and upload the original file; do not re-save it through a PDF editor.",
  E_UUID_COLLISION:
    "This asset UUID is already bound to a different file. Upload as a new artifact instead of overwriting.",
  E_UUID_INVALID: "The asset UUID is malformed. Reload the page and retry the upload.",
  E_ENCRYPTED: "Remove the password protection and upload an unencrypted copy.",
  E_CHAIN_UNTRUSTED: "The embedded signature does not chain to a trusted root.",
  E_CHAIN_EXPIRED: "The signing certificate had expired when the document was signed.",
};

export type ChainStatus = "unsigned" | "signed";

export type ValidationFailure = {
  status: "mismatch";
  code: UploadErrorCode;
  message: string;
  remediation: string;
  expected?: { sha256?: string; bytes?: number };
  actual?: { sha256?: string; bytes?: number };
  assetId?: string;
};

export type ValidationSuccess = {
  status: "ok";
  assetId: string | null;
  sha256: string;
  bytes: number;
  chain: ChainStatus;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA_RE = /^[0-9a-f]{64}$/;

export const isUuid = (value: string | null | undefined): boolean => !!value && UUID_RE.test(value);
export const isSha256 = (value: string | null | undefined): boolean =>
  !!value && SHA_RE.test(value.toLowerCase());

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/** Magic-byte sniff: a real PDF starts with `%PDF-` (BOM tolerated). */
export function looksLikePdf(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 5) return false;
  if (ascii(bytes, 0, 5) === "%PDF-") return true;
  // tolerate a UTF-8 BOM prefix, which some exporters emit
  return bytes.byteLength > 8 && ascii(bytes, 3, 5) === "%PDF-";
}

/** Detects an encrypted PDF by its `/Encrypt` trailer entry. */
export function isEncryptedPdf(bytes: Uint8Array): boolean {
  const tail = ascii(bytes, Math.max(0, bytes.byteLength - 4096), Math.min(4096, bytes.byteLength));
  return /\/Encrypt\b/.test(tail);
}

/**
 * Detects an embedded PKCS#7 signature. Certificates issued here are normally
 * unsigned, which is reported as `chain: 'unsigned'` and is NOT an error; a
 * signature that is present but unverifiable is a hard block.
 */
export function detectSignature(bytes: Uint8Array): ChainStatus {
  const text = ascii(bytes, 0, Math.min(bytes.byteLength, 1_000_000));
  return /\/(?:Type\s*\/Sig|SubFilter\s*\/(?:adbe\.pkcs7|ETSI\.CAdES))/.test(text)
    ? "signed"
    : "unsigned";
}

function fail(code: UploadErrorCode, extra: Partial<ValidationFailure> = {}): ValidationFailure {
  return {
    status: "mismatch",
    code,
    message: UPLOAD_REMEDIATION[code],
    remediation: UPLOAD_REMEDIATION[code],
    ...extra,
  };
}

export type ManifestRecord = { assetId: string; sha256: string; bytes: number };

export type ValidateInput = {
  bytes: Uint8Array;
  declaredType?: string | null;
  /** Digest computed by the client; compared against the server's own digest. */
  clientSha256?: string | null;
  /** Server-computed digest of the received bytes (authoritative). */
  serverSha256: string;
  assetId?: string | null;
  /** Pinned record for this asset UUID, when the upload replaces a known one. */
  manifest?: ManifestRecord | null;
  /** Record already bound to this UUID in the registry, if any. */
  registered?: ManifestRecord | null;
  /** Result of chain verification when a signature is present. */
  chainVerdict?: "trusted" | "untrusted" | "expired";
};

/** Runs every check in the documented order and returns the first failure. */
export function validateCertificateUpload(input: ValidateInput): ValidationResult {
  const { bytes, declaredType, clientSha256, serverSha256, assetId, manifest, registered } = input;

  if (assetId != null && !isUuid(assetId)) return fail("E_UUID_INVALID", { assetId });

  if (bytes.byteLength === 0 || bytes.byteLength > UPLOAD_MAX_BYTES) {
    return fail("E_SIZE", { actual: { bytes: bytes.byteLength } });
  }
  if (!looksLikePdf(bytes) || (declaredType && declaredType !== "application/pdf")) {
    return fail("E_MIME");
  }
  if (isEncryptedPdf(bytes)) return fail("E_ENCRYPTED");

  if (clientSha256 && clientSha256.toLowerCase() !== serverSha256.toLowerCase()) {
    return fail("E_DIGEST_MISMATCH", {
      expected: { sha256: clientSha256.toLowerCase() },
      actual: { sha256: serverSha256, bytes: bytes.byteLength },
    });
  }

  if (manifest && (manifest.sha256 !== serverSha256 || manifest.bytes !== bytes.byteLength)) {
    return fail("E_MANIFEST_MISMATCH", {
      assetId: manifest.assetId,
      expected: { sha256: manifest.sha256, bytes: manifest.bytes },
      actual: { sha256: serverSha256, bytes: bytes.byteLength },
    });
  }

  if (registered && registered.sha256 !== serverSha256) {
    return fail("E_UUID_COLLISION", {
      assetId: registered.assetId,
      expected: { sha256: registered.sha256, bytes: registered.bytes },
      actual: { sha256: serverSha256, bytes: bytes.byteLength },
    });
  }

  const chain = detectSignature(bytes);
  if (chain === "signed") {
    if (input.chainVerdict === "expired") return fail("E_CHAIN_EXPIRED", { assetId: assetId ?? "" });
    if (input.chainVerdict !== "trusted") return fail("E_CHAIN_UNTRUSTED", { assetId: assetId ?? "" });
  }

  return { status: "ok", assetId: assetId ?? null, sha256: serverSha256, bytes: bytes.byteLength, chain };
}

/** WebCrypto SHA-256 available in both the browser and the Worker runtime. */
export async function sha256Of(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer: ArrayBuffer =
    data instanceof Uint8Array ? (data.slice().buffer as ArrayBuffer) : data;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}