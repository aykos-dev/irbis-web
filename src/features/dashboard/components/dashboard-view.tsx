"use client";

import { useTranslations } from "next-intl";

import { ApiStatusCard } from "@/features/dashboard/components/api-status-card";
import { UserStats } from "@/features/dashboard/components/user-stats";
import { PageHeader } from "@/shared/components/layout/page-header";

export function DashboardView() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <UserStats />
      <p className="text-small text-muted">{t("aggregatesOnly")}</p>
      <ApiStatusCard />
    </div>
  );
}
