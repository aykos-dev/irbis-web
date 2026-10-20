import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LessonEditor } from "@/features/lessons-admin/components/lesson-editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("lessonsAdmin.lessons");
  return { title: t("editorTitle") };
}

export default async function LessonPage({ params }: { params: Promise<{ tierId: string; lessonId: string }> }) {
  const { tierId, lessonId } = await params;
  return <LessonEditor tierId={tierId} lessonId={lessonId} />;
}
