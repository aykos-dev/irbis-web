import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PlaceConditionsView } from "@/features/conditions/components/place-conditions-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("conditions.place");
  return { title: t("title") };
}

export default async function PlaceConditionsPage({ params }: { params: Promise<{ placeId: string }> }) {
  const { placeId } = await params;
  return <PlaceConditionsView placeId={placeId} />;
}
