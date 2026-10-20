import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TierLessonsView } from "@/features/lessons-admin/components/tier-lessons-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("lessonsAdmin.tiers");
  return { title: t("title") };
}

export default async function TierLessonsPage({ params }: { params: Promise<{ tierId: string }> }) {
  const { tierId } = await params;
  return <TierLessonsView tierId={tierId} />;
}
