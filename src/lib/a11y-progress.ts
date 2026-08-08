/**
 * Pure helpers for screen-reader progress announcements.
 * Announcing every chunk floods AT, so we only announce start, 10% steps,
 * completion, cancel, and error.
 */
export const ANNOUNCE_STEP = 10;

/** Returns the step bucket (0,10,20…100) or null when nothing should be said. */
export function nextAnnouncedStep(lastStep: number | null, percent: number | null): number | null {
  if (percent === null || !Number.isFinite(percent)) return null;
  const clamped = Math.max(0, Math.min(100, percent));
  const step = Math.floor(clamped / ANNOUNCE_STEP) * ANNOUNCE_STEP;
  if (lastStep !== null && step <= lastStep) return null;
  return step;
}

export type AnnounceInput = {
  label: string;
  status: "idle" | "loading" | "ready" | "error" | "aborted";
  percent: number | null;
  receivedLabel: string;
  error?: string | null;
};

export function progressMessage({
  label,
  status,
  percent,
  receivedLabel,
  error,
}: AnnounceInput): string {
  switch (status) {
    case "loading":
      return percent === null
        ? `Downloading ${label}, ${receivedLabel} received`
        : `Downloading ${label}, ${percent} percent complete`;
    case "ready":
      return `${label} download complete`;
    case "aborted":
      return `${label} download canceled`;
    case "error":
      return `Download failed: ${error ?? "unknown error"}. Use the retry button.`;
    default:
      return "";
  }
}
