"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import type { z } from "zod";

import { ApiError } from "@/shared/api/errors";
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { toast } from "@/shared/components/ui/toaster";
import { zodResolver } from "@/shared/lib/zodResolver";

const SERVER_PREFIX = "server:";

/** Error codes this feature knows how to word; anything else gets the generic message. */
const KNOWN_ERROR_CODES = [
  "PASSWORD_WEAK",
  "PHONE_INVALID",
  "CANNOT_CHANGE_OWN_ROLE",
  "CANNOT_BLOCK_SELF",
  "ALREADY_BLOCKED",
  "NOT_BLOCKED",
  "NOT_FOUND",
  "VALIDATION_FAILED",
] as const;
type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

function knownCode(code: string): KnownErrorCode | "generic" {
  return KNOWN_ERROR_CODES.find((candidate) => candidate === code) ?? "generic";
}

export type FieldApi<TValues extends FieldValues> = {
  register: UseFormRegister<TValues>;
  /** Translated error text for a field, or undefined. */
  error: (name: Path<TValues>) => string | undefined;
};

type ActionDialogProps<TValues extends FieldValues> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  successMessage: string;
  schema: z.ZodType<TValues>;
  defaultValues: DefaultValues<TValues>;
  fields: (api: FieldApi<TValues>) => ReactNode;
  /** Runs the mutation; resolves on success and rejects with ApiError. */
  onSubmit: (values: TValues) => Promise<unknown>;
  /** Server codes that belong under a specific field instead of the dialog. */
  fieldForCode?: Partial<Record<string, Path<TValues>>>;
};

/**
 * One reason-required dialog for every admin action (W6): rhf + zod validation, a pending
 * confirm button, server field errors onto fields, everything else as an inline alert plus
 * a toast. The dialog stays open on failure so the admin can fix and retry. Callers mount it
 * only while open, so every opening starts with a clean form.
 */
export function ActionDialog<TValues extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone,
  successMessage,
  schema,
  defaultValues,
  fields,
  onSubmit,
  fieldForCode,
}: ActionDialogProps<TValues>) {
  const t = useTranslations("users");
  const { isOnline } = useNetworkStatus();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  function fieldMessage(errors: FieldErrors<TValues>, name: Path<TValues>): string | undefined {
    const message = (errors as Record<string, { message?: string } | undefined>)[name]?.message;
    if (!message) return undefined;
    if (message.startsWith(SERVER_PREFIX)) {
      return t(`errors.${knownCode(message.slice(SERVER_PREFIX.length))}`);
    }
    return t(`validation.${message as "noteRequired"}`);
  }

  async function submit(values: TValues) {
    if (!isOnline) {
      setFormError(t("errors.offline"));
      return;
    }
    setPending(true);
    setFormError(null);
    try {
      await onSubmit(values);
      toast.success(successMessage);
      onOpenChange(false);
    } catch (error: unknown) {
      const apiError = error instanceof ApiError ? error : null;
      const code = apiError?.code ?? "";
      const target = fieldForCode?.[code];
      if (target) {
        form.setError(target, { message: `${SERVER_PREFIX}${code}` });
      } else if (apiError?.code === "VALIDATION_FAILED" && apiError.fieldErrors) {
        let mapped = false;
        for (const name of Object.keys(apiError.fieldErrors)) {
          if (name in form.getValues()) {
            form.setError(name as Path<TValues>, { message: `${SERVER_PREFIX}VALIDATION_FAILED` });
            mapped = true;
          }
        }
        if (!mapped) setFormError(t("errors.VALIDATION_FAILED"));
      } else {
        const message = apiError && apiError.status === null ? t("errors.offline") : t(`errors.${knownCode(code)}`);
        setFormError(message);
        toast.error(message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      tone={tone}
      pending={pending}
      onConfirm={() => void form.handleSubmit(submit)()}
    >
      {fields({
        register: form.register,
        error: (name) => fieldMessage(form.formState.errors, name),
      })}
      {formError ? (
        <p role="alert" data-testid="admin.dialog-error" className="rounded-tile bg-status-notnow-bg px-3 py-2 text-small text-status-notnow-fg">
          {formError}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
