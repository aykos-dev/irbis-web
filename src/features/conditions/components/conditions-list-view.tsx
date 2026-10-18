"use client";

import { CloudSun, SearchX } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { AdminConditionStatusFilter, ConditionSource, PlaceType } from "@/shared/api/generated/model";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { DataTable } from "@/shared/components/ui/data-table";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Field, Select } from "@/shared/components/ui/field";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { useUrlState } from "@/shared/hooks/useUrlState";

import { createConditionColumns } from "../columns";
import { parseConditionsFilter } from "../conditions-query";
import { useConditionsList } from "../hooks/useConditionsList";
import { RecomputeButton } from "./recompute-button";

function labelsFor<T extends string>(values: Record<string, T>, label: (value: T) => string): Record<T, string> {
  return Object.fromEntries(Object.values(values).map((value) => [value, label(value)])) as Record<T, string>;
}

/** AC6: every place with its condition, status filter in the URL, cursor "Load more", recompute. */
export function ConditionsListView() {
  const t = useTranslations("conditions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isOnline } = useNetworkStatus();
  const { params, update } = useUrlState();
  const status = useMemo(() => parseConditionsFilter(params), [params]);
  const list = useConditionsList(status);

  const columns = useMemo(
    () =>
      createConditionColumns({
        labels: {
          place: t("list.columns.place"),
          type: t("list.columns.type"),
          status: t("list.columns.status"),
          source: t("list.columns.source"),
          updated: t("list.columns.updated"),
          flags: t("list.columns.flags"),
          never: t("list.never"),
          flagClosure: t("list.flagClosure"),
          flagOverride: t("list.flagOverride"),
          forecastAge: (time) => t("list.forecastAge", { time }),
        },
        typeLabels: labelsFor(PlaceType, (type) => t(`type.${type}`)),
        sourceLabels: labelsFor(ConditionSource, (source) => t(`source.${source}`)),
        locale,
      }),
    [t, locale],
  );

  const pages = list.data?.pages;
  const items = useMemo(() => pages?.flatMap((page) => page.items) ?? [], [pages]);
  const loaded = pages !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} actions={<RecomputeButton />} />

      <Card className="flex-row flex-wrap items-end gap-3">
        <Field label={t("list.filter")}>
          {(control) => (
            <Select
              {...control}
              value={status}
              onChange={(event) => update({ status: event.target.value })}
              data-testid="conditions-filter"
            >
              <option value="">{t("list.all")}</option>
              {Object.values(AdminConditionStatusFilter).map((value) => (
                <option key={value} value={value}>
                  {t(`status.${value}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </Card>

      {loaded && !isOnline ? <p className="text-small text-muted">{tCommon("stale")}</p> : null}

      <Card className="gap-0 p-2">
        {list.isError && !loaded ? (
          <ErrorState
            title={t("list.errorTitle")}
            description={t("list.errorDescription")}
            onRetry={() => void list.refetch()}
            retrying={list.isFetching}
          />
        ) : list.isPending && !isOnline ? (
          <EmptyState icon={CloudSun} title={t("list.offlineTitle")} description={t("list.offlineDescription")} />
        ) : loaded && items.length === 0 ? (
          status ? (
            <EmptyState
              icon={SearchX}
              title={t("empty")}
              action={
                <Button variant="white" onClick={() => update({ status: null })}>
                  {t("list.showAll")}
                </Button>
              }
            />
          ) : (
            <EmptyState icon={CloudSun} title={t("list.emptyTitle")} description={t("list.emptyDescription")} />
          )
        ) : (
          <DataTable
            testId="conditions-table"
            caption={t("list.caption")}
            columns={columns}
            data={items}
            getRowId={(row) => row.placeId}
            rowTestId={(row) => `conditions-row-${row.slug}`}
            loading={list.isPending}
          />
        )}
      </Card>

      {list.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="white"
            onClick={() => (list.isFetchingNextPage ? undefined : void list.fetchNextPage())}
            aria-disabled={list.isFetchingNextPage || undefined}
          >
            {list.isFetchingNextPage ? tCommon("loading") : t("list.loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
