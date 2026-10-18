import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ConditionsListView } from "@/features/conditions/components/conditions-list-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("conditions");
  return { title: t("title") };
}

export default function ConditionsPage() {
  return <ConditionsListView />;
}
