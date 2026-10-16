import "@testing-library/jest-dom/vitest";

import { onlineManager } from "@tanstack/react-query";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./server";

// jsdom has no matchMedia; ThemeProvider reads prefers-color-scheme through it.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList => {
    const list: MediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
    return list;
  };
}

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  onlineManager.setOnline(true);
});
afterAll(() => server.close());
