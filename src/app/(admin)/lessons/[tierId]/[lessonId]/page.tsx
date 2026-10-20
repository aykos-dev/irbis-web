import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LessonEditorPlaceholder } from "@/features/lessons-admin/components/lesson-editor-placeholder";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("lessonsAdmin.lessons");
  return { title: t("editorTitle") };
}

export default async function LessonPage({ params }: { params: Promise<{ tierId: string }> }) {
  const { tierId } = await params;
  return <LessonEditorPlaceholder tierId={tierId} />;
}
