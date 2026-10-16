"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { useState, type ReactNode } from "react";

import { setApiLocale } from "@/shared/api/client";
import { createQueryClient } from "@/shared/api/query";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { Toaster } from "@/shared/components/ui/toaster";
import type { Locale } from "@/shared/i18n/config";

type ProvidersProps = {
  locale: Locale;
  messages: AbstractIntlMessages;
  timeZone: string;
  children: ReactNode;
};

/** Order per docs/architecture.md › Provider Hierarchy. */
export function Providers({ locale, messages, timeZone, children }: ProvidersProps) {
  const [queryClient] = useState(createQueryClient);
  setApiLocale(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
