import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    env: {
      NEXT_PUBLIC_API_URL: "http://api.test",
      NEXT_PUBLIC_ENV: "dev",
    },
    restoreMocks: true,
  },
});
