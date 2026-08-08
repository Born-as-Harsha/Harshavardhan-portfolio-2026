import { useEffect, useState, useSyncExternalStore } from "react";
import { Activity, Trash2, X } from "lucide-react";
import { telemetry, telemetryPanelEnabled, type TelemetryEvent } from "@/lib/telemetry";
import { t } from "@/lib/i18n";
import { formatBytes } from "@/lib/use-pdf-stream";

function ms(v?: number) {
  if (v === undefined) return "—";
  return `${Math.round(v)}ms`;
}

function Row({ e }: { e: TelemetryEvent }) {
  const tone =
    e.kind === "error"
      ? "text-amber-400"
      : e.kind === "cancel"
        ? "text-muted-foreground"
        : e.kind === "complete"
          ? "text-primary"
          : "text-foreground/80";
  return (
    <tr className="border-t border-border/60 align-top">
      <td className="py-1 pr-2 font-mono text-[10px] text-muted-foreground">
        {new Date(e.at).toISOString().slice(11, 23)}
      </td>
      <td className={`py-1 pr-2 font-mono text-[10px] ${tone}`}>
        {e.channel}/{e.kind}
      </td>
      <td className="py-1 pr-2 font-mono text-[10px] text-muted-foreground">{ms(e.elapsedMs)}</td>
      <td className="py-1 font-mono text-[10px] text-muted-foreground">
        {e.chunkBytes !== undefined ? `+${formatBytes(e.chunkBytes)} ` : ""}
        {e.totalBytes !== undefined ? formatBytes(e.totalBytes) : ""}
        {e.message ? ` · ${e.message}` : ""}
      </td>
    </tr>
  );
}

/**
 * Opt-in, non-blocking debug panel. Enabled via `?debug=1`, a localStorage
 * flag, or dev builds. Renders nothing in production unless explicitly on.
 */
export function TelemetryPanel() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setEnabled(telemetryPanelEnabled()), []);

  const events = useSyncExternalStore(
    telemetry.subscribe,
    telemetry.getSnapshot,
    () => [] as TelemetryEvent[],
  );

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <section
          aria-label={t("telemetry.title")}
          className="pointer-events-auto max-h-[50vh] w-[min(92vw,32rem)] overflow-auto rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur"
        >
          <header className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {t("telemetry.title")} · {t("telemetry.session")} {telemetry.sessionId}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => telemetry.clear()}
                aria-label={t("telemetry.clear")}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("telemetry.close")}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </header>

          {events.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">{t("telemetry.empty")}</p>
          ) : (
            <table className="mt-2 w-full table-auto">
              <caption className="sr-only">PDF preview and download telemetry events</caption>
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase text-muted-foreground">
                  <th scope="col" className="pr-2 font-normal">
                    Time
                  </th>
                  <th scope="col" className="pr-2 font-normal">
                    Event
                  </th>
                  <th scope="col" className="pr-2 font-normal">
                    Elapsed
                  </th>
                  <th scope="col" className="font-normal">
                    Bytes
                  </th>
                </tr>
              </thead>
              <tbody>
                {events
                  .slice()
                  .reverse()
                  .map((e) => (
                    <Row key={e.id} e={e} />
                  ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t("telemetry.close") : t("telemetry.open")}
        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background/90 text-primary shadow-lg backdrop-blur hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Activity className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
