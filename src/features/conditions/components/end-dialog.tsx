"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

import { isAlreadyEnded } from "../write-errors";

type EndDialogProps = {
  title: string;
  successMessage: string;
  onOpenChange: (open: boolean) => void;
  /** Runs the end mutation; rejects with ApiError. */
  onEnd: () => Promise<unknown>;
  /** Refetch after "already ended" so the stale row updates. */
  onStale: () => Promise<unknown>;
};

/** Confirm before ending a closure or override; mounted only while open. */
export function EndDialog({ title, successMessage, onOpenChange, onEnd, onStale }: EndDialogProps) {
  const t = useTranslations("conditions");
  const { isOnline } = useNetworkStatus();
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    setPending(true);
    try {
      await onEnd();
      toast.success(successMessage);
      onOpenChange(false);
    } catch (error: unknown) {
      if (isAlreadyEnded(error)) {
        toast.info(t("toasts.alreadyEnded"));
        onOpenChange(false);
        await onStale();
      } else {
        toast.error(t("toasts.error"));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={onOpenChange}
      title={title}
      description={t("confirmEnd")}
      confirmLabel={t("end")}
      tone="danger"
      pending={pending}
      onConfirm={() => void confirm()}
    />
  );
}
