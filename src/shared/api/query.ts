import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./errors";

const MINUTE = 60_000;

/** Retry transient failures only; 4xx answers will not change on retry. */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status !== null && error.status < 500) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: MINUTE,
        gcTime: 10 * MINUTE,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
        networkMode: "online",
      },
      mutations: {
        retry: false,
        networkMode: "online",
      },
    },
  });
}
