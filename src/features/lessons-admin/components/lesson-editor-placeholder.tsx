"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { PageHeader } from "@/shared/components/layout/page-header";

/** The lesson route until the editor lands (slice 5): only a way back to the tier. */
export function LessonEditorPlaceholder({ tierId }: { tierId: string }) {
  const t = useTranslations("lessonsAdmin.lessons");

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/lessons/${tierId}`}
        className="inline-flex items-center gap-1.5 self-start rounded-tile text-small font-black text-teal-700 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={3} />
        {t("backToTier")}
      </Link>
      <PageHeader title={t("editorTitle")} description={t("editorSoon")} />
    </div>
  );
}
