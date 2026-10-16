# irbis-web

Next.js (App Router) admin panel. Project-wide rules: `../irbis-docs/CLAUDE.md`. Versions: `../irbis-docs/PROJECT.md`.

## Commands
- `npm run check` — lint + typecheck + tests + slop grep, failures only. Must be green before "done".
- `npm run gen:api` — orval from `../irbis-api/openapi.json` → `src/api/generated/`. Never edit generated files.
- `npm run test -- <path>` — single test file.

## Layout
- `src/app/` — routes only; thin, import from features.
- `src/features/<slug>/` — components, hooks, forms for that feature. No imports from other features.
- `src/api/generated/` — typed client + TanStack Query hooks. The only way to call the API.
- `src/components/ui/` — shared primitives. `src/theme/tokens.ts` — all colours/spacing/type.

## Shared modules — check before creating anything new
<!-- Keep this list current. -->
- `src/components/ui/` — Button, Input, Table, Dialog, EmptyState, ErrorState, Spinner, Toast
- `src/lib/` — formatDate, formatNumber, cn
- `src/api/mutator.ts` — the single HTTP client (auth header, refresh, error mapping)

## Errors and states
Every data view: loading, empty, error (with retry). Mutations show toast on error.
Route-level `error.tsx` boundaries. No `console.log` as handling, no swallowed errors.
