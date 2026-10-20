"use client";

import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { useAdminListLessonTiers, useAdminListTierLessons } from "@/shared/api/generated/endpoints";
import type { AdminLessonSummaryDto } from "@/shared/api/generated/model";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { DataTable, type DataTableFeatures } from "@/shared/components/ui/data-table";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

import { formatTashkent, localTitle, moveId } from "../display";
import { useLessonActions } from "../hooks/useLessonActions";
import { LessonIconGlyph } from "../lesson-icons";
import { ColourChip } from "./colour-chip";
import { LessonStatusBadge } from "./lesson-status-badge";
import { MoveButtons } from "./move-buttons";
import { NewLessonDialog } from "./new-lesson-dialog";

/** AC6: one tier's lessons in order; reorder and create (create opens the editor route). */
export function TierLessonsView({ tierId }: { tierId: string }) {
  const t = useTranslations("lessonsAdmin");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isOnline } = useNetworkStatus();
  const tiers = useAdminListLessonTiers();
  const list = useAdminListTierLessons(tierId);
  const actions = useLessonActions(tierId);
  const [creating, setCreating] = useState(false);

  const tier = tiers.data?.items.find((item) => item.id === tierId);
  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const loaded = list.data !== undefined;
  const title = tier ? localTitle(tier.title, locale) : null;

  async function move(index: number, step: -1 | 1) {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    const ids = moveId(
      items.map((lesson) => lesson.id),
      index,
      step,
    );
    if (!ids) return;
    try {
      await actions.reorder.mutateAsync({ id: tierId, data: { ids } });
      toast.success(t("toasts.reordered"));
    } catch {
      toast.error(t("toasts.error"));
      await list.refetch();
    }
  }

  const columns: ColumnDef<DataTableFeatures, AdminLessonSummaryDto>[] = [
    { id: "order", header: () => t("lessons.columns.order"), cell: ({ row }) => row.index + 1 },
    {
      id: "icon",
      header: () => t("lessons.columns.icon"),
      cell: ({ row }) => (
        <span className="inline-flex text-teal-700" title={t(`icons.${row.original.icon}`)}>
          <LessonIconGlyph icon={row.original.icon} />
          <span className="sr-only">{t(`icons.${row.original.icon}`)}</span>
        </span>
      ),
    },
    {
      id: "title",
      header: () => t("lessons.columns.title"),
      cell: ({ row }) => (
        <Link
          href={`/lessons/${tierId}/${row.original.id}`}
          className="rounded-tile font-black text-teal-700 hover:underline"
        >
          {localTitle(row.original.title, locale)}
        </Link>
      ),
    },
    {
      id: "status",
      header: () => t("lessons.columns.status"),
      cell: ({ row }) => <LessonStatusBadge status={row.original.status} />,
    },
    { id: "questions", header: () => t("lessons.columns.questions"), cell: ({ row }) => row.original.questionCount },
    {
      id: "updated",
      header: () => t("lessons.columns.updated"),
      cell: ({ row }) => <time dateTime={row.original.updatedAt}>{formatTashkent(row.original.updatedAt)}</time>,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("lessons.columns.actions")}</span>,
      cell: ({ row }) => (
        <MoveButtons
          name={localTitle(row.original.title, locale)}
          testIdPrefix="lessons.lesson"
          canMoveUp={row.index > 0}
          canMoveDown={row.index < items.length - 1}
          disabled={actions.reorder.isPending || !isOnline}
          onMove={(step) => void move(row.index, step)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/lessons" className="inline-flex items-center gap-1.5 self-start rounded-tile text-small font-black text-teal-700 hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={3} />
        {t("lessons.back")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {title !== null ? (
            <h1 className="text-h1 text-ink">{title}</h1>
          ) : tiers.isPending ? (
            <Skeleton className="h-9 w-64" />
          ) : (
            <h1 className="text-h1 text-ink">{t("tiers.title")}</h1>
          )}
          {tier ? <ColourChip colour={tier.colour} /> : null}
        </div>
        <Button disabled={!isOnline} onClick={() => setCreating(true)} data-testid="lessons.list.new">
          {t("lessons.new")}
        </Button>
      </div>

      {loaded && !isOnline ? <p className="text-small text-muted">{tCommon("stale")}</p> : null}

      <Card className="gap-0 p-2">
        {list.isError && !loaded ? (
          <ErrorState
            title={t("lessons.errorTitle")}
            description={t("lessons.errorDescription")}
            onRetry={() => void list.refetch()}
            retrying={list.isFetching}
          />
        ) : list.isPending && !isOnline ? (
          <EmptyState icon={BookOpen} title={tCommon("offlineNoData")} />
        ) : loaded && items.length === 0 ? (
          <EmptyState icon={BookOpen} title={t("lessons.empty")} />
        ) : (
          <DataTable
            testId="lessons.list.table"
            caption={t("lessons.caption")}
            columns={columns}
            data={items}
            getRowId={(lesson) => lesson.id}
            rowTestId={(lesson) => `lessons.lesson.row.${lesson.id}`}
            loading={list.isPending}
            skeletonRows={4}
          />
        )}
      </Card>

      {creating ? <NewLessonDialog tierId={tierId} onOpenChange={setCreating} /> : null}
    </div>
  );
}
