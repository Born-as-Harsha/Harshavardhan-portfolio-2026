import { describe, expect, it } from "vitest";
import { backoffDelay } from "../use-pdf-stream";

describe("preview retry backoff", () => {
  it("grows exponentially and stays within the cap", () => {
    for (let attempt = 0; attempt < 8; attempt++) {
      const d = backoffDelay(attempt, 500, 8000);
      const ceiling = Math.min(8000, 500 * 2 ** attempt);
      expect(d).toBeGreaterThanOrEqual(Math.floor(ceiling / 2));
      expect(d).toBeLessThanOrEqual(ceiling);
    }
  });

  it("applies jitter so retries do not stampede", () => {
    const samples = new Set(Array.from({ length: 40 }, () => backoffDelay(3)));
    expect(samples.size).toBeGreaterThan(1);
  });
});