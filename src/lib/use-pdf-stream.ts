import { useCallback, useEffect, useRef, useState } from "react";
import { startTrace, type TelemetryChannel, type Trace } from "@/lib/telemetry";

export type PdfStreamStatus = "idle" | "loading" | "ready" | "error" | "aborted";

export type PdfStreamState = {
  status: PdfStreamStatus;
  /** 0-100 when determinate, null when the size is unknown */
  percent: number | null;
  receivedBytes: number;
  totalBytes: number | null;
  objectUrl: string | null;
  error: string | null;
  /** Failed attempts so far for the current request cycle. */
  attempts: number;
  /** True once retries are exhausted: callers should offer download-only. */
  exhausted: boolean;
};

const INITIAL: PdfStreamState = {
  status: "idle",
  percent: null,
  receivedBytes: 0,
  totalBytes: null,
  objectUrl: null,
  error: null,
  attempts: 0,
  exhausted: false,
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Options = {
  /** Known size from asset metadata, used when the response omits content-length. */
  expectedBytes?: number;
  onTiming?: (ms: number, bytes: number) => void;
  /** Telemetry channel this stream belongs to. */
  channel?: TelemetryChannel;
  /** Automatic retries after a failed attempt (default 2, i.e. 3 total tries). */
  maxRetries?: number;
  /** Base delay for exponential backoff with jitter, in ms. */
  retryBaseMs?: number;
};

/** Exponential backoff with full jitter, capped so the UI never feels stuck. */
export function backoffDelay(attempt: number, baseMs = 500, capMs = 8000): number {
  const ceiling = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.round(ceiling / 2 + Math.random() * (ceiling / 2));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Streams a PDF with fetch + ReadableStream so we can report determinate
 * progress. Falls back to a plain blob read when streaming is unavailable and
 * degrades to indeterminate progress when the total size is unknown.
 */
export function usePdfStream(url: string | undefined, options: Options = {}) {
  const {
    expectedBytes,
    onTiming,
    channel = "download",
    maxRetries = 2,
    retryBaseMs = 500,
  } = options;
  const [state, setState] = useState<PdfStreamState>(INITIAL);
  const controllerRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);
  const traceRef = useRef<Trace | null>(null);
  const receivedRef = useRef(0);
  const attemptRef = useRef(0);

  const revoke = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      controllerRef.current?.abort();
      revoke();
    },
    [revoke],
  );

  const abort = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
      traceRef.current?.cancel(receivedRef.current);
      traceRef.current = null;
    }
    setState((s) => (s.status === "loading" ? { ...INITIAL, status: "aborted" } : s));
  }, []);

  const attempt = useCallback(async (): Promise<boolean> => {
    if (!url) return true;
    if (urlRef.current) return true; // already cached in memory
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    const trace: Trace = startTrace(channel, url);
    traceRef.current = trace;
    receivedRef.current = 0;

    setState({ ...INITIAL, status: "loading", totalBytes: expectedBytes ?? null });

    try {
      const res = await fetch(url, { signal: controller.signal, cache: "force-cache" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const headerLength = Number(res.headers.get("content-length"));
      const total =
        Number.isFinite(headerLength) && headerLength > 0 ? headerLength : (expectedBytes ?? null);

      let blob: Blob;
      if (res.body && typeof res.body.getReader === "function") {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.byteLength;
            receivedRef.current = received;
            trace.chunk(value.byteLength, received, total);
            setState((s) => ({
              ...s,
              receivedBytes: received,
              totalBytes: total,
              percent: total ? Math.min(100, Math.round((received / total) * 100)) : null,
            }));
          }
        }
        blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
        trace.lastByte(received);
      } else {
        blob = await res.blob();
        receivedRef.current = blob.size;
        trace.chunk(blob.size, blob.size, total);
        trace.lastByte(blob.size);
        setState((s) => ({ ...s, receivedBytes: blob.size, totalBytes: blob.size, percent: 100 }));
      }

      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      controllerRef.current = null;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      onTiming?.(now - startedAt, blob.size);
      trace.complete(blob.size);
      traceRef.current = null;
      attemptRef.current = 0;
      setState({
        status: "ready",
        percent: 100,
        receivedBytes: blob.size,
        totalBytes: blob.size,
        objectUrl,
        error: null,
        attempts: 0,
        exhausted: false,
      });
      return true;
    } catch (err) {
      controllerRef.current = null;
      if (err instanceof DOMException && err.name === "AbortError") {
        trace.cancel(receivedRef.current);
        traceRef.current = null;
        setState({ ...INITIAL, status: "aborted" });
        return true; // user-initiated: not a failure to retry
      }
      trace.error(err instanceof Error ? err.message : "Unknown error", receivedRef.current);
      traceRef.current = null;
      return false;
    }
  }, [url, expectedBytes, onTiming, channel]);

  /**
   * Runs the request, then retries on failure with exponential backoff +
   * jitter. After `maxRetries` failures the stream reports `exhausted`, which
   * the preview UI uses to switch to a download-only fallback.
   */
  const start = useCallback(async () => {
    for (let i = 0; i <= maxRetries; i++) {
      attemptRef.current = i + 1;
      const ok = await attempt();
      if (ok !== false) return;
      const willRetry = i < maxRetries;
      setState({
        ...INITIAL,
        status: willRetry ? "loading" : "error",
        error: `Preview request failed (attempt ${i + 1} of ${maxRetries + 1})`,
        attempts: i + 1,
        exhausted: !willRetry,
      });
      if (!willRetry) return;
      await sleep(backoffDelay(i, retryBaseMs));
    }
  }, [attempt, maxRetries, retryBaseMs]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    revoke();
    attemptRef.current = 0;
    setState(INITIAL);
  }, [revoke]);

  return { ...state, start, abort, reset };
}