/**
 * Lightweight, privacy-safe client telemetry for PDF preview/download flows.
 *
 * Event schema (v1) — see docs at the bottom of this file:
 *   { id, sessionId, kind, channel, resource, at, ...payload }
 *
 * Privacy review: we never record PII. `resource` is the *basename* of a
 * public asset URL (query strings and tokens are stripped). No cookies,
 * no user identifiers, no network egress — events live in memory only and
 * are dropped on reload.
 */

export type TelemetryChannel = "preview" | "download";

export type TelemetryKind =
  | "request_start"
  | "first_byte"
  | "chunk"
  | "last_byte"
  | "complete"
  | "cancel"
  | "error";

export type TelemetryEvent = {
  /** Monotonic per-session event id. */
  id: number;
  sessionId: string;
  kind: TelemetryKind;
  channel: TelemetryChannel;
  /** Public asset basename, never a full URL with query params. */
  resource: string;
  /** Wall-clock timestamp (ms since epoch). */
  at: number;
  /** ms since the matching request_start, when applicable. */
  elapsedMs?: number;
  /** Bytes for this chunk. */
  chunkBytes?: number;
  /** Cumulative bytes received. */
  totalBytes?: number;
  /** Declared/expected size when known. */
  expectedBytes?: number | null;
  /** Error message (never includes request bodies or headers). */
  message?: string;
};

const MAX_EVENTS = 200;

function makeSessionId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID().slice(0, 8);
    }
  } catch {
    /* ignore */
  }
  return Math.random().toString(36).slice(2, 10);
}

export function safeResourceName(url: string | undefined): string {
  if (!url) return "unknown";
  try {
    const u = new URL(url, "http://local");
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : "unknown";
  } catch {
    return "unknown";
  }
}

class TelemetryStore {
  readonly sessionId = makeSessionId();
  private events: TelemetryEvent[] = [];
  private seq = 0;
  private listeners = new Set<() => void>();

  record(event: Omit<TelemetryEvent, "id" | "sessionId" | "at"> & { at?: number }): TelemetryEvent {
    const full: TelemetryEvent = {
      ...event,
      at: event.at ?? Date.now(),
      id: ++this.seq,
      sessionId: this.sessionId,
    };
    this.events = [...this.events, full].slice(-MAX_EVENTS);
    this.listeners.forEach((l) => l());
    return full;
  }

  clear() {
    this.events = [];
    this.listeners.forEach((l) => l());
  }

  getSnapshot = (): TelemetryEvent[] => this.events;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

export const telemetry = new TelemetryStore();

/** Per-request recorder that stamps elapsed time against its own start. */
export function startTrace(channel: TelemetryChannel, url: string | undefined) {
  const resource = safeResourceName(url);
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  let sawFirstByte = false;

  const emit = (kind: TelemetryKind, extra: Partial<TelemetryEvent> = {}) =>
    telemetry.record({ kind, channel, resource, elapsedMs: now() - t0, ...extra });

  emit("request_start");

  return {
    resource,
    chunk(chunkBytes: number, totalBytes: number, expectedBytes?: number | null) {
      if (!sawFirstByte) {
        sawFirstByte = true;
        emit("first_byte", { chunkBytes, totalBytes, expectedBytes });
      }
      emit("chunk", { chunkBytes, totalBytes, expectedBytes });
    },
    lastByte(totalBytes: number) {
      emit("last_byte", { totalBytes });
    },
    complete(totalBytes: number) {
      emit("complete", { totalBytes });
    },
    cancel(totalBytes: number) {
      emit("cancel", { totalBytes });
    },
    error(message: string, totalBytes = 0) {
      emit("error", { message, totalBytes });
    },
  };
}

export type Trace = ReturnType<typeof startTrace>;

/* ---------------------------------------------------------------- feature flag */

const FLAG_KEY = "lv:telemetry-panel";

/**
 * Dev-only convenience flag. Production exposure is NOT decided here — see
 * `src/lib/debug-flag.ts`, which requires a backend-verified signed token.
 * A query param alone can never turn the panel on in a production build.
 */
export function telemetryPanelEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.DEV) return false;
  try {
    const param = new URLSearchParams(window.location.search).get("debug");
    if (param === "1") {
      window.localStorage.setItem(FLAG_KEY, "1");
      return true;
    }
    if (param === "0") {
      window.localStorage.removeItem(FLAG_KEY);
      return false;
    }
    if (window.localStorage.getItem(FLAG_KEY) === "1") return true;
  } catch {
    /* storage blocked */
  }
  return true;
}

/* ------------------------------------------------------------------- export */

/** Hard ceiling for an exported file; oldest events are dropped first. */
export const EXPORT_MAX_BYTES = 512 * 1024;

export type TelemetryExport = {
  schema: "lovable.pdf-telemetry/v1";
  exportedAt: string;
  sessionId: string;
  userAgentFamily: string;
  eventCount: number;
  truncated: boolean;
  events: TelemetryEvent[];
};

/** Coarse UA family only — no version, platform, or fingerprintable detail. */
function userAgentFamily(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/edg\//i.test(ua)) return "edge";
  if (/chrome|chromium/i.test(ua)) return "chromium";
  if (/firefox/i.test(ua)) return "firefox";
  if (/safari/i.test(ua)) return "safari";
  return "other";
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const URLISH = /\b(?:https?:\/\/|\/\/)\S+/gi;
const LONG_TOKEN = /\b[A-Za-z0-9_-]{24,}\b/g;

/** Strips anything that could carry PII or a credential out of free text. */
export function redactMessage(message: string | undefined): string | undefined {
  if (!message) return message;
  return message
    .replace(EMAIL, "[redacted-email]")
    .replace(URLISH, "[redacted-url]")
    .replace(LONG_TOKEN, "[redacted-token]")
    .slice(0, 200);
}

export function redactEvent(e: TelemetryEvent): TelemetryEvent {
  const out: TelemetryEvent = { ...e, resource: safeResourceName(e.resource) };
  if (e.message !== undefined) out.message = redactMessage(e.message);
  else delete out.message;
  return out;
}

/** Builds the redacted, size-capped export payload for the current session. */
export function buildTelemetryExport(
  events: TelemetryEvent[] = telemetry.getSnapshot(),
  maxBytes = EXPORT_MAX_BYTES,
): TelemetryExport {
  let kept = events.map(redactEvent);
  let truncated = false;
  const build = (list: TelemetryEvent[]): TelemetryExport => ({
    schema: "lovable.pdf-telemetry/v1",
    exportedAt: new Date().toISOString(),
    sessionId: telemetry.sessionId,
    userAgentFamily: userAgentFamily(),
    eventCount: list.length,
    truncated,
    events: list,
  });
  let payload = build(kept);
  while (kept.length > 0 && JSON.stringify(payload).length > maxBytes) {
    // Drop oldest first: the tail is the most useful for diagnosing failures.
    kept = kept.slice(Math.ceil(kept.length / 10) || 1);
    truncated = true;
    payload = build(kept);
  }
  return payload;
}

export function telemetryExportFileName(now = new Date()): string {
  return `telemetry-${telemetry.sessionId}-${now.toISOString().replace(/[:.]/g, "-")}.json`;
}
