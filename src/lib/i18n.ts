/**
 * Minimal i18n dictionary. Single locale today; the `t()` indirection keeps
 * every user-visible string in one place so adding a locale is additive.
 */
export const en = {
  "about.yearStatus": "I am currently a third-year student.",
  "about.yearLabel": "Third year",
  "stats.cgpaNote": "Top of class, third-year ECE",

  "pdf.download": "Download certificate (PDF)",
  "pdf.downloading": "Downloading…",
  "pdf.retry": "Retry download",
  "pdf.cancel": "Cancel",
  "pdf.canceled": "Download canceled.",
  "pdf.failed": "Couldn’t download the file. Check your connection and retry.",

  "preview.retrying": "Preview failed — retrying…",
  "preview.fallbackTitle": "Inline preview unavailable",
  "preview.fallbackBody":
    "We tried loading the preview several times without success. You can still download the certificate — the file itself is fine.",

  "telemetry.title": "Telemetry",
  "telemetry.open": "Open telemetry panel",
  "telemetry.close": "Close telemetry panel",
  "telemetry.session": "Session",
  "telemetry.empty": "No events yet. Start a preview or download.",
  "telemetry.clear": "Clear events",
  "telemetry.export": "Export session JSON",
} as const;

export type TranslationKey = keyof typeof en;

export function t(key: TranslationKey): string {
  return en[key];
}
