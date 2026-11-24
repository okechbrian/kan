import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite's postcss config loader cannot read this path on Windows (spaces in
  // "New folder"). Tests do not compile CSS, so supply an inline config.
  css: { postcss: { plugins: [] } },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
