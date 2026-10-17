"use client";

import { History } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Card, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { formatDateTime } from "@/shared/lib/format";

import { useUserAudit } from "../hooks/useUserDetail";

/** Canvas W5 "Audit log": newest first as the API returns it; never shows passwords or full phones. */
export function AuditTable({ userId }: { userId: string }) {
  const t = useTranslations("users.audit");
  const tReasons = useTranslations("users.reasons");
  const locale = useLocale();
  const audit = useUserAudit(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      {audit.isPending ? (
        <div aria-busy="true" className="flex flex-col gap-2">
          <span role="status" className="sr-only">
            {t("loading")}
          </span>
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      ) : audit.isError ? (
        <ErrorState
          title={t("errorTitle")}
          description={t("errorDescription")}
          onRetry={() => void audit.refetch()}
          retrying={audit.isFetching}
        />
      ) : audit.data.items.length === 0 ? (
        <EmptyState icon={History} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <div className="overflow-x-auto">
          <table data-testid="admin.audit-table" className="w-full border-collapse text-copy">
            <caption className="sr-only">{t("caption")}</caption>
            <thead>
              <tr>
                {(["when", "admin", "action", "reason"] as const).map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="whitespace-nowrap border-b-2 border-line px-3 py-2.5 text-start text-caption uppercase text-muted"
                  >
                    {t(`columns.${column}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {audit.data.items.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap border-b-2 border-soft px-3 py-3 text-ink">
                    {formatDateTime(entry.at, locale)}
                  </td>
                  <td className="whitespace-nowrap border-b-2 border-soft px-3 py-3 text-ink">
                    {entry.admin.username}
                  </td>
                  <td className="whitespace-nowrap border-b-2 border-soft px-3 py-3 text-ink">
                    {t(`actions.${entry.action}`)}
                  </td>
                  <td className="border-b-2 border-soft px-3 py-3 text-ink">
                    {entry.reasonCode ? <span className="font-black">{tReasons(entry.reasonCode)}</span> : null}
                    {entry.reasonCode && entry.note ? " · " : null}
                    {entry.note}
                    {entry.detail ? <span className="block text-small text-muted">{entry.detail}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
