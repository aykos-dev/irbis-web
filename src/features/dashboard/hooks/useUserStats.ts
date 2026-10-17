"use client";

import { useAdminUserStats } from "@/shared/api/generated/endpoints";

const STATS_STALE_MS = 30_000;

/** Aggregates only (AC13). Refetches on focus; 30 s is fresh enough for counts. */
export function useUserStats() {
  return useAdminUserStats({ query: { staleTime: STATS_STALE_MS } });
}
