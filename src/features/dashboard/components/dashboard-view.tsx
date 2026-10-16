"use client";

import { useTranslations } from "next-intl";

import { PageHeader } from "@/shared/components/layout/page-header";

export function DashboardView() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("subtitle")} />
    </div>
  );
}
