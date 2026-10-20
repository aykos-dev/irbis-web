"use client";

import { useQueryClient } from "@tanstack/react-query";

import {
  getAdminListLessonTiersQueryKey,
  useAdminCreateLessonTier,
  useAdminDeleteLessonTier,
  useAdminReorderLessonTiers,
  useAdminUpdateLessonTier,
} from "@/shared/api/generated/endpoints";

/** Tier writes; every success refreshes the tier list (counts and order come from the server). */
export function useTierActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: getAdminListLessonTiersQueryKey() });

  return {
    create: useAdminCreateLessonTier({ mutation: { onSuccess: () => refresh() } }),
    update: useAdminUpdateLessonTier({ mutation: { onSuccess: () => refresh() } }),
    remove: useAdminDeleteLessonTier({ mutation: { onSuccess: () => refresh() } }),
    reorder: useAdminReorderLessonTiers({
      mutation: { onSuccess: (list) => queryClient.setQueryData(getAdminListLessonTiersQueryKey(), list) },
    }),
  };
}
