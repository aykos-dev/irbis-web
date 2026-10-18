"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

import { adminListConditions, getAdminListConditionsQueryKey } from "@/shared/api/generated/endpoints";

import { toApiParams, type ConditionsFilter } from "../conditions-query";

/**
 * Cursor "Load more" over the generated fetcher: pages accumulate under the generated list
 * key, so invalidating `getAdminListConditionsQueryKey()` refreshes every loaded page.
 */
export function useConditionsList(status: ConditionsFilter) {
  const params = toApiParams(status);
  return useInfiniteQuery({
    queryKey: getAdminListConditionsQueryKey(params),
    queryFn: ({ pageParam, signal }) =>
      adminListConditions({ ...params, ...(pageParam ? { cursor: pageParam } : {}) }, undefined, signal),
    initialPageParam: "",
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });
}
