import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // Component tests are .tsx — use React 17+ automatic JSX so they don't each
  // have to import React, matching how Next compiles the app itself.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
