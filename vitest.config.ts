import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Playwright specs live in e2e/ and are run by `bunx playwright test`.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["e2e/**", "node_modules/**"],
  },
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});
