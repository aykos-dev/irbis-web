"use client";

import { CircleCheck, CircleX, RotateCw } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";

import { useApiStatus } from "@/features/dashboard/hooks/useApiStatus";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

const ICON_STROKE = 2.5;

export function ApiStatusCard() {
  const t = useTranslations("health");
  const format = useFormatter();
  const titleId = useId();
  const { isOnline } = useNetworkStatus();
  const { data, isPending, isError, isFetching, refetch } = useApiStatus();

  // Not `fetchStatus === "paused"`: TanStack also pauses retries while the tab is unfocused.
  const isWaitingForNetwork = isPending && !isError && !isOnline;
  const isLoading = isPending && !isWaitingForNetwork && !isError;
  const isStale = data !== undefined && (!isOnline || isError);
  const retry = () => void refetch();

  return (
    <Card data-testid="health.status-card" aria-labelledby={titleId} aria-busy={isLoading} className="max-w-xl">
      <CardHeader>
        <CardTitle id={titleId}>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>

      <CardContent aria-live="polite">
        {isLoading ? (
          <>
            <span className="sr-only">{t("loading")}</span>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-chip w-28 rounded-pill" />
              <Skeleton className="h-chip w-40 rounded-pill" />
              <Skeleton className="h-chip w-14 rounded-pill" />
            </div>
            <Skeleton className="h-4 w-48" />
          </>
        ) : null}

        {isWaitingForNetwork ? <p className="text-copy text-muted">{t("offlineNoData")}</p> : null}

        {isError && data === undefined ? (
          <div role="alert" className="flex flex-col gap-1">
            <p className="text-h3 text-status-notnow-fg">{t("errorTitle")}</p>
            <p className="text-copy text-body">{t("errorDescription")}</p>
          </div>
        ) : null}

        {data !== undefined ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="go" data-testid="health.api-chip">
                <CircleCheck aria-hidden="true" strokeWidth={ICON_STROKE} />
                {t("apiUp")}
              </Badge>
              {data.db === "up" ? (
                <Badge tone="go" data-testid="health.db-chip">
                  <CircleCheck aria-hidden="true" strokeWidth={ICON_STROKE} />
                  {t("dbUp")}
                </Badge>
              ) : (
                <Badge tone="notnow" data-testid="health.db-chip">
                  <CircleX aria-hidden="true" strokeWidth={ICON_STROKE} />
                  {t("dbDown")}
                </Badge>
              )}
              <Badge data-testid="health.version">{t("version", { version: data.version })}</Badge>
            </div>
            {data.status === "degraded" ? <p className="text-copy text-status-notnow-fg">{t("degraded")}</p> : null}
            <p className="text-small text-muted">
              {t("checkedAt", {
                time: format.dateTime(new Date(data.time), { dateStyle: "medium", timeStyle: "medium" }),
              })}
            </p>
            {isStale ? <p className="text-small text-status-caution-fg">{t("stale")}</p> : null}
          </>
        ) : null}
      </CardContent>

      {isError ? (
        <CardFooter>
          <Button variant="white" data-testid="health.retry" onClick={retry} aria-disabled={isFetching}>
            <RotateCw aria-hidden="true" className="size-5" strokeWidth={ICON_STROKE} />
            {isFetching ? t("retrying") : t("retry")}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
