import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

/**
 * Arbitrary Tailwind values (`p-[13px]`, `bg-[#333]`, `[--x:1px]`) bypass the token layer.
 * Arbitrary *variants* (`data-[state=open]:`, `[&_svg]:`) are selectors and stay allowed,
 * hence the `(?!:)`.
 */
const ARBITRARY_VALUE = String.raw`/(-|^|\s)\[[^\]\s]+\](?!:)/`;
const ARBITRARY_VALUE_MESSAGE =
  "Arbitrary Tailwind values are banned — use a token from tokens.css (add it to design.md first).";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", "src/shared/api/generated/**"]),

  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${ARBITRARY_VALUE}]`, message: ARBITRARY_VALUE_MESSAGE },
        { selector: `TemplateElement[value.raw=${ARBITRARY_VALUE}]`, message: ARBITRARY_VALUE_MESSAGE },
      ],
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: "Use the orval-generated hooks over shared/api/client.ts." },
        { name: "localStorage", message: "Never store tokens or server data in localStorage." },
        { name: "sessionStorage", message: "Never store tokens or server data in sessionStorage." },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "axios", message: "Only src/shared/api/client.ts imports axios." },
            { name: "sonner", message: "Import Toaster/toast from @/shared/components/ui/toaster." },
            { name: "clsx", message: "Use cn from @/shared/lib/cn." },
            { name: "tailwind-merge", message: "Use cn from @/shared/lib/cn." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/api/client.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "sonner", message: "Use the shared Toaster." }] }],
    },
  },
  {
    files: ["src/shared/components/ui/toaster.tsx"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "axios", message: "Only shared/api/client.ts." }] }],
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**", partialMatch: false },
        { type: "feature", pattern: "src/features/*/**", partialMatch: false, capture: ["feature"] },
        { type: "shared", pattern: "src/shared/**", partialMatch: false },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: { to: { element: { types: ["app", "feature", "shared"] } } },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: [
                  { element: { type: "feature", captured: { feature: "{{from.element.captured.feature}}" } } },
                  { element: { type: "shared" } },
                ],
              },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
          ],
        },
      ],
    },
  },

  {
    files: ["src/**/__tests__/**", "src/**/*.test.{ts,tsx}", "test/**"],
    rules: {
      "no-restricted-globals": "off",
    },
  },
]);
