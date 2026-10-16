# irbis-web — Architecture

The Irbis **admin panel**: staff manage spots (create, verify, edit), review check-ins and XP, and
see per-spot stats. Desktop-first, used by a small number of authenticated admins. No public
pages, no SEO. (Product summary: `irbis-docs/PROJECT.md`.)

Companion documents — both mandatory:

- **[`engineering-standards.md`](./engineering-standards.md)** — definition of done for every change.
- **`irbis-docs/design/design.md`** — design-token source of truth (shared with `irbis-app`).

---

## Tech Stack

Pinned. Do not substitute or add libraries without explicit approval (recorded here or as an ADR).
Versions are latest stable as of 2026-10-16 — replace with exact installed versions at scaffold time.

| Layer | Technology | Version |
| ----- | ---------- | ------- |
| **Framework** | Next.js (App Router, Turbopack) + React | 16.x / 19.3 |
| **Language** | TypeScript strict | per `PROJECT.md` |
| **Server state** | TanStack Query 5 | 5.x |
| **API client** | **orval**-generated hooks + zod schemas over **axios** | orval 8 / axios 1.x |
| **Tables** | TanStack Table | 9.x |
| **Forms** | react-hook-form + zod | 7.x / 4.x |
| **Styling** | Tailwind CSS 4 + tokens as CSS variables | 4.x |
| **Primitives** | shadcn/ui (Radix-based, copied into `shared/components/ui`) | — |
| **Icons** | lucide-react | — |
| **Toasts** | sonner | 2.x |
| **i18n** | next-intl | 4.x |
| **Tests** | Vitest + Testing Library + MSW | 5 / — / 3 |

**Planned — approve when needed:** map picker for spot location (`react-map-gl`/MapLibre or Google
Maps JS — decide with the spots feature), charts library (first report), Playwright (E2E).

---

## Rendering model

```
Server Components            Client Components
───────────────────          ─────────────────────────────────────────────
app/**/layout.tsx            features/<slug>/components/*  ('use client')
app/**/page.tsx (thin)   →   uses generated hooks → apiClient (axios) → irbis-api
metadata, static shell       forms, tables, dialogs, toasts
```

- The browser talks to `irbis-api` directly (CORS allowlist on the API). Next.js is not a BFF.
- No Server Actions or route handlers proxy API calls (an ADR would be needed to change that).
- `page.tsx` reads `params`/`searchParams` and renders one feature component.

---

## Directory Structure

```
irbis-web/
├── next.config.ts            # security headers, images, next-intl plugin
├── orval.config.ts           # input ../irbis-api/openapi.json → src/shared/api/generated
└── src/
    ├── proxy.ts              # Auth redirect (UX only) + locale handling
    ├── app/
    │   ├── layout.tsx        # <html>, fonts, Providers
    │   ├── providers.tsx     # 'use client' — provider hierarchy (below)
    │   ├── (auth)/
    │   │   └── login/page.tsx
    │   └── (admin)/
    │       ├── layout.tsx    # Shell: sidebar, header, OfflineBanner
    │       ├── page.tsx      # Dashboard
    │       ├── spots/
    │       │   ├── page.tsx            # list
    │       │   ├── new/page.tsx
    │       │   └── [spotId]/page.tsx   # detail / edit
    │       ├── check-ins/page.tsx
    │       ├── users/[userId]/page.tsx
    │       ├── error.tsx  loading.tsx  not-found.tsx
    │
    ├── features/             # Vertical slices — same slug as irbis-api / irbis-app
    │   ├── auth/
    │   ├── dashboard/
    │   ├── spots/
    │   ├── spot-checkin/     # admin views of check-ins (counts per spot, history)
    │   └── users/
    │
    └── shared/
        ├── api/
        │   ├── generated/    # orval output — NEVER edited
        │   ├── client.ts     # axios instance + interceptors (orval mutator)
        │   ├── errors.ts     # ApiError + normaliser
        │   ├── auth.ts       # in-memory access token + single-flight refresh
        │   ├── query.ts      # QueryClient config
        │   └── queryKeys.ts  # non-endpoint keys
        ├── components/
        │   ├── ui/           # Button, Input, Select, Dialog, ConfirmDialog, DataTable,
        │   │                 #   Skeleton, EmptyState, ErrorState, Badge, Toaster…
        │   └── layout/       # Sidebar, Header, PageHeader, OfflineBanner
        ├── config.ts         # typed read of NEXT_PUBLIC_* (public values only)
        ├── hooks/            # useDebounce, useUrlState, useNetworkStatus, usePermission
        ├── i18n/             # next-intl config + messages/<locale>/<feature>.json
        ├── lib/              # cn, format (Intl), geo, dates
        ├── styles/
        │   ├── globals.css
        │   └── tokens.css    # mirrors design.md — only place raw values live
        └── types/            # UI-only types (never API shapes)
```

Rules (enforced by `eslint-plugin-boundaries`):

- `app/` imports from `features/` and `shared/`; contains no logic.
- `features/*` never import from another feature; `shared/*` never imports from `features/*`.
- Only `shared/api/client.ts` imports axios. Only `shared/components/ui/Toaster` imports sonner.

---

## Feature Module Convention

```
features/<slug>/
├── components/     # 'use client' feature UI (ListView, DetailView, Form…)
├── hooks/          # wrappers over generated hooks (invalidation, toast, optimistic)
├── columns.tsx     # DataTable column definitions (if a table)
├── schemas.ts      # form schemas (extend generated zod)
├── utils/
└── __tests__/
```

---

## Domain Model (admin view)

Provisional — the OpenAPI spec is authoritative.

```
Spot      { id, name, description, location: { lat, lng }, radiusM, verified, photoUrls[], createdAt }
CheckIn   { id, spotId, userId, createdAt, xpAwarded }
User      { id, displayName, xp, role: 'user' | 'admin', createdAt }
SpotStats { spotId, checkInsTotal, checkInsToday, uniqueUsers }
```

Admin surfaces show **aggregates by default**. Individual user records appear only where a spec
needs them (e.g. support lookup), never as bulk exports.

---

## Auth & roles

- Login → API returns an access token (kept **in memory** in `shared/api/auth.ts`) and sets the
  refresh token as an **httpOnly, Secure, SameSite** cookie (ADR-001).
- On load / 401: one single-flight `POST /v1/auth/refresh` (cookie sent via `withCredentials`), retry.
  Refresh failure → clear cache, redirect to `/login`.
- `proxy.ts` redirects unauthenticated users away from `(admin)` based on the refresh cookie's
  presence — a convenience, not security.
- Every admin page requires role `admin`; the API enforces it. `usePermission()` hides controls the
  role can't use.
- Deployed so web and API share a registrable domain (e.g. `admin.<domain>` + `api.<domain>`) so the
  cookie works with `SameSite=Lax`.

---

## Data & State Layer

| Concern | Approach |
| ------- | -------- |
| Server data | Generated `useQuery` / `useInfiniteQuery` |
| Writes | Generated `useMutation`, wrapped in `features/<slug>/hooks/` |
| List state (page, sort, filters, search) | URL `searchParams` via `useUrlState` |
| Form state | react-hook-form, local |
| Session | in-memory access token + refresh cookie |
| Global client state | Avoid. Small context if truly needed; no Redux/Zustand without an ADR |

---

## API Layer

`shared/api/client.ts` — one axios instance (orval mutator):

- `baseURL` from `NEXT_PUBLIC_API_URL`, `withCredentials: true`, timeout.
- **Request**: `Authorization: Bearer`, `Accept-Language`, `Idempotency-Key` on non-GET.
- **Response**: normalise to `ApiError`; 401 → single-flight refresh + retry; hand errors to the toast
  layer unless the mutation opted out; field errors returned to forms.

```bash
npm run gen:api     # orval → src/shared/api/generated (react-query + zod)
```

---

## Provider Hierarchy

```tsx
<NextIntlClientProvider>          // messages + locale
  <ThemeProvider>                 // data-theme on <html>, tokens
    <QueryClientProvider>         // TanStack Query (+ Devtools in dev)
      <AuthProvider>              // session bootstrap (refresh on load)
        {children}
        <Toaster />               // sonner, token-themed, inside i18n + theme
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
</NextIntlClientProvider>
```

`AuthProvider` sits inside `QueryClientProvider` so sign-out can clear the cache.

---

## Environments

- `development`, `staging`, `production`. Config via env vars only; `.env.example` committed,
  `.env.local` filled in by a human and never read by Claude.
- Only `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_ENV` are exposed to the browser.

---

## Decisions

| # | Decision | Resolution |
| - | -------- | ---------- |
| 1 | Data fetching | Client-side via generated TanStack Query hooks; Server Components for the shell. |
| 2 | BFF | None. Browser → API directly; CORS allowlist on the API. |
| 3 | Token storage | Access token in memory; refresh token httpOnly cookie (ADR-001). |
| 4 | UI kit | shadcn/ui primitives owned in-repo on Tailwind 4 + tokens. |
| 5 | List state | URL search params. |

> Extend this doc as pages land: add routes to **Directory Structure**, entities to **Domain Model**,
> libraries to **Tech Stack** with their approval.
