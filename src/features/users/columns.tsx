"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import type { AdminUserListItemDto, AdminUserSort, Role } from "@/shared/api/generated/model";
import type { DataTableFeatures } from "@/shared/components/ui/data-table";
import { formatDate, formatRelative } from "@/shared/lib/format";

import { StatusBadge } from "./components/status-badge";

type SortKey = "joined" | "active";

export type UsersColumnsInput = {
  labels: {
    username: string;
    joined: string;
    lastActive: string;
    status: string;
    role: string;
    recoveryPhone: string;
  };
  roleLabels: Record<Role, string>;
  locale: string;
  sort: AdminUserSort;
  onSort: (next: AdminUserSort) => void;
};

function sortState(sort: AdminUserSort, key: SortKey): "asc" | "desc" | null {
  const [column, direction] = sort.split("_");
  return column === key ? (direction === "asc" ? "asc" : "desc") : null;
}

function SortHeader({
  label,
  sortKey,
  input,
}: {
  label: string;
  sortKey: SortKey;
  input: UsersColumnsInput;
}) {
  const state = sortState(input.sort, sortKey);
  const next = `${sortKey === "joined" ? "joined" : "active"}_${state === "desc" ? "asc" : "desc"}` as AdminUserSort;
  const Icon = state === "desc" ? ArrowDown : state === "asc" ? ArrowUp : ChevronsUpDown;

  return (
    <button
      type="button"
      data-testid={`admin.users-sort-${sortKey}`}
      onClick={() => input.onSort(next)}
      className="inline-flex min-h-touch items-center gap-1 uppercase hover:text-ink"
    >
      {label}
      <Icon aria-hidden="true" className="size-4" strokeWidth={2.5} />
    </button>
  );
}

export function createUserColumns(input: UsersColumnsInput): ColumnDef<DataTableFeatures, AdminUserListItemDto>[] {
  const { labels, roleLabels, locale } = input;
  return [
    {
      id: "username",
      header: () => labels.username,
      cell: ({ row }) => (
        <Link
          href={`/users/${row.original.id}`}
          className="rounded-tile font-black text-teal-700 hover:underline"
        >
          {row.original.username}
        </Link>
      ),
    },
    {
      id: "joined",
      header: () => <SortHeader label={labels.joined} sortKey="joined" input={input} />,
      cell: ({ row }) => formatDate(row.original.joinedAt, locale),
    },
    {
      id: "active",
      header: () => <SortHeader label={labels.lastActive} sortKey="active" input={input} />,
      cell: ({ row }) => formatRelative(row.original.lastActiveAt, locale),
    },
    {
      id: "status",
      header: () => labels.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "role",
      header: () => labels.role,
      cell: ({ row }) => roleLabels[row.original.role],
    },
    {
      id: "phone",
      header: () => labels.recoveryPhone,
      cell: ({ row }) => row.original.recoveryPhoneMasked ?? "—",
    },
  ];
}
