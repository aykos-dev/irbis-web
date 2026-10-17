"use client";

import { useQueryClient } from "@tanstack/react-query";

import {
  getAdminGetUserQueryKey,
  getAdminListUsersQueryKey,
  getAdminUserAuditQueryKey,
  getAdminUserStatsQueryKey,
  useAdminBlockUser,
  useAdminSetUserPassword,
  useAdminSetUserRecoveryPhone,
  useAdminSetUserRole,
  useAdminUnblockUser,
} from "@/shared/api/generated/endpoints";

/**
 * The five admin actions with precise invalidation: the detail and its audit log always
 * change; the list changes when status/role/phone change; the dashboard counts blocked users.
 * Returning the invalidation promise keeps the mutation pending until the page is fresh.
 */
export function useUserActions(userId: string) {
  const queryClient = useQueryClient();

  function invalidate(options: { list?: boolean; stats?: boolean } = {}) {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: getAdminGetUserQueryKey(userId) }),
      queryClient.invalidateQueries({ queryKey: getAdminUserAuditQueryKey(userId) }),
      options.list ? queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() }) : undefined,
      options.stats ? queryClient.invalidateQueries({ queryKey: getAdminUserStatsQueryKey() }) : undefined,
    ]);
  }

  return {
    block: useAdminBlockUser({ mutation: { onSuccess: () => invalidate({ list: true, stats: true }) } }),
    unblock: useAdminUnblockUser({ mutation: { onSuccess: () => invalidate({ list: true, stats: true }) } }),
    setPassword: useAdminSetUserPassword({ mutation: { onSuccess: () => invalidate() } }),
    setRecoveryPhone: useAdminSetUserRecoveryPhone({ mutation: { onSuccess: () => invalidate({ list: true }) } }),
    setRole: useAdminSetUserRole({ mutation: { onSuccess: () => invalidate({ list: true }) } }),
  };
}
