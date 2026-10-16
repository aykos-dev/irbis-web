import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Header } from "@/shared/components/layout/header";
import { OfflineBanner } from "@/shared/components/layout/offline-banner";
import { Sidebar } from "@/shared/components/layout/sidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only rounded-tile bg-card px-4 py-2 text-copy text-teal-700 focus:not-sr-only focus:absolute focus:start-4 focus:top-4"
      >
        {t("skipToContent")}
      </a>
      <Header />
      <OfflineBanner />
      <div className="flex flex-1">
        <Sidebar />
        <main id="main" tabIndex={-1} className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
