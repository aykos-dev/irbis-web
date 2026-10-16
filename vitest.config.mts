import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Same origin as NEXT_PUBLIC_API_URL below: jsdom enforces CORS on XHR and MSW
    // handlers should not have to fake CORS headers.
    environmentOptions: { jsdom: { url: "http://api.test" } },
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
