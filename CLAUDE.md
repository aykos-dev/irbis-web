# irbis-web

Next.js (App Router) admin panel. Desktop-first, authenticated admins only.

**Before any change read:** `docs/architecture.md` (structure, stack, decisions) and
`docs/engineering-standards.md` (definition of done — its Quick gate must pass).
Project-wide rules: `../irbis-docs/CLAUDE.md`. Tokens: `../irbis-docs/design/design.md`.
Next.js 16 changed APIs (e.g. `proxy.ts` replaces `middleware.ts`) — check Context7 when unsure.

## Commands
- `npm run check` — lint + typecheck + tests + slop grep, failures only. Green before "done".
- `npm run gen:api` — orval from `../irbis-api/openapi.json` → `src/shared/api/generated/`. Never edit generated files.
- `npm run test -- <path>` — single test file (Vitest).
- `npm run dev` — local dev server.

## Layout (details in docs/architecture.md)
- `src/app/` — routes only (`(auth)`, `(admin)`); thin `page.tsx` renders one feature component.
- `src/features/<slug>/` — client components, hooks, columns, schemas. Never import another feature.
- `src/shared/` — api (client, generated, auth), components (`ui/`, `layout/`), hooks, i18n, lib, styles (tokens.css).

## Shared modules — check before creating anything new
- `shared/components/ui/` — Button, Input, Select, Dialog, ConfirmDialog, DataTable, Skeleton, EmptyState, ErrorState, Badge, Toaster
- `shared/components/layout/` — Sidebar, Header, PageHeader, OfflineBanner
- `shared/lib/` — cn, format (Intl), geo, dates
- `shared/hooks/` — useDebounce, useUrlState, useNetworkStatus, usePermission
- `shared/api/client.ts` — the only axios instance

## Non-negotiables (from the standards)
Generated hooks only · four data states + filtered-empty · toasts on mutations · URL holds list state ·
tokens only, no arbitrary Tailwind values · keyboard-operable + labelled · next-intl for every string ·
access token in memory, never localStorage.
