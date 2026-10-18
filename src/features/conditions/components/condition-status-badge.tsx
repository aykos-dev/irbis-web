"use client";

import { CircleCheck, CircleDashed, CircleX, Lock, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ConditionStatus } from "@/shared/api/generated/model";
import { Badge } from "@/shared/components/ui/badge";

/** design.md › Condition status: Go check, Caution warning triangle, Not now circled ×, Seasonal lock lock. */
const STATUS_VIEW = {
  go: { tone: "go", icon: CircleCheck },
  caution: { tone: "caution", icon: TriangleAlert },
  not_now: { tone: "notnow", icon: CircleX },
  seasonal_lock: { tone: "locked", icon: Lock },
  none: { tone: "neutral", icon: CircleDashed },
} as const;

/** Colour + icon + label, never colour alone. No status yet (null/absent) shows grey "No data". */
export function ConditionStatusBadge({ status }: { status: ConditionStatus | null | undefined }) {
  const t = useTranslations("conditions.status");
  const key = status ?? "none";
  const { tone, icon: Icon } = STATUS_VIEW[key];

  return (
    <Badge tone={tone} data-testid={`condition-status-${key}`}>
      <Icon aria-hidden="true" />
      {t(key)}
    </Badge>
  );
}
