import { describe, expect, it } from "vitest";
import { nextAnnouncedStep, progressMessage } from "../a11y-progress";

describe("nextAnnouncedStep", () => {
  it("announces the first bucket then only on 10% increases", () => {
    expect(nextAnnouncedStep(null, 3)).toBe(0);
    expect(nextAnnouncedStep(0, 9)).toBeNull();
    expect(nextAnnouncedStep(0, 12)).toBe(10);
    expect(nextAnnouncedStep(10, 19)).toBeNull();
    expect(nextAnnouncedStep(10, 100)).toBe(100);
  });
  it("stays silent for indeterminate progress", () => {
    expect(nextAnnouncedStep(null, null)).toBeNull();
    expect(nextAnnouncedStep(null, Number.NaN)).toBeNull();
  });
});

describe("progressMessage", () => {
  const base = { label: "certificate", receivedLabel: "120 KB" } as const;
  it("covers each state", () => {
    expect(progressMessage({ ...base, status: "loading", percent: 40 })).toContain("40 percent");
    expect(progressMessage({ ...base, status: "loading", percent: null })).toContain("120 KB");
    expect(progressMessage({ ...base, status: "ready", percent: 100 })).toContain("complete");
    expect(progressMessage({ ...base, status: "aborted", percent: null })).toContain("canceled");
    expect(progressMessage({ ...base, status: "error", percent: null, error: "boom" })).toContain(
      "boom",
    );
  });
});
