import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "tests/e2e/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "tests/**", "e2e/**"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
      "@/lib": resolve(__dirname, "./lib"),
      "@/components": resolve(__dirname, "./components"),
    },
  },
});
