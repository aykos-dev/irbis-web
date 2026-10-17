import { useTranslations } from "next-intl";
import { Suspense, type ReactNode } from "react";

import { AdminGate } from "@/features/auth/components/admin-gate";
import { SessionMenu } from "@/features/auth/components/session-menu";
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
        <Suspense fallback={<div className="w-64 shrink-0 border-e-2 border-line bg-card" />}>
          <Sidebar footer={<SessionMenu />} />
        </Suspense>
        <main id="main" tabIndex={-1} className="flex-1 p-6">
          <Suspense fallback={null}>
            <AdminGate>{children}</AdminGate>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
