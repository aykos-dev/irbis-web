"use client";

import { Ban, Hand } from "lucide-react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import type { AdminConditionRowDto, ConditionSource, PlaceType } from "@/shared/api/generated/model";
import { Badge } from "@/shared/components/ui/badge";
import type { DataTableFeatures } from "@/shared/components/ui/data-table";
import { formatDateTime, formatRelative } from "@/shared/lib/format";

import { ConditionStatusBadge } from "./components/condition-status-badge";

export type ConditionsColumnsInput = {
  labels: {
    place: string;
    type: string;
    status: string;
    source: string;
    updated: string;
    flags: string;
    never: string;
    flagClosure: string;
    flagOverride: string;
    forecastAge: (time: string) => string;
  };
  typeLabels: Record<PlaceType, string>;
  sourceLabels: Record<ConditionSource, string>;
  locale: string;
};

export function createConditionColumns(
  input: ConditionsColumnsInput,
): ColumnDef<DataTableFeatures, AdminConditionRowDto>[] {
  const { labels, typeLabels, sourceLabels, locale } = input;
  return [
    {
      id: "place",
      header: () => labels.place,
      cell: ({ row }) => (
        <Link
          href={`/conditions/${row.original.placeId}`}
          className="rounded-tile font-black text-teal-700 hover:underline"
        >
          {row.original.name.uz}
        </Link>
      ),
    },
    {
      id: "type",
      header: () => labels.type,
      cell: ({ row }) => typeLabels[row.original.type],
    },
    {
      id: "status",
      header: () => labels.status,
      cell: ({ row }) => <ConditionStatusBadge status={row.original.status} />,
    },
    {
      id: "source",
      header: () => labels.source,
      cell: ({ row }) => (row.original.source ? sourceLabels[row.original.source] : "—"),
    },
    {
      id: "updated",
      header: () => labels.updated,
      cell: ({ row }) => {
        const { computedAt, forecastAt } = row.original;
        return (
          <div className="flex flex-col">
            {computedAt ? (
              <time dateTime={computedAt} title={formatDateTime(computedAt, locale)}>
                {formatRelative(computedAt, locale)}
              </time>
            ) : (
              <span className="text-muted">{labels.never}</span>
            )}
            {forecastAt ? (
              <time dateTime={forecastAt} title={formatDateTime(forecastAt, locale)} className="text-small text-muted">
                {labels.forecastAge(formatRelative(forecastAt, locale))}
              </time>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "flags",
      header: () => labels.flags,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1.5">
          {row.original.activeClosureId ? (
            <Badge tone="notnow">
              <Ban aria-hidden="true" />
              {labels.flagClosure}
            </Badge>
          ) : null}
          {row.original.activeOverrideId ? (
            <Badge tone="neutral">
              <Hand aria-hidden="true" />
              {labels.flagOverride}
            </Badge>
          ) : null}
        </div>
      ),
    },
  ];
}
