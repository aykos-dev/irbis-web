"use client";

import { ArrowLeft, MapPinOff, WifiOff } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ApiError } from "@/shared/api/errors";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { formatDateTime, formatRelative } from "@/shared/lib/format";

import { useConditionControls } from "../hooks/useConditionControls";
import { ClosuresSection } from "./closures-section";
import { ConditionStatusBadge } from "./condition-status-badge";
import { OverrideSection } from "./override-section";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
      <dt className="w-40 shrink-0 text-small text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-copy text-ink">{children}</dd>
    </div>
  );
}

/** AC6 place view: current condition and reasons, closures, override. */
export function PlaceConditionsView({ placeId }: { placeId: string }) {
  const t = useTranslations("conditions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isOnline } = useNetworkStatus();
  const controls = useConditionControls(placeId);

  const back = (
    <Link
      href="/conditions"
      className="inline-flex min-h-touch items-center gap-1.5 text-small font-black text-teal-700 hover:underline"
    >
      <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2.5} />
      {t("place.back")}
    </Link>
  );

  if (controls.isPending && !isOnline) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <Card>
          <EmptyState icon={WifiOff} title={t("list.offlineTitle")} description={tCommon("offlineNoData")} />
        </Card>
      </div>
    );
  }

  if (controls.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          {t("place.loading")}
        </span>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (controls.isError) {
    const missing = controls.error instanceof ApiError && controls.error.code === "NOT_FOUND";
    return (
      <div className="flex flex-col gap-4">
        {back}
        <Card>
          {missing ? (
            <EmptyState
              icon={MapPinOff}
              title={t("place.notFoundTitle")}
              description={t("place.notFoundDescription")}
              action={
                <Button asChild variant="white">
                  <Link href="/conditions">{t("place.back")}</Link>
                </Button>
              }
            />
          ) : (
            <ErrorState
              title={t("place.errorTitle")}
              description={t("place.errorDescription")}
              onRetry={() => void controls.refetch()}
              retrying={controls.isFetching}
            />
          )}
        </Card>
      </div>
    );
  }

  const { condition, closures, overrides } = controls.data;

  return (
    <div className="flex flex-col gap-6">
      {back}
      {!isOnline ? <p className="text-small text-muted">{tCommon("stale")}</p> : null}
      <PageHeader
        title={t("place.title")}
        description={
          condition.computedAt
            ? t("updated", { time: formatRelative(condition.computedAt, locale) })
            : t("list.never")
        }
        actions={<ConditionStatusBadge status={condition.status} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("place.current")}</CardTitle>
        </CardHeader>
        <dl className="flex flex-col gap-2.5">
          <Fact label={t("field.status")}>
            <ConditionStatusBadge status={condition.status} />
          </Fact>
          <Fact label={t("field.source")}>{condition.source ? t(`source.${condition.source}`) : "—"}</Fact>
          <Fact label={t("place.reasons")}>
            {condition.reasons.length > 0 ? (
              <ul data-testid="condition-reasons" className="flex flex-col gap-0.5">
                {condition.reasons.map((reason, index) => (
                  <li key={`${reason.code}-${reason.day ?? index}`}>{t(`reasons.${reason.code}`)}</li>
                ))}
              </ul>
            ) : (
              t("place.noReasons")
            )}
            {condition.text ? <p className="text-small text-muted">{condition.text.uz}</p> : null}
          </Fact>
          <Fact label={t("source.forecast")}>
            {condition.forecastAt
              ? t("place.forecastAt", { time: formatDateTime(condition.forecastAt, locale) })
              : t("place.noForecast")}
          </Fact>
        </dl>
      </Card>

      <OverrideSection placeId={placeId} overrides={overrides} />
      <ClosuresSection placeId={placeId} closures={closures} />
    </div>
  );
}
