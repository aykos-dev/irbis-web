"use client";

import { useQueryClient } from "@tanstack/react-query";

import {
  getAdminGetConditionControlsQueryKey,
  getAdminListConditionsQueryKey,
  useAdminCreateClosure,
  useAdminCreateOverride,
  useAdminEndClosure,
  useAdminEndOverride,
} from "@/shared/api/generated/endpoints";

/**
 * Closure and override writes for one place. Every outcome that changes the place (success,
 * or "already ended" which means the screen is stale) refreshes the place view and the list.
 */
export function useConditionActions(placeId: string) {
  const queryClient = useQueryClient();

  function refresh() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: getAdminGetConditionControlsQueryKey(placeId) }),
      queryClient.invalidateQueries({ queryKey: getAdminListConditionsQueryKey() }),
    ]);
  }

  return {
    refresh,
    createClosure: useAdminCreateClosure({ mutation: { onSuccess: () => refresh() } }),
    endClosure: useAdminEndClosure({ mutation: { onSuccess: () => refresh() } }),
    createOverride: useAdminCreateOverride({ mutation: { onSuccess: () => refresh() } }),
    endOverride: useAdminEndOverride({ mutation: { onSuccess: () => refresh() } }),
  };
}
