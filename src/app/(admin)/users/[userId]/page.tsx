import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { UserDetailView } from "@/features/users/components/user-detail-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("users.detail");
  return { title: t("title") };
}

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserDetailView userId={userId} />;
}
