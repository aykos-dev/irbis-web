"use client";

import { Ban, CircleCheck, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import type { AdminUserStatus } from "@/shared/api/generated/model";
import { Badge } from "@/shared/components/ui/badge";

const STATUS_VIEW = {
  active: { tone: "go", icon: CircleCheck },
  blocked: { tone: "notnow", icon: Ban },
  locked: { tone: "caution", icon: Lock },
} as const;

/** Status is colour + icon + label, never colour alone. */
export function StatusBadge({ status, label }: { status: AdminUserStatus; label?: string }) {
  const t = useTranslations("users.status");
  const { tone, icon: Icon } = STATUS_VIEW[status];

  return (
    <Badge tone={tone} data-testid={`admin.user-status-${status}`}>
      <Icon aria-hidden="true" />
      {label ?? t(status)}
    </Badge>
  );
}
