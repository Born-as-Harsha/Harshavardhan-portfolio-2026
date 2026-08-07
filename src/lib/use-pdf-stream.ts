import { useCallback, useEffect, useRef, useState } from "react";

export type PdfStreamStatus = "idle" | "loading" | "ready" | "error" | "aborted";

export type PdfStreamState = {
  status: PdfStreamStatus;
  /** 0-100 when determinate, null when the size is unknown */
  percent: number | null;
  receivedBytes: number;
  totalBytes: number | null;
  objectUrl: string | null;
  error: string | null;
};

const INITIAL: PdfStreamState = {
  status: "idle",
  percent: null,
  receivedBytes: 0,
  totalBytes: null,
  objectUrl: null,
  error: null,
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
};

/**
 * Streams a PDF with fetch + ReadableStream so we can report determinate
 * progress. Falls back to a plain blob read when streaming is unavailable and
 * degrades to indeterminate progress when the total size is unknown.
 */
export function usePdfStream(url: string | undefined, options: Options = {}) {
  const { expectedBytes, onTiming } = options;
  const [state, setState] = useState<PdfStreamState>(INITIAL);
  const controllerRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

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
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState((s) => (s.status === "loading" ? { ...INITIAL, status: "aborted" } : s));
  }, []);

  const start = useCallback(async () => {
    if (!url) return;
    if (urlRef.current) return; // already cached in memory
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

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
            setState((s) => ({
              ...s,
              receivedBytes: received,
              totalBytes: total,
              percent: total ? Math.min(100, Math.round((received / total) * 100)) : null,
            }));
          }
        }
        blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
      } else {
        blob = await res.blob();
        setState((s) => ({ ...s, receivedBytes: blob.size, totalBytes: blob.size, percent: 100 }));
      }

      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      controllerRef.current = null;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      onTiming?.(now - startedAt, blob.size);
      setState({
        status: "ready",
        percent: 100,
        receivedBytes: blob.size,
        totalBytes: blob.size,
        objectUrl,
        error: null,
      });
    } catch (err) {
      controllerRef.current = null;
      if (err instanceof DOMException && err.name === "AbortError") {
        setState({ ...INITIAL, status: "aborted" });
        return;
      }
      setState({
        ...INITIAL,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [url, expectedBytes, onTiming]);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    revoke();
    setState(INITIAL);
  }, [revoke]);

  return { ...state, start, abort, reset };
}