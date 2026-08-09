import { beforeEach, describe, expect, it } from "vitest";
import {
  buildTelemetryExport,
  redactMessage,
  startTrace,
  telemetry,
  telemetryExportFileName,
} from "../telemetry";

describe("telemetry export", () => {
  beforeEach(() => telemetry.clear());

  it("emits a versioned, session-scoped envelope", () => {
    const trace = startTrace("download", "/certs/a.pdf");
    trace.chunk(10, 10, 10);
    trace.complete(10);
    const payload = buildTelemetryExport();
    expect(payload.schema).toBe("lovable.pdf-telemetry/v1");
    expect(payload.sessionId).toBe(telemetry.sessionId);
    expect(payload.eventCount).toBe(payload.events.length);
    expect(payload.truncated).toBe(false);
  });

  it("redacts emails, urls and long tokens from messages", () => {
    expect(redactMessage("failed for a@b.com")).toContain("[redacted-email]");
    expect(redactMessage("GET https://cdn.example.com/x?token=1")).toContain("[redacted-url]");
    expect(redactMessage("id AAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toContain("[redacted-token]");
  });

  it("never leaks query strings through resource names", () => {
    startTrace("preview", "https://cdn.example.com/certs/a.pdf?token=supersecret");
    expect(JSON.stringify(buildTelemetryExport())).not.toContain("supersecret");
  });

  it("truncates oldest events to respect the size cap", () => {
    for (let i = 0; i < 200; i++) startTrace("download", `/certs/${i}.pdf`);
    const payload = buildTelemetryExport(undefined, 2000);
    expect(payload.truncated).toBe(true);
    expect(JSON.stringify(payload).length).toBeLessThanOrEqual(2000);
  });

  it("builds a filesystem-safe file name", () => {
    expect(telemetryExportFileName(new Date("2026-08-09T04:00:00Z"))).toMatch(
      /^telemetry-.+-2026-08-09T04-00-00-000Z\.json$/,
    );
  });
});