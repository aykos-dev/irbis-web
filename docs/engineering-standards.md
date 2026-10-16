# Engineering Standards — irbis-web (Next.js admin)

These are the **definition of done** for every change in this repo. A page that works but skips
these is not finished. Read with [`architecture.md`](./architecture.md).

If a feature ships without an item below, the reason is written in the feature spec
(`irbis-docs/features/<slug>.md`) and the wrap-up summary — never silently omitted.

> Applied proactively on every feature, even when the request doesn't mention them.
> The `reviewer` agent checks the Quick gate on every diff.

---

## Quick gate

- [ ] All server data through **orval-generated hooks** over the axios `apiClient`. No raw `fetch`, no hand-written API types
- [ ] Every data surface has loading, empty, error **and** offline states; empty-filtered ≠ empty-no-data
- [ ] Every mutation surfaces its result (toast, or the page visibly shows the outcome)
- [ ] Forms: pristine / validating / success / error states; server field errors land on fields
- [ ] Destructive actions confirm (or offer Undo when reversible server-side)
- [ ] Tokens only — no raw hex, no arbitrary Tailwind values (`p-[13px]`, `bg-[#…]`), no inline `style` except truly dynamic values
- [ ] Shared primitives from `shared/components/ui` — no one-off Button/Input/Dialog
- [ ] Fully keyboard-operable, visible focus, semantic HTML, labelled controls, axe-clean
- [ ] Lists/tables: server-side pagination, sort and filter; state lives in the URL
- [ ] Zero hardcoded user-facing strings; dates/numbers via `Intl`; layout survives +40% text
- [ ] Works at 1280px and down to 1024px; nothing breaks at 768px
- [ ] Permission-aware UI: hides/disables what the role can't do (the API still enforces)
- [ ] `npm run check` green; tests written from the spec's acceptance criteria

---

## 1. Server vs client components

**Rule:** Server Components for structure, Client Components for data and interaction.

- Layouts, page shells, static copy and metadata are **Server Components** (the default).
- Anything that uses API data, TanStack Query, forms or browser APIs is a **Client Component**
  (`'use client'`) under `features/<slug>/components/`.
- `page.tsx` files stay thin: read route params / search params, render the feature's
  top-level component. No business logic in `app/`.
- No server-side calls to the API with the user's token (no token forwarding through Server
  Components) unless an ADR introduces it.
- Heavy client-only components (charts, maps, rich editors) load with `next/dynamic`.

## 2. Data layer — orval + TanStack Query + axios

**Rule:** all server communication goes through the **orval-generated** client in
`src/shared/api/generated/`, which calls the single axios instance in `shared/api/client.ts`.
Raw `fetch`, Server Actions calling the API, and hand-written API types are banned.

- `npm run gen:api` regenerates from `../irbis-api/openapi.json`. Generated files are never edited.
- **Every** read is a generated `useQuery` / `useInfiniteQuery`; **every** write a generated
  `useMutation`, wrapped in `features/<slug>/hooks/` when it needs invalidation, optimistic
  update or a toast.
- **Query keys** from orval's generated `get…QueryKey()` helpers; non-endpoint keys in
  `shared/api/queryKeys.ts`. Never an inline array.
- After a mutation, **invalidate precisely** (the list + the detail), never `invalidateQueries()` with no key.
- Stale times set deliberately in `shared/api/query.ts` per data shape.
- Errors are typed `ApiError { code, message, fieldErrors? }`. Branch on `code`, never on message text.
- Optimistic updates only where a wrong state for 300ms is harmless (toggles, reorder); never for
  anything granting value (XP adjustments, rewards).

## 3. Tables & lists

- **TanStack Table** behind `shared/components/ui/DataTable` — features configure columns, not markup.
- Pagination, sorting and filtering are **server-side**, cursor-based (ADR-003).
- **URL is the state**: page cursor, sort, filters and search live in `searchParams`, so every view
  is linkable and survives refresh/back. Debounce search input (300ms).
- Row actions in a row menu; bulk actions only when the spec asks.
- Column widths stable across loading → loaded (skeleton rows match columns).

## 4. Forms & validation

`react-hook-form` + `zod` using the **orval-generated zod schemas**, extended locally for UI-only
rules. One schema per form, colocated in the feature (`schemas.ts`).

| State | When | Visual |
| ----- | ---- | ------ |
| **Pristine** | untouched | default border token, muted placeholder |
| **Validating** | async check in flight | spinner in the field's trailing slot |
| **Success** | valid and confirmation is reassuring (unique slug, verified address) | success border + check |
| **Error** | invalid after blur or on submit | error border + message below, linked via `aria-describedby` |

- Validate on blur; re-validate on change after a field has errored. Never on first keystroke.
- Submit is never disabled to signal invalidity — submit, show errors, focus the first invalid field.
- Submit button shows a pending state and prevents double submission.
- Server `fieldErrors` map onto the matching fields; only non-field errors become a toast.
- Dirty forms warn before navigation away (route change and `beforeunload`).

## 5. Feedback — toasts & confirmations

- **sonner** via the shared `Toaster` (themed with tokens). Never call it with raw copy — i18n keys.
- Every mutation reports success or failure. Errors are actionable where retry is possible.
- Wired into the axios interceptor so nothing fails silently; a mutation may opt out only when the
  page itself shows the outcome.
- **Destructive** actions: `ConfirmDialog` naming the thing being destroyed — or an Undo toast if the
  API supports restoring it.
- Field validation errors are never toasts.

## 6. Loading, empty, error & offline states

**Rule:** every surface that renders server data has four designed states.

- **Loading** — skeletons shaped like the content (table rows, cards). Route-level `loading.tsx`
  only for the shell.
- **Empty** — icon, one-line explanation, primary action. **Filtered-empty** ("No spots match —
  Clear filters") is a different message from **no-data** ("No spots yet — Create spot").
- **Error** — plain-language message + Retry wired to `refetch`. Route `error.tsx` boundaries per
  section. Never show raw error text or status codes.
- **Offline** — persistent banner (`navigator.onLine` + TanStack `onlineManager`); cached data stays
  visible; writes are refused with a clear reason.
- **Forbidden (403)** — explains the missing permission; not a generic error.
- Built with the happy path, never retrofitted.

## 7. Styling & design tokens

- **Tailwind CSS 4**. Tokens from `irbis-docs/design/design.md` are mirrored as CSS variables in
  `src/shared/styles/tokens.css` and mapped in the Tailwind `@theme`. That file is the only place
  raw colour values or font sizes appear.
- New visual values go into `design.md` first, then the mirror.
- **No arbitrary values** (`w-[317px]`, `text-[#333]`) and no inline `style` except truly dynamic
  values (computed widths, chart colours).
- Primitives in `shared/components/ui` (shadcn/ui-style, owned in-repo). Variants via `cva`;
  class merging via the `cn()` helper. Features never restyle primitives ad hoc — add a variant.
- Dark mode via the token layer (`data-theme`), never per-component colour branches.
- Logical properties (`ms-*`, `me-*`, `ps-*`, `start-*`) instead of left/right, so RTL is cheap later.

## 8. Accessibility

- Semantic HTML first: `button` for actions, `a`/`Link` for navigation, real `table` markup, `label` for every input.
- Fully **keyboard-operable**: tab order follows reading order; dialogs/menus trap focus and restore it on close; `Esc` closes.
- **Visible focus** ring from tokens on every interactive element; never `outline: none` without a replacement.
- Icon-only buttons have `aria-label`. Status never conveyed by colour alone.
- Live regions announce async results (toasts already do; inline save states use `aria-live="polite"`).
- Respect `prefers-reduced-motion`.
- Each page has one `h1` and a meaningful `<title>` (via `metadata`).
- Component tests include an axe check (`vitest-axe` or equivalent) for new primitives and pages.

## 9. Motion & interaction

- Every interactive element has hover, active, focus-visible and disabled states.
- Transitions 150ms (hover/press), 200–250ms (enter/exit of popovers, dialogs, toasts).
  Nothing over 300ms. CSS transitions or the primitives' built-in animations; no animation library
  without approval.

## 10. Internationalisation

- **next-intl**. Messages in `src/shared/i18n/messages/<locale>/<feature>.json`; supported locales in
  `irbis-docs/PROJECT.md`.
- Zero hardcoded copy in components, including `aria-label`, placeholders, toasts and `metadata`.
- Plurals and interpolation via ICU messages — never concatenation.
- Dates, numbers, distances via next-intl formatters / `Intl`. API times are UTC; display converts
  to the admin's timezone and states it where ambiguity matters.
- Layout tolerates **+40% text length** (Russian, Uzbek, Kazakh are long).

## 11. Routing & navigation

- App Router route groups: `(auth)` for public pages, `(admin)` for the authenticated shell.
- Route protection in `src/proxy.ts` (Next 16's replacement for `middleware.ts`) is a **UX
  redirect only**; the API is the authority (global guard, ADR-001).
- IDs in the URL, never serialized objects. Detail pages are deep-linkable.
- `Link` for navigation; `router.push` only after an action completes.
- `not-found.tsx` for unknown ids (404 from the API maps to it).

## 12. Security

- Access token **in memory only**; refresh token is an **httpOnly, Secure, SameSite** cookie set by
  the API (ADR-001). Never `localStorage`/`sessionStorage` for tokens.
- `NEXT_PUBLIC_*` env vars are public by definition — only the API base URL and env name go there.
  No other env var is read in client code.
- No `dangerouslySetInnerHTML` without sanitising (and a review note).
- Security headers (CSP, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`) in `next.config.ts`.
- Never log tokens or personal data to the console or any logger.
- Bulk exports of users (CSV etc.) require an explicit spec + ADR; default is aggregated views only.

## 13. Performance

- Server Components by default keep client JS small; `'use client'` at the lowest possible level.
- `next/image` for images, `next/font` for fonts (self-hosted, no layout shift).
- No full-library imports where a per-module import exists (`lodash`, icon sets).
- Lists over ~100 rows render paginated, never all at once.

## 14. Testing

- **Vitest** + **@testing-library/react** + **MSW** (mock at the HTTP boundary, never our own hooks).
- Tests written from the spec's acceptance criteria **before** implementation.
- Test behaviour: render the feature component, interact, assert visible results and states
  (loading / empty / error included).
- Pure utilities in `shared/lib` unit-tested exhaustively.
- Never modify, skip or weaken an existing test to make it pass — report it.
- E2E (Playwright) is not adopted yet; add via ADR when flows stabilise.

---

## Libraries these standards require

| Library | For |
| ------- | --- |
| `next`, `react`, `react-dom` | framework |
| `@tanstack/react-query`, `axios`, `orval` (dev) | §2 data |
| `@tanstack/react-table` | §3 tables |
| `react-hook-form`, `zod` | §4 forms |
| `sonner` | §5 toasts |
| `tailwindcss` 4, `class-variance-authority`, `clsx`, `tailwind-merge` | §7 styling |
| Radix primitives (via shadcn/ui, owned in-repo), `lucide-react` | §7–8 primitives & icons |
| `next-intl` | §10 i18n |
| `vitest`, `@testing-library/react`, `msw` | §14 tests |

**Deliberately not adopted yet** (raise via ADR): analytics, error reporting (Sentry), Playwright
E2E, charts library (choose when the first report lands).
