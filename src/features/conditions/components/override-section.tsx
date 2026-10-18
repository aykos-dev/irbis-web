"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { ConditionStatus, type OverrideDto } from "@/shared/api/generated/model";
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Field, Input, Select, Textarea } from "@/shared/components/ui/field";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { formatDateTime } from "@/shared/lib/format";
import { zodResolver } from "@/shared/lib/zodResolver";

import { toTashkentInput } from "../datetime";
import { useConditionActions } from "../hooks/useConditionActions";
import { DAY_MS, OVERRIDE_MAX_DAYS, overrideSchema, REASON_MAX, toCreateOverride, type OverrideValues } from "../schemas";
import { applyWriteError } from "../write-errors";
import { ConditionStatusBadge } from "./condition-status-badge";
import { EndDialog } from "./end-dialog";

const DEFAULT_EXPIRY_DAYS = 3;

function defaults(): OverrideValues {
  return {
    status: ConditionStatus.not_now,
    reasonUz: "",
    reasonRu: "",
    reasonEn: "",
    expiresAt: toTashkentInput(new Date(Date.now() + DEFAULT_EXPIRY_DAYS * DAY_MS)),
  };
}

/** Active override card with End, and the Set override form. */
export function OverrideSection({ placeId, overrides }: { placeId: string; overrides: OverrideDto[] }) {
  const t = useTranslations("conditions");
  const locale = useLocale();
  const { isOnline } = useNetworkStatus();
  const actions = useConditionActions(placeId);
  const [ending, setEnding] = useState<string | null>(null);
  // Hints for the native picker, fixed at mount; the schema re-checks against the real clock.
  const [bounds] = useState(() => ({
    min: toTashkentInput(new Date()),
    max: toTashkentInput(new Date(Date.now() + OVERRIDE_MAX_DAYS * DAY_MS)),
  }));
  const active = overrides.find((override) => override.active) ?? null;
  const form = useForm<OverrideValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: defaults(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const { errors, isSubmitting } = form.formState;
  const fieldError = (name: keyof OverrideValues) => {
    const message = errors[name]?.message;
    return message ? t(`validation.${message as "server"}`) : undefined;
  };

  async function submit(values: OverrideValues) {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    try {
      await actions.createOverride.mutateAsync({ id: placeId, data: toCreateOverride(values) });
      toast.success(t("toasts.overrideSet"));
      form.reset(defaults());
    } catch (error: unknown) {
      const failure = applyWriteError(error, form);
      if (failure === "offline") toast.error(t("toasts.offline"));
      else if (failure === "generic") toast.error(t("toasts.error"));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("override")}</CardTitle>
      </CardHeader>
      {active ? (
        <div
          data-testid="override-active"
          className="flex flex-wrap items-center justify-between gap-3 rounded-tile border-2 border-line p-4"
        >
          <div className="flex flex-col gap-1.5">
            <ConditionStatusBadge status={active.status} />
            <p className="text-copy text-ink">{active.reason.uz}</p>
            <p className="text-small text-muted">
              {t("overrideCard.expires", { time: formatDateTime(active.expiresAt, locale) })}
            </p>
          </div>
          <Button variant="white" disabled={!isOnline} onClick={() => setEnding(active.id)}>
            {t("endOverride")}
          </Button>
        </div>
      ) : (
        <p className="text-copy text-muted">{t("overrideCard.none")}</p>
      )}

      <form
        noValidate
        data-testid="override-form"
        aria-label={t("setOverride")}
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        className="flex flex-col gap-4 border-t-2 border-soft pt-4"
      >
        <h3 className="text-h3 text-ink">{t("setOverride")}</h3>
        <div className="flex flex-wrap gap-3">
          <Field label={t("field.status")} error={fieldError("status")} className="min-w-48">
            {(control) => (
              <Select {...form.register("status")} {...control}>
                {Object.values(ConditionStatus).map((status) => (
                  <option key={status} value={status}>
                    {t(`status.${status}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("field.expires")} error={fieldError("expiresAt")} className="min-w-56 flex-1">
            {(control) => (
              <Input
                type="datetime-local"
                min={bounds.min}
                max={bounds.max}
                {...form.register("expiresAt")}
                {...control}
              />
            )}
          </Field>
        </div>
        <Field label={t("field.reasonUz")} error={fieldError("reasonUz")}>
          {(control) => <Textarea {...form.register("reasonUz")} {...control} rows={2} maxLength={REASON_MAX} />}
        </Field>
        <div className="flex flex-wrap gap-3">
          <Field label={t("field.reasonRu")} error={fieldError("reasonRu")} className="min-w-64 flex-1">
            {(control) => <Textarea {...form.register("reasonRu")} {...control} rows={2} maxLength={REASON_MAX} />}
          </Field>
          <Field label={t("field.reasonEn")} error={fieldError("reasonEn")} className="min-w-64 flex-1">
            {(control) => <Textarea {...form.register("reasonEn")} {...control} rows={2} maxLength={REASON_MAX} />}
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isOnline}>
            {t("setOverride")}
          </Button>
        </div>
      </form>

      {ending ? (
        <EndDialog
          title={t("dialogs.endOverride")}
          successMessage={t("toasts.overrideEnded")}
          onOpenChange={(open) => (open ? undefined : setEnding(null))}
          onEnd={() => actions.endOverride.mutateAsync({ id: ending })}
          onStale={actions.refresh}
        />
      ) : null}
    </Card>
  );
}
