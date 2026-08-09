/**
 * Pinned upload records for every certificate artifact.
 *
 * `sha256` / `bytes` are captured from the source file at upload time. Adding
 * a certificate means: upload it, then add its row here. The integrity test in
 * `src/lib/__tests__/cert-integrity.test.ts` fails the build when a shipped
 * credential has no pinned checksum or when the byte length drifts from the
 * asset pointer.
 */
import { registerChecksums, type CertChecksum } from "./cert-integrity";

import ssitCert from "@/assets/certs/ssit-fpga-vlsi.pdf.asset.json";
import ijirtCert from "@/assets/certs/ijirt-reviewer.pdf.asset.json";
import siemensCert from "@/assets/certs/eduskills-siemens.pdf.asset.json";
import courseraCert from "@/assets/certs/coursera-python-for-everybody.pdf.asset.json";
import tarasCert from "@/assets/certs/taras-ai-ml.pdf.asset.json";
import linuxCert from "@/assets/certs/linux-foundation.pdf.asset.json";
import ciscoCert from "@/assets/certs/cisco-packet-tracer.pdf.asset.json";
import amdoxCert from "@/assets/certs/amdox-internship.pdf.asset.json";

const SHA256: Record<string, string> = {
  [ssitCert.asset_id]: "a76450de770ed409501aa261455099fdf405c2f4db5c9459b313bdb475814e98",
  [ijirtCert.asset_id]: "2e1626cb1dc6db38581b7c1074d484c575f9e2a112abfd835d9d0a23af9777a8",
  [siemensCert.asset_id]: "b7198d7bdcf151d2822938447517b3b57c234a4a96b3211623c73129f3e9e9a6",
  [courseraCert.asset_id]: "e210188c2e30a98afb76c765d2e80a76a49d456fe8dc8d1f55d0530991bf10f4",
  [tarasCert.asset_id]: "55a85e59832d6a7943d59e8abd7447c4bda119bf297c04e306bf192da2129106",
  [linuxCert.asset_id]: "9fb78bcefba2e5ab7805b7838697cc34c38b330fdecb3eb30bcc3627fcd1a0f4",
  [ciscoCert.asset_id]: "8602238dba313d144a0c3560a89ccab77e92d1119dccbc169f2a5a457b52c0ea",
  [amdoxCert.asset_id]: "b66b74ff7ae8e0e7f15465b4f2f62f21f4fce2514719e5ef84217d83cbcb81a8",
};

export const CERT_ASSETS = [
  ssitCert,
  ijirtCert,
  siemensCert,
  courseraCert,
  tarasCert,
  linuxCert,
  ciscoCert,
  amdoxCert,
];

export const CERT_UPLOAD_RECORDS: CertChecksum[] = CERT_ASSETS.map((a) => ({
  assetId: a.asset_id,
  sha256: SHA256[a.asset_id] ?? "",
  bytes: a.size,
}));

registerChecksums(CERT_UPLOAD_RECORDS);