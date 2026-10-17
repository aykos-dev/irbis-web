/**
 * Admin session plumbing (ADR-001): the access token lives in module memory only — never in
 * storage — and is renewed from the httpOnly refresh cookie. Refreshes are single-flight so a
 * burst of 401s (or the bootstrap refresh racing a request) triggers exactly one network call.
 */

type Refresher = () => Promise<string>;
type ExpiredHandler = () => void;

let accessToken: string | null = null;
let refresher: Refresher | null = null;
let expiredHandler: ExpiredHandler | null = null;
let inFlight: Promise<string> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Registered once by AuthProvider; keeps this module free of generated-client imports. */
export function registerSessionHandlers(handlers: { refresh: Refresher; onExpired: ExpiredHandler } | null): void {
  refresher = handlers?.refresh ?? null;
  expiredHandler = handlers?.onExpired ?? null;
}

/** One refresh at a time; every caller awaits the same promise. Rejects when the session is gone. */
export function refreshAccessToken(): Promise<string> {
  if (!refresher) return Promise.reject(new Error("No session refresher registered"));
  if (!inFlight) {
    inFlight = refresher()
      .then((token) => {
        accessToken = token;
        return token;
      })
      .catch((error: unknown) => {
        accessToken = null;
        throw error;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

/** The refresh failed after a 401: tell the session owner to clear state and go to /login. */
export function notifySessionExpired(): void {
  accessToken = null;
  expiredHandler?.();
}
