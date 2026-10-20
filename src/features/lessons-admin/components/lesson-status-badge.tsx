"use client";

import { CircleCheck, CircleDashed } from "lucide-react";
import { useTranslations } from "next-intl";

import type { LessonStatus } from "@/shared/api/generated/model";
import { Badge } from "@/shared/components/ui/badge";

/** Draft grey, Published green; always icon + label. */
export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  const t = useTranslations("lessonsAdmin.status");
  const published = status === "published";
  const Icon = published ? CircleCheck : CircleDashed;

  return (
    <Badge tone={published ? "go" : "neutral"} data-testid={`lesson-status-${status}`}>
      <Icon aria-hidden="true" />
      {t(status)}
    </Badge>
  );
}
