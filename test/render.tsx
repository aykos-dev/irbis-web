import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { Providers } from "@/app/providers";
import { defaultLocale } from "@/shared/i18n/config";
import { messagesByLocale } from "@/shared/i18n/messages";

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <Providers locale={defaultLocale} messages={messagesByLocale[defaultLocale]} timeZone="Asia/Tashkent">
      {children}
    </Providers>
  );
}

/** Renders inside the real provider tree (i18n, theme, a fresh QueryClient, Toaster). */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}
