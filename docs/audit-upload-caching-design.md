# Design spec: admin audit log, certificate upload validation, PDF preview caching

Status: proposed. Scope: three interrelated features on the credential surface.
Existing primitives this builds on: `src/lib/telemetry.ts`, `src/lib/debug-flag.ts`,
`src/lib/debug-gate.functions.ts` (HMAC token + audit log call site),
`src/lib/cert-integrity.ts`, `src/lib/cert-manifest.ts`.

Stack constraints: TanStack Start on Cloudflare Workers. App-internal RPC uses
`createServerFn`; raw HTTP (conditional GET, ranges, webhooks) uses server routes
under `src/routes/api/`. Persistence is Lovable Cloud (Postgres + Storage).

---

## 1. Admin audit log view

### 1.1 Data model

Append-only table, no `UPDATE`/`DELETE` grants, hash-chained per tenant.

```sql
create table public.audit_events (
  id            bigserial primary key,        -- chain order
  occurred_at   timestamptz not null default now(),
  actor_id      uuid references auth.users(id),
  actor_email   text,                          -- snapshot at write time
  actor_ip_hash text,                          -- sha256(ip + daily salt), never raw IP
  action        text not null,                 -- see taxonomy
  resource_type text not null,                 -- 'debug_panel' | 'certificate' | 'telemetry_export'
  resource_id   text,
  outcome       text not null check (outcome in ('allow','deny','error')),
  context       jsonb not null default '{}',   -- redacted; no tokens, no raw URLs
  prev_hash     char(64) not null,
  row_hash      char(64) not null              -- sha256(canonical(row) || prev_hash)
);
create index on public.audit_events (occurred_at desc);
create index on public.audit_events (action, occurred_at desc);
create index on public.audit_events (resource_type, resource_id);
create index on public.audit_events using gin (context jsonb_path_ops);

grant select on public.audit_events to authenticated;   -- narrowed by RLS below
grant all    on public.audit_events to service_role;
alter table public.audit_events enable row level security;

create policy "admins read audit"
  on public.audit_events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
-- no insert/update/delete policy: writes only via service_role
```

Immutability is enforced three ways: (a) no write policy for `authenticated`,
(b) a `before update or delete` trigger that `raise exception`s, (c) the hash chain
so any out-of-band mutation is detectable.

`row_hash = sha256(prev_hash || canonical_json({occurred_at, actor_id, action,
resource_type, resource_id, outcome, context}))`, canonical = sorted keys, no
whitespace, RFC3339 UTC timestamps. Chain head is stored in
`audit_chain_head(id, head_hash, updated_at)` and updated in the same transaction.

Roles live in the separate `user_roles` table with the `has_role()` security-definer
function — never on `profiles`.

### 1.2 Action taxonomy

| action | emitted when |
| --- | --- |
| `debug_gate.verify` | `verifyDebugToken` runs (outcome allow/deny) |
| `debug_panel.open` | panel mounted with a verified grant |
| `telemetry.export` | operator downloads a telemetry JSON |
| `certificate.upload` | upload attempt (allow = integrity passed) |
| `certificate.reject` | integrity failure, includes mismatch detail |
| `audit.export` | someone exports the audit log itself |
| `audit.verify` | integrity verification job run |

### 1.3 API

All admin endpoints re-check the role server-side; a route guard is UX only.

`listAuditEvents` — `createServerFn({ method: 'GET' })` + `requireSupabaseAuth`,
then `has_role(userId,'admin')` or throw `Forbidden`.

```ts
input: {
  q?: string            // ILIKE over actor_email, resource_id, context::text
  action?: string[]     // any-of
  resourceType?: string[]
  outcome?: ('allow'|'deny'|'error')[]
  from?: string; to?: string   // ISO
  cursor?: string       // opaque: base64("<occurred_at>|<id>")
  limit?: number        // 1..100, default 50
}
output: { events: AuditEvent[], nextCursor: string | null, approxTotal: number }
```

Keyset pagination on `(occurred_at desc, id desc)` — offsets drift on an
append-heavy table.

`GET /api/admin/audit/export?…same filters…` — server route, not a server fn,
because it returns a streamed `Response`:

```
200 Content-Type: application/json
    Content-Encoding: gzip
    Content-Disposition: attachment; filename="audit-2026-08-10.json"
    Transfer-Encoding: chunked
```

Body is streamed NDJSON-in-JSON: a header object, then `events` written from a
cursor loop of 1 000-row pages piped through `CompressionStream('gzip')`, so memory
stays flat regardless of range size. Export itself writes an `audit.export` event
containing the filter set and row count.

Error codes: `401` no session, `403` not admin, `400` invalid filter (Zod),
`422` range exceeds `AUDIT_EXPORT_MAX_ROWS` (default 250 000), `429` more than
3 exports/min/actor, `500` chain read failure.

Sample event:

```json
{
  "id": 10482,
  "occurred_at": "2026-08-10T16:22:41.118Z",
  "actor_email": "ops@example.com",
  "actor_ip_hash": "3f9c…",
  "action": "debug_gate.verify",
  "resource_type": "debug_panel",
  "resource_id": "prod",
  "outcome": "deny",
  "context": { "reason": "signature_mismatch", "ua_family": "chromium" },
  "prev_hash": "a1b2…",
  "row_hash": "c4d5…"
}
```

### 1.4 UI (`/_authenticated/admin/audit`)

Sticky filter bar (search input, action multi-select, outcome chips, date-range
picker) over a virtualized table: time · actor · action · resource · outcome ·
context peek. Row click opens a side sheet with the full JSON, the `row_hash`,
and a "verify chain from here" action. Skeleton rows on first load, `aria-live`
polite region announcing "N events, filtered by …", monospace hashes with
copy-to-clipboard buttons and tooltips. Outcome uses semantic tokens
(`--destructive` for deny/error, muted for allow) — never hardcoded colors.

### 1.5 Retention, storage, ops

- Retention 400 days (covers a 13-month audit cycle), enforced by a nightly
  `pg_cron` job that exports the expiring window to object storage before delete;
  the deletion itself is a service-role operation and is itself audited.
- Cold tier: gzip NDJSON in a private bucket with object-lock/WORM retention
  matching the policy. Manifest per file records first/last `id`, row count, and
  the terminal `row_hash` so chains stitch across tiers.
- Encryption: TLS 1.2+ in transit; AES-256 at rest (managed by Postgres/Storage).
  No secrets or raw tokens in `context` — reuse `redactMessage()` before write.
- Monitoring: daily chain-verification job walks the last 24 h plus a random 1 %
  sample; alerts on any `row_hash` mismatch (page), on `debug_gate.verify` deny
  rate > 20 % over 10 min (warn), on export volume anomalies, and on write-path
  errors > 0 (the audit write must never be silently dropped — it fails the
  gated action closed).

---

## 2. Certificate upload validation

### 2.1 Pipeline

```text
client                                   server
  pick file
  → parse (magic bytes %PDF-, size cap)
  → sha256 via WebCrypto            ┐
  → show checksum + provisional UUID│  POST /api/admin/certificates/validate
                                    └→ recompute sha256 from the received bytes
                                       compare to client-declared digest
                                       compare to manifest record (if updating)
                                       verify signature chain (if PDF is signed)
                                       → 200 {status:'ok', assetId, sha256, bytes}
                                       → 409 {status:'mismatch', detail}
  block "Save" until status==='ok'
```

Client-side never decides the outcome; it only gives instant feedback. The server
recomputes from its own copy of the bytes — a client-supplied digest is untrusted
input.

Checks, in order, each with a stable code:

| code | check | HTTP |
| --- | --- | --- |
| `E_MIME` | magic bytes are `%PDF-`, declared type `application/pdf` | 415 |
| `E_SIZE` | 0 < bytes ≤ 20 MB | 413 |
| `E_DIGEST_MISMATCH` | client digest ≠ server digest | 409 |
| `E_MANIFEST_MISMATCH` | digest ≠ pinned `CERT_UPLOAD_RECORDS` row for that `assetId` | 409 |
| `E_UUID_COLLISION` | `assetId` already bound to a different digest | 409 |
| `E_CHAIN_UNTRUSTED` | embedded PKCS#7 signature does not chain to a trusted root | 422 |
| `E_CHAIN_EXPIRED` | signer cert expired at signing time | 422 |
| `E_ENCRYPTED` | PDF is password-protected | 422 |

Chain verification is advisory for unsigned issuer PDFs (most certificates here
are unsigned): absence of a signature yields `status:'ok', chain:'unsigned'`,
and the UI shows a neutral "not digitally signed" badge rather than an error.
A present-but-invalid signature is a hard block.

Error body:

```json
{ "status": "mismatch",
  "code": "E_DIGEST_MISMATCH",
  "expected": { "sha256": "a764…", "bytes": 399441 },
  "actual":   { "sha256": "0e11…", "bytes": 399102 },
  "assetId": "0f0f…-…",
  "remediation": "Re-export the certificate from the issuer and upload the original file; do not re-save it through a PDF editor." }
```

### 2.2 UX

Drop zone → per-file card showing: filename, size, an animated progress ring
during hashing, then two monospace rows — `SHA-256` and `Asset UUID` — each with
a copy icon button (`aria-label="Copy SHA-256"`, toast on copy) and a tooltip
explaining what it pins. On mismatch the card turns destructive-toned and shows a
side-by-side expected/actual diff with the differing prefix highlighted, plus the
remediation line and a "Retry with original file" button. The Save button is
`disabled` with `aria-describedby` pointing at the error text, so screen readers
get the reason rather than a silent dead control. Every state has a skeleton or
spinner; nothing jumps layout between states.

### 2.3 Logging and tests

Each attempt writes `certificate.upload` / `certificate.reject` with
`{ code, bytes, assetIdPrefix }` — never the filename (may carry a person's name)
and never file bytes.

Unit: digest computation, each error code path, magic-byte sniffing, manifest
comparison against `CERT_UPLOAD_RECORDS`, UUID extraction (`assetIdFromUrl`).
Integration: happy path writes storage object + manifest row atomically (rollback
of the row on storage failure and vice versa); mismatch writes no artifact;
concurrent uploads of the same UUID — one wins, one gets `E_UUID_COLLISION`.
The existing `src/lib/__tests__/cert-integrity.test.ts` stays the shipped-artifact
guard: every PDF credential must have a pinned checksum whose `bytes` match the
asset pointer.

---

## 3. PDF preview caching with ETag

### 3.1 Endpoint

`GET /api/certificates/$assetId/file.pdf` (server route — needs raw `Response`).

Response headers:

```
ETag: "sha256-<first 32 hex of the pinned digest>"
Cache-Control: public, max-age=300, s-maxage=31536000, immutable, stale-while-revalidate=86400
Content-Type: application/pdf
Content-Disposition: inline; filename="ssit-fpga-vlsi.pdf"    # ?download=1 → attachment
Accept-Ranges: bytes
Vary: Accept-Encoding
Timing-Allow-Origin: same-origin
```

The ETag is strong and derived from content, so it is stable across deploys and
identical across CDN nodes. `immutable` is safe only because the URL carries the
asset UUID; a re-upload mints a new UUID and therefore a new URL.

Conditional GET: if `If-None-Match` matches, return `304` with `ETag`,
`Cache-Control`, and no body. `If-Range` + `Range: bytes=a-b` returns `206` with
`Content-Range: bytes a-b/total`; a stale `If-Range` falls back to a full `200`.
Unsatisfiable ranges return `416` with `Content-Range: bytes */total`. Ranges
matter for `pdf.js`, which fetches the xref table at the tail first — a cold
preview then costs a few KB instead of the whole file.

Streaming: the handler pipes the storage `ReadableStream` straight through; it
never buffers the file. `usePdfStream` on the client already reads chunk-wise and
reports determinate progress, so first-page paint is unblocked by the tail.

### 3.2 Auth-aware caching

Public credential PDFs: `Cache-Control: public` as above, CDN-cacheable.
Any future private artifact: `private, no-store`, `Vary: Authorization`, and no
CDN caching — a shared cache serving a signed-in user's document to the next
visitor is the failure this rule exists to prevent. The handler picks the header
set from the artifact's visibility column, not from the request path.

### 3.3 Invalidation and metrics

Content-addressed URLs mean invalidation is normally a no-op — publish the new
UUID. Purge is only needed for takedowns: purge by URL, then hard-delete the
storage object; both audited. Bandwidth/KPI metrics come from the existing
telemetry channel plus edge logs: hit ratio (target ≥ 95 % after warm-up), 304
share of conditional requests, p50/p95 TTFB (target < 200 ms / < 600 ms edge-hit),
bytes served per preview vs per download, and range-request share.

---

## 4. Non-functional and rollout

**Backward compatibility.** The current direct asset URLs keep working; the new
route is additive and the UI switches over behind a flag. `CERT_UPLOAD_RECORDS`
stays the source of truth for pinned digests, so the manifest table is populated
*from* it in the migration — no dual source of truth.

**Migration plan.**
1. Migration A: `audit_events`, `audit_chain_head`, immutability trigger, grants,
   RLS, `app_role`/`user_roles` if absent. Backfill nothing (chain starts at genesis
   hash `0*64`).
2. Migration B: `certificate_artifacts(asset_id uuid pk, sha256, bytes, filename,
   visibility, created_at)`, seeded with literal INSERTs derived from the current
   manifest so the first screen has real rows.
3. Ship the audit writer behind `AUDIT_ENABLED` (default on; failures fail the
   gated action closed, never silently).
4. Ship `/api/certificates/$assetId/file.pdf` in shadow: serve it, but keep the UI
   on the old URL for one release while comparing hit ratio and error rate.
5. Flip the preview UI, then the download button.
6. Admin UI last, behind `has_role('admin')`.

Rollback: each step is independently revertible — the flag flip is instant, the
route removal is additive-only, and no migration drops or rewrites existing data.

**Performance targets.** Preview TTFB p95 < 600 ms edge-hit / < 1.5 s origin;
first-page paint p95 < 2 s on a 4 G profile; audit list query p95 < 300 ms at
10 M rows (keyset + covering indexes); upload validation round-trip p95 < 1.5 s
for a 5 MB file.

**Automated tests.** Unit (vitest): hash chain construction and detection of a
tampered row, canonical JSON stability, filter→SQL mapping, every upload error
code, ETag/304/206/416 header matrix, cursor encode/decode round-trip.
Integration: export streams > 100 k rows without memory growth; RLS denies a
non-admin `select`; immutability trigger blocks `update`/`delete`.
E2E (Playwright): admin filters and exports; non-admin gets redirected and the
API returns 403; upload mismatch blocks Save and shows the diff; preview second
load is a 304; range request serves a partial.

**Security review checklist.** Role read from `user_roles` via `has_role()` only;
every admin server fn re-checks the role after `requireSupabaseAuth`; no
service-role client used to decide authorization; Zod on every input; export
rate-limited and audited; `context` passes through redaction; IPs hashed with a
rotating salt; no `Cache-Control: public` on any session-dependent response;
audit table has no client write path; secrets read inside handlers, never at
module scope.

**UI polish.** Layout-stable skeletons for the audit table, upload cards, and the
PDF pane (reuse `src/components/pdf-skeleton.tsx`); lucide icons — `ShieldCheck`
verified, `ShieldAlert` mismatch, `Copy` hashes, `Download` exports; tooltips on
every hash and header badge; toasts via sonner for copy and export completion;
all colors from semantic tokens so the dark theme and any future light print view
both hold.