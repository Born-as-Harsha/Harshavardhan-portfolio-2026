/**
 * Minimal i18n dictionary. Single locale today; the `t()` indirection keeps
 * every user-visible string in one place so adding a locale is additive.
 */
export const en = {
  "about.yearStatus": "I am currently neither a second-year nor a third-year student.",
  "stats.cgpaNote": "Top of class, ECE",

  "pdf.download": "Download certificate (PDF)",
  "pdf.downloading": "Downloading…",
  "pdf.retry": "Retry download",
  "pdf.cancel": "Cancel",
  "pdf.canceled": "Download canceled.",
  "pdf.failed": "Couldn’t download the file. Check your connection and retry.",

  "telemetry.title": "Telemetry",
  "telemetry.open": "Open telemetry panel",
  "telemetry.close": "Close telemetry panel",
  "telemetry.session": "Session",
  "telemetry.empty": "No events yet. Start a preview or download.",
  "telemetry.clear": "Clear events",
} as const;

export type TranslationKey = keyof typeof en;

export function t(key: TranslationKey): string {
  return en[key];
}
