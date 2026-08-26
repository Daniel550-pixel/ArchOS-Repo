import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    clearMocks: true,
    include: ["frontend/src/**/*.test.tsx", "src/**/*.test.tsx"],
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});

