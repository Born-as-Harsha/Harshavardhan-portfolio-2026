import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, Eye, Loader2, RotateCcw, X } from "lucide-react";
import { formatBytes, usePdfStream } from "@/lib/use-pdf-stream";
import { PdfSkeleton } from "@/components/pdf-skeleton";
import { nextAnnouncedStep, progressMessage } from "@/lib/a11y-progress";
import { t } from "@/lib/i18n";

/**
 * Throttles progress announcements so screen readers hear start, each 10%
 * step, and the terminal state instead of one message per chunk.
 */
function useProgressAnnouncement(input: {
  label: string;
  status: "idle" | "loading" | "ready" | "error" | "aborted";
  percent: number | null;
  receivedBytes: number;
  error?: string | null;
}) {
  const { label, status, percent, receivedBytes, error } = input;
  const lastStep = useRef<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "idle") {
      lastStep.current = null;
      setMessage("");
      return;
    }
    if (status === "loading") {
      const step = nextAnnouncedStep(lastStep.current, percent);
      if (percent !== null && step === null) return;
      lastStep.current = step;
      setMessage(
        progressMessage({
          label,
          status,
          percent,
          receivedLabel: formatBytes(receivedBytes),
        }),
      );
      return;
    }
    lastStep.current = null;
    setMessage(
      progressMessage({ label, status, percent, receivedLabel: formatBytes(receivedBytes), error }),
    );
  }, [label, status, percent, receivedBytes, error]);

  return message;
}

function track(event: string, data: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // Lightweight telemetry hook — no network calls, readable in devtools.
  // eslint-disable-next-line no-console
  if (import.meta.env.DEV) console.debug(`[telemetry] ${event}`, data);
}

function ProgressBar({ percent }: { percent: number | null }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
      <div
        className={
          percent === null
            ? "h-full w-1/3 animate-[indeterminate_1.2s_ease-in-out_infinite] rounded-full bg-primary"
            : "h-full rounded-full bg-primary transition-[width] duration-200"
        }
        style={percent === null ? undefined : { width: `${percent}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------- download */

export function PdfDownloadButton({
  url,
  fileName,
  label,
  expectedBytes,
  metaLine,
}: {
  url: string;
  fileName: string;
  label: string;
  expectedBytes?: number;
  metaLine?: string;
}) {
  const stream = usePdfStream(url, {
    expectedBytes,
    channel: "download",
    onTiming: (ms, bytes) => track("pdf_download", { url, ms: Math.round(ms), bytes }),
  });
  const [saved, setSaved] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Trigger the save once the bytes are in memory.
  useEffect(() => {
    if (stream.status !== "ready" || !stream.objectUrl || saved) return;
    const a = document.createElement("a");
    a.href = stream.objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setSaved(true);
  }, [stream.status, stream.objectUrl, fileName, saved]);

  const loading = stream.status === "loading";
  const failed = stream.status === "error";

  const status = useProgressAnnouncement({
    label,
    status: stream.status,
    percent: stream.percent,
    receivedBytes: stream.receivedBytes,
    error: stream.error,
  });

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          ref={triggerRef}
          onClick={() => {
            setSaved(false);
            stream.reset();
            void stream.start();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : failed ? (
            <RotateCcw className="h-4 w-4" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          <span className="text-left leading-tight">
            {loading
              ? stream.percent === null
                ? `Downloading… ${formatBytes(stream.receivedBytes)}`
                : `Downloading… ${stream.percent}%`
              : failed
                ? "Retry download"
                : label}
            {metaLine && !loading && !failed && (
              <span className="block font-mono text-[10px] font-normal opacity-80">{metaLine}</span>
            )}
          </span>
        </button>

        {loading && (
          <button
            type="button"
            onClick={() => {
              stream.abort();
              // Return focus to the trigger so keyboard users aren't stranded
              // on a control that is about to unmount.
              triggerRef.current?.focus();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs font-semibold text-foreground/90 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X className="h-3.5 w-3.5" aria-hidden /> {t("pdf.cancel")}
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-3">
          <div
            role="progressbar"
            aria-label={`${label} download progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            {...(stream.percent !== null ? { "aria-valuenow": stream.percent } : {})}
          >
            <ProgressBar percent={stream.percent} />
          </div>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
            {formatBytes(stream.receivedBytes)}
            {stream.totalBytes ? ` / ${formatBytes(stream.totalBytes)}` : ""}
          </p>
        </div>
      )}

      {stream.status === "aborted" && (
        <p className="mt-2 text-xs text-muted-foreground">{t("pdf.canceled")}</p>
      )}

      {failed && (
        <p className="mt-2 text-xs text-amber-400">
          {t("pdf.failed")}
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      {/* Progressive enhancement: works with JS disabled / stream failures. */}
      <noscript>
        <a href={url} download={fileName}>
          {label}
        </a>
      </noscript>
    </div>
  );
}

/* --------------------------------------------------------------- preview */

export function PdfPreviewPane({
  url,
  title,
  fileName,
  expectedBytes,
}: {
  url: string;
  title: string;
  fileName: string;
  expectedBytes?: number;
}) {
  const stream = usePdfStream(url, {
    expectedBytes,
    channel: "preview",
    onTiming: (ms, bytes) => track("pdf_preview", { url, ms: Math.round(ms), bytes }),
  });
  const hovered = useRef(false);
  const startRef = useRef(stream.start);
  startRef.current = stream.start;

  // Prefetch on intent (hover / focus) after a short dwell, cheap enhancement.
  const onIntent = useCallback(() => {
    if (hovered.current) return;
    hovered.current = true;
    window.setTimeout(() => {
      if (hovered.current) void startRef.current();
    }, 220);
  }, []);
  const cancelIntent = useCallback(() => {
    hovered.current = false;
  }, []);

  const { status, percent, receivedBytes, totalBytes, objectUrl, error, start, reset } = stream;

  return (
    <div className="mt-8">
      <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
        Certificate preview
      </h2>

      <div className="relative mt-3 overflow-hidden rounded-2xl border border-border bg-muted">
        {status === "idle" || status === "aborted" ? (
          <button
            type="button"
            onClick={() => void start()}
            onMouseEnter={onIntent}
            onMouseLeave={cancelIntent}
            onFocus={onIntent}
            onBlur={cancelIntent}
            className="flex h-[60vh] w-full flex-col items-center justify-center gap-3 text-center transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <Eye className="h-6 w-6 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-foreground/90">Load certificate preview</span>
            <span className="max-w-xs text-xs text-muted-foreground">
              The PDF ({expectedBytes ? formatBytes(expectedBytes) : "≈1 MB"}) is only fetched when
              you ask for it — press Enter or click to stream it now.
            </span>
          </button>
        ) : status === "loading" ? (
          <div>
            <PdfSkeleton label={`Loading ${title}`} />
            <div className="absolute inset-x-0 top-0 px-3 pt-3">
              <div
                role="progressbar"
                aria-label={`${title} preview loading progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                {...(percent !== null ? { "aria-valuenow": percent } : {})}
              >
                <ProgressBar percent={percent} />
              </div>
            </div>
            <p role="status" aria-live="polite" className="sr-only">
              {percent === null
                ? `Loading preview, ${formatBytes(receivedBytes)} received`
                : `Loading preview, ${percent} percent complete`}
            </p>
          </div>
        ) : status === "error" ? (
          <div className="flex h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-400" aria-hidden />
            <p className="text-sm font-semibold text-foreground/90">Preview unavailable</p>
            <p className="max-w-sm text-xs text-muted-foreground">{error}</p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  reset();
                  void start();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground/90 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Retry
              </button>
              <a
                href={url}
                download={fileName}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground/90 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Download className="h-3.5 w-3.5" aria-hidden /> Download instead
              </a>
            </div>
          </div>
        ) : (
          <object
            data={objectUrl ?? url}
            type="application/pdf"
            className="h-[60vh] w-full"
            aria-label={`${title} certificate PDF`}
          >
            <div className="flex h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
              This browser can’t display PDFs inline.
              <a href={url} download={fileName} className="text-primary underline">
                Download the certificate instead
              </a>
            </div>
          </object>
        )}
      </div>

      {status === "ready" && totalBytes ? (
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          Loaded {formatBytes(totalBytes)} · cached for this page
        </p>
      ) : null}
    </div>
  );
}