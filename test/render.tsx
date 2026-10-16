import { QueryClient } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { Providers } from "@/app/providers";
import { defaultLocale } from "@/shared/i18n/config";
import { messagesByLocale } from "@/shared/i18n/messages";

/** Same client as production minus retries and their back-off delays. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
}

/** Renders inside the real provider tree (i18n, theme, QueryClient, Toaster). */
export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient } = {},
) {
  function AllProviders({ children }: { children: ReactNode }) {
    return (
      <Providers
        locale={defaultLocale}
        messages={messagesByLocale[defaultLocale]}
        timeZone="Asia/Tashkent"
        queryClient={queryClient}
      >
        {children}
      </Providers>
    );
  }
  return { queryClient, ...render(ui, { wrapper: AllProviders, ...options }) };
}
