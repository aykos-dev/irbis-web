/**
 * The refresh cookie is httpOnly and scoped to the API's path, so the web origin (and proxy.ts)
 * can never see it. This is a non-secret "a session probably exists" marker the proxy reads to
 * redirect without a flash. UX only — the API is the authority.
 */
export const SESSION_HINT_COOKIE = "irbis_admin_session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function setSessionHint(): void {
  document.cookie = `${SESSION_HINT_COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearSessionHint(): void {
  document.cookie = `${SESSION_HINT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
