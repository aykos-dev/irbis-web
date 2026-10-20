"use client";

import { Layers, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { useAdminListLessonTiers } from "@/shared/api/generated/endpoints";
import type { AdminTierDto } from "@/shared/api/generated/model";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { ConfirmDialog } from "@/shared/components/ui/confirm-dialog";
import { DataTable, type DataTableFeatures } from "@/shared/components/ui/data-table";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";

import { localTitle, moveId } from "../display";
import { useTierActions } from "../hooks/useTierActions";
import { ColourChip } from "./colour-chip";
import { MoveButtons } from "./move-buttons";
import { TierDialog } from "./tier-dialog";

type Editing = { tier: AdminTierDto | null } | null;

/** AC6: tiers in order with counts; reorder, create, edit, delete (only when empty). */
export function TiersView() {
  const t = useTranslations("lessonsAdmin");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { isOnline } = useNetworkStatus();
  const list = useAdminListLessonTiers();
  const actions = useTierActions();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<AdminTierDto | null>(null);

  const items = useMemo(() => list.data?.items ?? [], [list.data]);
  const loaded = list.data !== undefined;
  const writing = actions.reorder.isPending || actions.remove.isPending;

  async function move(index: number, step: -1 | 1) {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    const ids = moveId(
      items.map((tier) => tier.id),
      index,
      step,
    );
    if (!ids) return;
    try {
      await actions.reorder.mutateAsync({ data: { ids } });
      toast.success(t("toasts.reordered"));
    } catch {
      toast.error(t("toasts.error"));
      await list.refetch();
    }
  }

  async function remove(tier: AdminTierDto) {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    try {
      await actions.remove.mutateAsync({ id: tier.id });
      toast.success(t("toasts.tierDeleted"));
      setDeleting(null);
    } catch {
      toast.error(t("toasts.error"));
    }
  }

  const columns: ColumnDef<DataTableFeatures, AdminTierDto>[] = [
    { id: "order", header: () => t("tiers.columns.order"), cell: ({ row }) => row.index + 1 },
    { id: "colour", header: () => t("tiers.columns.colour"), cell: ({ row }) => <ColourChip colour={row.original.colour} /> },
    {
      id: "title",
      header: () => t("tiers.columns.title"),
      cell: ({ row }) => (
        <Link href={`/lessons/${row.original.id}`} className="rounded-tile font-black text-teal-700 hover:underline">
          {localTitle(row.original.title, locale)}
        </Link>
      ),
    },
    { id: "key", header: () => t("tiers.columns.key"), cell: ({ row }) => <code>{row.original.key}</code> },
    { id: "lessons", header: () => t("tiers.columns.lessons"), cell: ({ row }) => row.original.lessonCount },
    { id: "published", header: () => t("tiers.columns.published"), cell: ({ row }) => row.original.publishedCount },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("tiers.columns.actions")}</span>,
      cell: ({ row }) => {
        const tier = row.original;
        const name = localTitle(tier.title, locale);
        const blocked = tier.lessonCount > 0;
        const blockedId = `tier-delete-blocked-${tier.id}`;
        return (
          <div className="flex items-center gap-1.5">
            <MoveButtons
              name={name}
              testIdPrefix="lessons.tier"
              canMoveUp={row.index > 0}
              canMoveDown={row.index < items.length - 1}
              disabled={writing || !isOnline}
              onMove={(step) => void move(row.index, step)}
            />
            <Button
              variant="white"
              className="min-h-touch px-3"
              aria-label={`${t("actions.edit")}: ${name}`}
              disabled={!isOnline}
              onClick={() => setEditing({ tier })}
            >
              <Pencil aria-hidden="true" className="size-4" strokeWidth={3} />
            </Button>
            <span title={blocked ? t("tiers.deleteBlocked") : undefined}>
              <Button
                variant="white"
                className="min-h-touch px-3"
                aria-label={`${t("actions.delete")}: ${name}`}
                aria-describedby={blocked ? blockedId : undefined}
                disabled={blocked || writing || !isOnline}
                onClick={() => setDeleting(tier)}
                data-testid="lessons.tier.delete"
              >
                <Trash2 aria-hidden="true" className="size-4" strokeWidth={3} />
              </Button>
              {blocked ? (
                <span id={blockedId} className="sr-only">
                  {t("tiers.deleteBlocked")}
                </span>
              ) : null}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("tiers.title")}
        description={t("tiers.description")}
        actions={
          <Button disabled={!isOnline} onClick={() => setEditing({ tier: null })} data-testid="lessons.tiers.new">
            {t("tiers.new")}
          </Button>
        }
      />

      {loaded && !isOnline ? <p className="text-small text-muted">{tCommon("stale")}</p> : null}

      <Card className="gap-0 p-2">
        {list.isError && !loaded ? (
          <ErrorState
            title={t("tiers.errorTitle")}
            description={t("tiers.errorDescription")}
            onRetry={() => void list.refetch()}
            retrying={list.isFetching}
          />
        ) : list.isPending && !isOnline ? (
          <EmptyState icon={Layers} title={tCommon("offlineNoData")} />
        ) : loaded && items.length === 0 ? (
          <EmptyState icon={Layers} title={t("tiers.emptyTitle")} description={t("tiers.emptyDescription")} />
        ) : (
          <DataTable
            testId="lessons.tiers.table"
            caption={t("tiers.caption")}
            columns={columns}
            data={items}
            getRowId={(tier) => tier.id}
            rowTestId={(tier) => `lessons.tier.row.${tier.key}`}
            loading={list.isPending}
            skeletonRows={4}
          />
        )}
      </Card>

      {editing ? (
        <TierDialog tier={editing.tier} onOpenChange={(open) => (open ? undefined : setEditing(null))} />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setDeleting(null))}
          title={t("tiers.deleteTitle", { title: localTitle(deleting.title, locale) })}
          description={t("tiers.deleteDescription")}
          confirmLabel={t("actions.delete")}
          tone="danger"
          pending={actions.remove.isPending}
          onConfirm={() => void remove(deleting)}
        />
      ) : null}
    </div>
  );
}
