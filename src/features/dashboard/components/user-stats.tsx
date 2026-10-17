"use client";

import { Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { UserStatsResponseDto } from "@/shared/api/generated/model";
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { LineChart } from "@/shared/components/line-chart";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { StatTile } from "@/shared/components/ui/stat-tile";
import { formatDay, formatNumber, formatPercent } from "@/shared/lib/format";

import { useUserStats } from "../hooks/useUserStats";

const TILE_COUNT = 6;
const TILE = "min-w-44 flex-1";

function Loaded({ stats }: { stats: UserStatsResponseDto }) {
  const t = useTranslations("dashboard.stats");
  const locale = useLocale();
  const number = (value: number) => formatNumber(value, locale);
  const activeShare = stats.total > 0 ? Math.round((stats.active7d / stats.total) * 100) : 0;
  const first = stats.signupsByDay[0];
  const last = stats.signupsByDay[stats.signupsByDay.length - 1];

  if (stats.total === 0) {
    return (
      <Card>
        <EmptyState icon={Users} title={t("emptyTitle")} description={t("emptyDescription")} />
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-4">
        <StatTile className={TILE} testId="admin.stat-total" label={t("total")} value={number(stats.total)} />
        <StatTile className={TILE} testId="admin.stat-new-today" label={t("newToday")} value={number(stats.newToday)} />
        <StatTile className={TILE} testId="admin.stat-new-7d" label={t("new7d")} value={number(stats.new7d)} />
        <StatTile
          className={TILE}
          testId="admin.stat-active-7d"
          label={t("active7d")}
          value={number(stats.active7d)}
          hint={t("activeShare", { percent: activeShare })}
        />
        <StatTile className={TILE} testId="admin.stat-blocked" label={t("blocked")} value={number(stats.blocked)} />
        <StatTile className={TILE} testId="admin.stat-with-phone" label={t("withPhone")} value={formatPercent(stats.withPhonePct, locale)} />
      </div>

      <Card>
        <CardHeader className="flex-row items-baseline justify-between gap-3">
          <CardTitle>{t("signupsTitle")}</CardTitle>
          <CardDescription>{t("signupsRange")}</CardDescription>
        </CardHeader>
        <LineChart
          testId="admin.signups-chart"
          points={stats.signupsByDay.map((day) => ({ label: formatDay(day.date, locale), value: day.count }))}
          ariaLabel={t("signupsLabel")}
          labelHeader={t("signupsDay")}
          valueHeader={t("signupsCount")}
          startLabel={first ? formatDay(first.date, locale) : ""}
          endLabel={last ? formatDay(last.date, locale) : ""}
          formatValue={number}
        />
      </Card>
    </>
  );
}

/** Loading, error + retry, empty and loaded states for the dashboard aggregates (AC13). */
export function UserStats() {
  const t = useTranslations("dashboard.stats");
  const stats = useUserStats();

  if (stats.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          {t("loading")}
        </span>
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: TILE_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-28 min-w-44 flex-1" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (stats.isError) {
    return (
      <Card>
        <ErrorState
          title={t("errorTitle")}
          description={t("errorDescription")}
          onRetry={() => void stats.refetch()}
          retrying={stats.isFetching}
        />
      </Card>
    );
  }

  return <Loaded stats={stats.data} />;
}
