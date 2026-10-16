import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV === "development";

/** The browser calls irbis-api directly (no BFF), so its origin must be allowed for XHR. */
function apiOrigin(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("NEXT_PUBLIC_API_URL is not set (see .env.example).");
  return new URL(url).origin;
}

function contentSecurityPolicy(): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin()}${isDev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(apiOrigin().startsWith("https:") ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

/** Built lazily so tooling that loads this file (typegen, lint) does not need the env. */
const securityHeaders = () => [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/shared/i18n/request.ts");

export default withNextIntl(nextConfig);
