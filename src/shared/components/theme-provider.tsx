"use client";

import { useEffect, type ReactNode } from "react";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Sets `data-theme` on <html> from the system preference; tokens.css does the rest. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const apply = () => {
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return children;
}
