"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

/** Persistent while offline (never a toast). Cached data stays visible underneath. */
export function OfflineBanner() {
  const t = useTranslations("common");
  const { isOnline } = useNetworkStatus();

  return (
    <div role="status" aria-live="polite">
      {isOnline ? null : (
        <p
          data-testid="app.offline-banner"
          className="flex items-center gap-3 border-b-2 border-status-caution-ring bg-status-caution-bg px-6 py-3 text-copy text-status-caution-fg"
        >
          <WifiOff aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.5} />
          <span>{t("offline")}</span>
        </p>
      )}
    </div>
  );
}
