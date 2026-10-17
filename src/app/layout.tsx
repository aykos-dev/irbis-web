import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { getLocale, getMessages, getTimeZone, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import "@/shared/styles/globals.css";

import { AuthProvider } from "@/features/auth/components/auth-provider";

import { Providers } from "./providers";

const nunito = Nunito({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: { default: t("appName"), template: `%s · ${t("appName")}` },
    description: t("metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [locale, messages, timeZone] = await Promise.all([getLocale(), getMessages(), getTimeZone()]);

  return (
    <html lang={locale} data-theme="light" className={nunito.variable} suppressHydrationWarning>
      <body>
        <Providers locale={locale} messages={messages} timeZone={timeZone}>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
