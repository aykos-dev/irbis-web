"use client";

import { tableFeatures, useTable, type ColumnDef, type RowData } from "@tanstack/react-table";

import { Skeleton } from "./skeleton";

const features = tableFeatures({});

export type DataTableFeatures = typeof features;

type DataTableProps<TData extends RowData> = {
  columns: ColumnDef<typeof features, TData>[];
  data: TData[];
  getRowId: (row: TData) => string;
  /** Accessible name of the table. */
  caption: string;
  loading?: boolean;
  skeletonRows?: number;
  testId?: string;
  /** Column id the server sorted by, for aria-sort on its header. */
  sortedColumnId?: string;
  sortDirection?: "ascending" | "descending";
  /** Optional `data-testid` per body row. */
  rowTestId?: (row: TData) => string;
};

/**
 * Thin TanStack Table wrapper: features pass columns, this owns the markup. Sorting and
 * pagination are server-side, so only the core row model is registered; sortable headers
 * are rendered by the column definitions (buttons with aria-sort on the <th>).
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  caption,
  loading = false,
  skeletonRows = 8,
  testId,
  sortedColumnId,
  sortDirection,
  rowTestId,
}: DataTableProps<TData>) {
  const table = useTable({ features, columns, data, getRowId });
  const columnCount = columns.length;

  return (
    <div className="overflow-x-auto">
      <table data-testid={testId} aria-busy={loading || undefined} className="w-full border-collapse text-copy">
        <caption className="sr-only">{caption}</caption>
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  aria-sort={header.column.id === sortedColumnId ? sortDirection : undefined}
                  className="whitespace-nowrap border-b-2 border-line px-3 py-2.5 text-start text-caption uppercase text-muted"
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <tr key={index}>
                  {Array.from({ length: columnCount }, (_, cell) => (
                    <td key={cell} className="border-b-2 border-soft px-3 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            : table.getRowModel().rows.map((row) => (
                <tr key={row.id} data-testid={rowTestId?.(row.original)}>
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap border-b-2 border-soft px-3 py-3 text-ink">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
