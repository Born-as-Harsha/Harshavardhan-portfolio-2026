# Telemetry export, PDF preview recovery, and debug-panel hardening

Design + operations doc for the credential PDF surface.

## 1. Telemetry export

`buildTelemetryExport(events?, maxBytes = 512 * 1024): TelemetryExport` — no network, produced from an in-memory Blob.

```jsonc
{
  "schema": "lovable.pdf-telemetry/v1",
  "exportedAt": "2026-08-09T05:11:03.412Z",
  "sessionId": "9f31ab20",
  "userAgentFamily": "chromium",
  "eventCount": 3,
  "truncated": false,
  "events": [
    { "id": 1, "sessionId": "9f31ab20", "kind": "request_start", "channel": "preview",
      "resource": "ssit-fpga-vlsi.pdf", "at": 1786000000000, "elapsedMs": 0 },
    { "id": 2, "sessionId": "9f31ab20", "kind": "first_byte", "channel": "preview",
      "resource": "ssit-fpga-vlsi.pdf", "at": 1786000000180, "elapsedMs": 180,
      "chunkBytes": 16384, "totalBytes": 16384, "expectedBytes": 399441 },
    { "id": 3, "sessionId": "9f31ab20", "kind": "error", "channel": "preview",
      "resource": "ssit-fpga-vlsi.pdf", "at": 1786000004010, "elapsedMs": 4010,
      "totalBytes": 81920, "message": "Request failed (503)" }
  ]
}
```

### Limits
- Hard cap **512 KB** per export; the oldest 10% of events are dropped in a loop until the payload fits and `truncated` flips to `true`.
- The in-memory ring buffer already caps at 200 events per session.

### Redaction rules (applied at export time)
| Field | Rule |
| --- | --- |
| `resource` | basename only — path, query string and tokens stripped |
| `message` | emails -> `[redacted-email]`, URLs -> `[redacted-url]`, 24+ char tokens -> `[redacted-token]`, truncated to 200 chars |
| user agent | coarse family only (`chromium`/`firefox`/`safari`/`edge`/`other`) |
| identity | none captured — `sessionId` is a random per-tab value, not a user ID |

No cookies, no IP, no egress. The object URL is revoked 1s after the save starts.

## 2. PDF preview recovery

State machine: `idle -> loading -> (ready | error)` with automatic retries.

- `maxRetries` default **2** (3 attempts), configurable per call site: `usePdfStream(url, { maxRetries })`; the preview pane uses `PREVIEW_MAX_RETRIES`.
- Backoff: exponential with full jitter — `rand(ceil/2, ceil)` where `ceil = min(8000, 500 * 2^attempt)`. Jitter prevents retry stampedes.
- Aborts are user intent and are never retried.
- UX states: skeleton + determinate bar while loading (including between retries), then on exhaustion a **download-only fallback** card showing the attempt count with Retry and Download actions.
- Telemetry: each attempt emits its own `request_start` … `error` trace, so an export shows attempts, per-attempt TTFB, and bytes received before failure.

## 3. Debug panel feature-flag hardening

- `?debug=1` is **dev-only**. In a production build `telemetryPanelEnabled()` returns `false` unconditionally.
- Production exposure requires `?debugToken=<expEpochSeconds>.<hmacSha256Hex>`, verified by the `verifyDebugToken` server function against `DEBUG_PANEL_SECRET` with a timing-safe compare and expiry check.
- Mint a 1-hour operator token:

```bash
exp=$(( $(date +%s) + 3600 ))
sig=$(printf "%s" "$exp" | openssl dgst -sha256 -hmac "$DEBUG_PANEL_SECRET" -hex | awk '{print $2}')
echo "$exp.$sig"
```

- A granted session is cached in **sessionStorage only** (dies with the tab); never localStorage, never a cookie.
- Every decision is audit-logged server-side: `{ audit: "debug_panel_access", at, allowed, reason, route, tokenPrefix }`. Reasons: `ok`, `expired`, `bad_signature`, `malformed_token`, `gate_unconfigured`.

## 4. Upload / download consistency

Each certificate PDF is uploaded to immutable CDN storage under a UUID and pinned in `src/lib/cert-manifest.ts` with its SHA-256 and byte length. `verifyCertificateBytes(url, bytes)` recomputes the digest from the bytes the browser received and returns `verified | unknown | mismatch`.

Acceptance tests (`src/lib/__tests__/cert-integrity.test.ts`):
1. every pinned record has a 64-hex digest and a positive byte length;
2. every shipped PDF credential resolves to a checksum whose `bytes` match the asset pointer `size`;
3. tampered bytes produce `mismatch`;
4. unpinned artifacts produce `unknown` — never a false "verified" badge.

Adding a certificate: `lovable-assets create --file <pdf>` -> add the pointer import + digest row to `cert-manifest.ts` -> tests enforce the rest.

## 5. Security / ops

- **Auth**: the site is public and read-only; the only privileged surface is the debug gate.
- **In transit**: HTTPS/HSTS via the platform CDN for every asset and route.
- **At rest**: certificate PDFs live in encrypted CDN object storage; `DEBUG_PANEL_SECRET` lives in the encrypted secret store, never in code.
- **Retention**: telemetry is memory-only and dropped on reload; exports are user-initiated local files; audit entries follow platform server-log retention.
- **Monitoring / alerts**: alert on a rise in `debug_panel_access` with `allowed:false` (probing) and on preview `error` traces above baseline.
- **Rollback**: changes are independent — set `PREVIEW_MAX_RETRIES` to `0` to disable retries, delete `DEBUG_PANEL_SECRET` to hard-close the gate (`gate_unconfigured` denies all), or redeploy the previous build.

## 6. QA checklist

- [ ] Export button disabled with zero events, enabled after a preview.
- [ ] Exported JSON matches the schema and contains no query strings, emails or tokens.
- [ ] Offline/503 preview retries 3x with growing gaps, then shows the download-only fallback; Download still works.
- [ ] Cancel mid-stream returns focus to the trigger and does not retry.
- [ ] Production build: `?debug=1` shows nothing; a valid `?debugToken` shows the panel; an expired one does not; reloading without the param keeps the grant for that tab only.
- [ ] Each certification detail page downloads a PDF whose size matches the displayed size.

## 7. Profile "year" migration

`PROFILE.year` -> `"Third Year"`, education period -> `"2024 – 2028 (Third Year)"`, and the About copy comes from the i18n key `about.yearStatus` ("I am currently a third-year student."), so the resume PDF, print view, MCP tools and web UI all move together from one source of truth.
