"use client";

import { useQueryClient } from "@tanstack/react-query";

import {
  getAdminGetLessonQueryKey,
  getAdminListLessonTiersQueryKey,
  getAdminListTierLessonsQueryKey,
  useAdminDeleteLesson,
  useAdminPublishLesson,
  useAdminReplaceLesson,
  useAdminUnpublishLesson,
  useAdminUploadLessonImage,
} from "@/shared/api/generated/endpoints";
import type { AdminLessonDto } from "@/shared/api/generated/model";

/** Writes for one lesson; each keeps the lesson cache current and refreshes the tier lists. */
export function useLessonEditorActions(tierId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const refreshLists = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getAdminListTierLessonsQueryKey(tierId) }),
      queryClient.invalidateQueries({ queryKey: getAdminListLessonTiersQueryKey() }),
    ]);
  const store = (lesson: AdminLessonDto) => {
    queryClient.setQueryData(getAdminGetLessonQueryKey(lessonId), lesson);
    return refreshLists();
  };

  const replace = useAdminReplaceLesson({ mutation: { onSuccess: store } });
  const publish = useAdminPublishLesson({ mutation: { onSuccess: store } });
  const unpublish = useAdminUnpublishLesson({ mutation: { onSuccess: store } });
  const remove = useAdminDeleteLesson({
    mutation: {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: getAdminGetLessonQueryKey(lessonId) });
        return refreshLists();
      },
    },
  });
  const upload = useAdminUploadLessonImage();

  return {
    replace,
    publish,
    unpublish,
    remove,
    upload,
    busy: replace.isPending || publish.isPending || unpublish.isPending || remove.isPending,
  };
}
