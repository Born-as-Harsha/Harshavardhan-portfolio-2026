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

/** Panel is opt-in: `?debug=1`, localStorage flag, or dev builds. */
export function telemetryPanelEnabled(): boolean {
  if (typeof window === "undefined") return false;
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
  return Boolean(import.meta.env.DEV);
}
