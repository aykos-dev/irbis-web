import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TiersView } from "@/features/lessons-admin/components/tiers-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("lessonsAdmin.tiers");
  return { title: t("title") };
}

export default function LessonsPage() {
  return <TiersView />;
}
