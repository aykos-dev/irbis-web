"use client";

import { useAdminGetConditionControls } from "@/shared/api/generated/endpoints";

export function useConditionControls(placeId: string) {
  return useAdminGetConditionControls(placeId);
}
