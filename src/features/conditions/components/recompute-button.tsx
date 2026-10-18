"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

import { useRecompute, type RecomputeOutcome } from "../hooks/useRecompute";

/** POST recompute; busy (disabled + spinner) while pending and after RECOMPUTE_RUNNING. */
export function RecomputeButton() {
  const t = useTranslations("conditions");
  const { isOnline } = useNetworkStatus();
  const messages: Record<RecomputeOutcome, () => void> = {
    started: () => toast.success(t("recomputeStarted")),
    running: () => toast.info(t("recomputeRunning")),
    failed: () => toast.error(t("toasts.error")),
  };
  const { start, busy } = useRecompute((outcome) => messages[outcome]());

  function onClick() {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    start();
  }

  const Icon = busy ? Loader2 : RefreshCw;
  return (
    <Button onClick={onClick} disabled={busy} aria-busy={busy || undefined} data-testid="conditions-recompute">
      <Icon aria-hidden="true" className={busy ? "size-5 animate-spin" : "size-5"} strokeWidth={2.5} />
      {t("recompute")}
    </Button>
  );
}
