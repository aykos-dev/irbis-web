import { useSyncExternalStore } from "react";

/**
 * In-memory stand-in for next/navigation so components that read and write the URL
 * (useUrlState, redirects) run unchanged in jsdom. Tests read the result with `currentUrl()`.
 */
type UrlState = { pathname: string; search: string; params: URLSearchParams };

let state: UrlState = { pathname: "/", search: "", params: new URLSearchParams() };
const listeners = new Set<() => void>();

function navigate(href: string): void {
  const url = new URL(href, "http://localhost");
  state = { pathname: url.pathname, search: url.search, params: new URLSearchParams(url.search) };
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getState = () => state;

export function setUrl(href: string): void {
  navigate(href);
}

export function currentUrl(): { pathname: string; params: URLSearchParams } {
  return { pathname: state.pathname, params: state.params };
}

export function resetUrl(): void {
  navigate("/");
}

const router = {
  push: navigate,
  replace: navigate,
  back: () => undefined,
  forward: () => undefined,
  refresh: () => undefined,
  prefetch: () => undefined,
};

export const useRouter = () => router;
export const usePathname = () => useSyncExternalStore(subscribe, getState, getState).pathname;
export const useSearchParams = () => useSyncExternalStore(subscribe, getState, getState).params;
