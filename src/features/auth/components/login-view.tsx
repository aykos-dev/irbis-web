"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { ApiError, getRetryAfterSec } from "@/shared/api/errors";
import { BrandMark } from "@/shared/components/layout/brand-mark";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Field, Input } from "@/shared/components/ui/field";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { zodResolver } from "@/shared/lib/zodResolver";

import { useSession } from "@/shared/api/session";
import { useAdminLogIn } from "../hooks/useAdminLogIn";
import { logInSchema, type LogInValues } from "../schemas";

type FormError = { kind: "generic" | "notAdmin" | "blocked" | "offline" | "unknown" } | { kind: "locked"; minutes: number };

function toFormError(error: unknown): FormError {
  if (!(error instanceof ApiError)) return { kind: "unknown" };
  switch (error.code) {
    case "INVALID_CREDENTIALS":
      return { kind: "generic" };
    case "ACCOUNT_LOCKED":
      return { kind: "locked", minutes: Math.max(1, Math.ceil((getRetryAfterSec(error) ?? 900) / 60)) };
    case "NOT_ADMIN":
      return { kind: "notAdmin" };
    case "ACCOUNT_BLOCKED":
      return { kind: "blocked" };
    default:
      return error.status === null ? { kind: "offline" } : { kind: "unknown" };
  }
}

/** Canvas W2. Generic credential error, lock message with time, no admin access, blocked. */
export function LoginView() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { status } = useSession();
  const { isOnline } = useNetworkStatus();
  const logIn = useAdminLogIn();
  const [formError, setFormError] = useState<FormError | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LogInValues>({
    resolver: zodResolver(logInSchema),
    defaultValues: { username: "", password: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  function onSubmit(values: LogInValues) {
    if (logIn.isPending) return;
    if (!isOnline) {
      setFormError({ kind: "offline" });
      return;
    }
    setFormError(null);
    logIn.mutate(
      { data: values },
      {
        onSuccess: () => router.replace("/"),
        onError: (error) => {
          if (error instanceof ApiError && error.code === "VALIDATION_FAILED" && error.fieldErrors) {
            const fieldErrors = error.fieldErrors;
            for (const name of ["username", "password"] as const) {
              if (fieldErrors[name]) setError(name, { message: "invalid" });
            }
            return;
          }
          setFormError(toFormError(error));
        },
      },
    );
  }

  const message = formError
    ? formError.kind === "locked"
      ? t("errors.locked", { minutes: formError.minutes })
      : t(`errors.${formError.kind}`)
    : null;

  return (
    <Card className="w-full max-w-md gap-5 p-8">
      <div className="flex items-center gap-3">
        <BrandMark size={52} />
        <div>
          <h1 className="text-h2 text-ink">{t("login.title")}</h1>
          <p className="text-small text-muted">{t("login.subtitle")}</p>
        </div>
      </div>

      <form
        data-testid="admin.login-form"
        onSubmit={(event) => void handleSubmit(onSubmit)(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        <Field label={t("login.username")} error={errors.username ? t(`validation.${errors.username.message === "invalid" ? "invalid" : "required"}`) : undefined}>
          {(control) => (
            <Input
              {...register("username")}
              {...control}
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              data-testid="admin.login-username"
            />
          )}
        </Field>
        <Field label={t("login.password")} error={errors.password ? t(`validation.${errors.password.message === "invalid" ? "invalid" : "required"}`) : undefined}>
          {(control) => (
            <Input
              {...register("password")}
              {...control}
              type="password"
              autoComplete="current-password"
              data-testid="admin.login-password"
            />
          )}
        </Field>

        {message ? (
          <p role="alert" data-testid="admin.login-error" className="rounded-tile bg-status-notnow-bg px-3 py-2 text-small text-status-notnow-fg">
            {message}
          </p>
        ) : null}

        <Button type="submit" aria-disabled={logIn.isPending || undefined} data-testid="admin.login-submit" className="w-full">
          {logIn.isPending ? t("login.submitting") : t("login.submit")}
        </Button>
      </form>

      <p className="text-small text-muted">{t("login.note")}</p>
    </Card>
  );
}
