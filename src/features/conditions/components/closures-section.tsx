"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";

import { ClosureSource, type ClosureDto } from "@/shared/api/generated/model";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { DataTable, type DataTableFeatures } from "@/shared/components/ui/data-table";
import { Field, Input, Select, Textarea } from "@/shared/components/ui/field";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { formatDateTime } from "@/shared/lib/format";
import { zodResolver } from "@/shared/lib/zodResolver";

import { toTashkentInput } from "../datetime";
import { useConditionActions } from "../hooks/useConditionActions";
import { closureSchema, REASON_MAX, toCreateClosure, type ClosureValues } from "../schemas";
import { applyWriteError } from "../write-errors";
import { EndDialog } from "./end-dialog";

function defaults(): ClosureValues {
  return {
    startsAt: toTashkentInput(new Date()),
    endsAt: "",
    reasonUz: "",
    reasonRu: "",
    reasonEn: "",
    source: ClosureSource.admin,
  };
}

/** Closures table (newest first) with End, and the Add closure form. */
export function ClosuresSection({ placeId, closures }: { placeId: string; closures: ClosureDto[] }) {
  const t = useTranslations("conditions");
  const locale = useLocale();
  const { isOnline } = useNetworkStatus();
  const actions = useConditionActions(placeId);
  const [ending, setEnding] = useState<string | null>(null);
  const form = useForm<ClosureValues>({
    resolver: zodResolver(closureSchema),
    defaultValues: defaults(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const { errors, isSubmitting } = form.formState;
  const fieldError = (name: keyof ClosureValues) => {
    const message = errors[name]?.message;
    return message ? t(`validation.${message as "server"}`) : undefined;
  };

  const columns = useMemo<ColumnDef<DataTableFeatures, ClosureDto>[]>(
    () => [
      { id: "start", header: () => t("field.start"), cell: ({ row }) => formatDateTime(row.original.startsAt, locale) },
      {
        id: "end",
        header: () => t("field.end"),
        cell: ({ row }) => (row.original.endsAt ? formatDateTime(row.original.endsAt, locale) : t("openEnded")),
      },
      {
        id: "reason",
        header: () => t("field.reasonUz"),
        cell: ({ row }) => <span className="whitespace-normal">{row.original.reason.uz}</span>,
      },
      {
        id: "source",
        header: () => t("field.source"),
        cell: ({ row }) => (row.original.source === ClosureSource.official ? t("sourceOfficial") : t("sourceAdmin")),
      },
      {
        id: "state",
        header: () => t("closuresTable.state"),
        cell: ({ row }) =>
          row.original.active ? (
            <Badge tone="notnow">{t("closuresTable.active")}</Badge>
          ) : (
            <Badge tone="neutral">{t("closuresTable.ended")}</Badge>
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("end")}</span>,
        cell: ({ row }) =>
          row.original.active ? (
            <Button variant="white" disabled={!isOnline} onClick={() => setEnding(row.original.id)}>
              {t("end")}
            </Button>
          ) : null,
      },
    ],
    [t, locale, isOnline],
  );

  async function submit(values: ClosureValues) {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    try {
      await actions.createClosure.mutateAsync({ id: placeId, data: toCreateClosure(values) });
      toast.success(t("toasts.closureAdded"));
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
        <CardTitle>{t("closures")}</CardTitle>
      </CardHeader>
      {closures.length === 0 ? (
        <p className="text-copy text-muted">{t("closuresTable.none")}</p>
      ) : (
        <DataTable
          testId="closures-table"
          caption={t("closuresTable.caption")}
          columns={columns}
          data={closures}
          getRowId={(row) => row.id}
        />
      )}

      <form
        noValidate
        data-testid="closure-form"
        aria-label={t("addClosure")}
        onSubmit={(event) => void form.handleSubmit(submit)(event)}
        className="flex flex-col gap-4 border-t-2 border-soft pt-4"
      >
        <h3 className="text-h3 text-ink">{t("addClosure")}</h3>
        <div className="flex flex-wrap gap-3">
          <Field label={t("field.start")} error={fieldError("startsAt")} className="min-w-56 flex-1">
            {(control) => <Input type="datetime-local" {...form.register("startsAt")} {...control} />}
          </Field>
          <Field label={t("field.end")} hint={t("openEnded")} error={fieldError("endsAt")} className="min-w-56 flex-1">
            {(control) => <Input type="datetime-local" {...form.register("endsAt")} {...control} />}
          </Field>
          <Field label={t("field.source")} error={fieldError("source")} className="min-w-48">
            {(control) => (
              <Select {...form.register("source")} {...control}>
                <option value={ClosureSource.admin}>{t("sourceAdmin")}</option>
                <option value={ClosureSource.official}>{t("sourceOfficial")}</option>
              </Select>
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
            {t("addClosure")}
          </Button>
        </div>
      </form>

      {ending ? (
        <EndDialog
          title={t("dialogs.endClosure")}
          successMessage={t("toasts.closureEnded")}
          onOpenChange={(open) => (open ? undefined : setEnding(null))}
          onEnd={() => actions.endClosure.mutateAsync({ id: ending })}
          onStale={actions.refresh}
        />
      ) : null}
    </Card>
  );
}
