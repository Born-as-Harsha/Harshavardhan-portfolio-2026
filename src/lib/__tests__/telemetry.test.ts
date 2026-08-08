import { beforeEach, describe, expect, it } from "vitest";
import { safeResourceName, startTrace, telemetry } from "../telemetry";

describe("telemetry", () => {
  beforeEach(() => telemetry.clear());

  it("strips query strings and paths from resource names", () => {
    expect(safeResourceName("https://cdn.example.com/a/b/cert.pdf?token=secret")).toBe("cert.pdf");
    expect(safeResourceName(undefined)).toBe("unknown");
  });

  it("records a full request lifecycle with byte accounting", () => {
    const trace = startTrace("download", "https://cdn.example.com/cert.pdf?t=1");
    trace.chunk(100, 100, 300);
    trace.chunk(200, 300, 300);
    trace.lastByte(300);
    trace.complete(300);

    const kinds = telemetry.getSnapshot().map((e) => e.kind);
    expect(kinds).toEqual([
      "request_start",
      "first_byte",
      "chunk",
      "chunk",
      "last_byte",
      "complete",
    ]);
    const last = telemetry.getSnapshot().at(-1)!;
    expect(last.totalBytes).toBe(300);
    expect(last.sessionId).toBe(telemetry.sessionId);
    expect(JSON.stringify(telemetry.getSnapshot())).not.toContain("secret");
  });

  it("records cancel and error states", () => {
    const trace = startTrace("preview", "/x/cert.pdf");
    trace.chunk(50, 50, null);
    trace.cancel(50);
    trace.error("Request failed (500)", 50);
    const kinds = telemetry.getSnapshot().map((e) => e.kind);
    expect(kinds).toContain("cancel");
    expect(kinds).toContain("error");
  });

  it("notifies subscribers", () => {
    let calls = 0;
    const unsub = telemetry.subscribe(() => calls++);
    startTrace("download", "/a.pdf");
    unsub();
    startTrace("download", "/b.pdf");
    expect(calls).toBe(1);
  });
});
