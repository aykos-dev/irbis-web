# irbis-web — rules for a coding run (read this, not the full docs)

Full detail only if the brief points you there: `docs/architecture.md`, `docs/engineering-standards.md`.

## Shape
- Next.js 16 App Router admin panel · Tailwind 4 with tokens (`shared/styles/tokens.css`) · shadcn-style primitives owned
  in `shared/components/ui` · TanStack Query + Table · orval hooks over the one axios client · react-hook-form + zod ·
  next-intl (en/ru/uz) · sonner · Vitest + Testing Library + MSW.
- `src/app/` routes only (thin `page.tsx`) · `src/features/<slug>/` client components, hooks, columns, schemas (never
  import another feature) · `src/shared/`.
- Reuse before writing: `ui/` (Button, Input, Select, Field, Dialog, ConfirmDialog, ActionDialog, DataTable, Skeleton,
  EmptyState, ErrorState, Badge, StatTile, LineChart, Toaster), `layout/` (Sidebar, Header, PageHeader, OfflineBanner,
  BrandMark), hooks (useDebounce, useUrlState, useNetworkStatus, usePermission), `shared/api/session.ts`.
- API only via `npm run gen:api` hooks; admin session = access token in memory + httpOnly refresh cookie.

## Every page (the Quick gate, short form)
Tokens only (no arbitrary Tailwind values, no inline style) · loading / empty (filtered ≠ no data) / error + retry /
offline (refuse writes) · toasts on mutations · destructive = confirm dialog with reason · list state in the URL ·
server pagination · keyboard-operable, labelled, visible focus · every string via next-intl in en, ru AND uz ·
`data-testid` names from the brief · phones only as the API masks them.

## Tests (budget)
1–3 tests per AC in the brief (render → act → assert), MSW at the HTTP boundary, one axe check per new page.

## Commands — quiet, always
- `npm run check` (lint · typecheck · vitest · slop; failures only). `npm run build` when routes change
  (`NEXT_PUBLIC_API_URL=http://localhost:3000 NEXT_PUBLIC_ENV=dev npm run build 2>&1 | tail -15`).
- `npm i --silent --no-audit --no-fund <pkg>` only for packages the brief approves. Long output: `| tail -30`.

## Finish
Commit on the branch the brief names (Conventional message + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`),
no push. Reply ≤10 lines: what changed, deviations, last line of `npm run check`.
