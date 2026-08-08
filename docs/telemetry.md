# PDF telemetry & debug panel

## Feature flag
The panel is opt-in and renders nothing otherwise:
- `?debug=1` on any URL (persists in `localStorage` under `lv:telemetry-panel`)
- `?debug=0` to turn it off
- always on in dev builds

## Event schema (v1)
| field | type | notes |
| --- | --- | --- |
| `id` | number | monotonic per session |
| `sessionId` | string | random 8 chars, in-memory only, not persisted |
| `kind` | `request_start` \| `first_byte` \| `chunk` \| `last_byte` \| `complete` \| `cancel` \| `error` | |
| `channel` | `preview` \| `download` | |
| `resource` | string | asset **basename** only — query strings/tokens stripped |
| `at` | number | epoch ms |
| `elapsedMs` | number | since that request's `request_start` |
| `chunkBytes` / `totalBytes` / `expectedBytes` | number | byte accounting |
| `message` | string | error text only |

## Privacy review
No PII, no cookies, no auth data, no full URLs, no network egress. Events are held in
memory (max 200, FIFO) and vanish on reload. `safeResourceName()` strips paths and query
strings; a unit test asserts a token in a URL never reaches the store.

## Accessibility
- Progress announced via a polite live region at start, each 10% step, completion,
  cancel and error (`src/lib/a11y-progress.ts`, unit tested).
- Cancel returns focus to the download trigger before unmounting.
- Progress bars expose `role="progressbar"` with `aria-valuenow` only when determinate.
- Panel is a labelled `<section>` with 44px toggle and focus-visible rings.

## Tests
- Unit: `bunx vitest run` (telemetry schema, byte accounting, announcement throttling, formatting)
- E2E: `e2e/pdf-credential.spec.ts` — progress, byte totals, cancel mid-stream, retry,
  download filename/MIME, live-region announcements, keyboard preview.
  Requires `bun add -d @playwright/test`; run `bunx playwright test e2e`.

## PR checklist
- [ ] `bunx vitest run` green
- [ ] `bunx tsgo --noEmit` clean
- [ ] `bunx playwright test e2e` green against `http://localhost:8080`
- [ ] Panel hidden without `?debug=1` in a production build
- [ ] Screen-reader pass (VoiceOver/NVDA) on download + cancel + retry
- [ ] No new strings outside `src/lib/i18n.ts`

## Rollout
Ship dark (flag off). Enable via `?debug=1` for triage; no server changes, so rollback is
reverting the branch or simply not sharing the debug URL.
