"use client";

import { useTranslations } from "next-intl";
import type { FormEvent, ReactNode } from "react";

import { Button } from "./button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "./dialog";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  pending?: boolean;
  /** Form fields (reason, note…). Validation is the caller's; `onConfirm` runs on submit. */
  children?: ReactNode;
  onConfirm: () => void;
  confirmTestId?: string;
};

/**
 * W6 pattern: a dialog that names the thing being changed, collects a reason and only then
 * confirms. Submit is one button so Enter works and double submits are blocked while pending.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = "primary",
  pending = false,
  children,
  onConfirm,
  confirmTestId = "admin.dialog-confirm",
}: ConfirmDialogProps) {
  const t = useTranslations("common");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending) onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (pending ? undefined : onOpenChange(next))}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {children}
          <div className="flex flex-wrap justify-end gap-3">
            <DialogClose asChild>
              <Button variant="white" disabled={pending}>
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button
              type="submit"
              variant={tone === "danger" ? "danger" : "primary"}
              aria-disabled={pending || undefined}
              data-testid={confirmTestId}
            >
              {pending ? t("working") : confirmLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
