import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";

import type { ResolvedConfig } from "vite";

const originalMcp = mcpPlugin();
const patchedMcp = {
  ...originalMcp,
  configResolved(config: ResolvedConfig) {
    const originalRoot = config.root;
    if (process.platform === "win32" && typeof originalRoot === "string") {
      const mutableConfig = config as unknown as { root: string };
      mutableConfig.root = originalRoot.replace(/\//g, "\\");
    }
    try {
      originalMcp.configResolved?.call(this, config);
    } finally {
      const mutableConfig = config as unknown as { root: string };
      mutableConfig.root = originalRoot;
    }
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [patchedMcp],
  },
});
