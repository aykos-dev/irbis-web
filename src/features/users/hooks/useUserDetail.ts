"use client";

import { useAdminGetUser, useAdminUserAudit } from "@/shared/api/generated/endpoints";

export function useUserDetail(userId: string) {
  return useAdminGetUser(userId);
}

export function useUserAudit(userId: string) {
  return useAdminUserAudit(userId);
}
