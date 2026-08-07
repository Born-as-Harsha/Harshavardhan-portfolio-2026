import { describe, expect, it } from "vitest";
import { formatBytes } from "../use-pdf-stream";

describe("formatBytes", () => {
  it("renders KB below a megabyte", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(250 * 1024)).toBe("250 KB");
  });
  it("renders MB at or above a megabyte", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(2.5 * 1024 * 1024)).toBe("2.5 MB");
  });
  it("guards against invalid input", () => {
    expect(formatBytes(0)).toBe("0 KB");
    expect(formatBytes(Number.NaN)).toBe("0 KB");
  });
});
