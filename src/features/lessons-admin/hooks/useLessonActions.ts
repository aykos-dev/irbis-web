"use client";

import { useQueryClient } from "@tanstack/react-query";

import {
  getAdminListLessonTiersQueryKey,
  getAdminListTierLessonsQueryKey,
  useAdminCreateLesson,
  useAdminReorderTierLessons,
} from "@/shared/api/generated/endpoints";

/** Lesson writes for one tier; refreshes the tier's lessons and the tier counts. */
export function useLessonActions(tierId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getAdminListTierLessonsQueryKey(tierId) }),
      queryClient.invalidateQueries({ queryKey: getAdminListLessonTiersQueryKey() }),
    ]);

  return {
    create: useAdminCreateLesson({ mutation: { onSuccess: () => refresh() } }),
    reorder: useAdminReorderTierLessons({
      mutation: { onSuccess: (list) => queryClient.setQueryData(getAdminListTierLessonsQueryKey(tierId), list) },
    }),
  };
}
