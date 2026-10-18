"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { ApiError } from "@/shared/api/errors";
import { getAdminListConditionsQueryKey, useAdminRecomputeConditions } from "@/shared/api/generated/endpoints";

/** After a 409 RECOMPUTE_RUNNING the button stays busy this long before allowing another try. */
export const RUNNING_COOLDOWN_MS = 30_000;

export type RecomputeOutcome = "started" | "running" | "failed";

export function useRecompute(onOutcome: (outcome: RecomputeOutcome) => void) {
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setRunning(false), RUNNING_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [running]);

  const mutation = useAdminRecomputeConditions({
    mutation: {
      onSuccess: () => {
        onOutcome("started");
        return queryClient.invalidateQueries({ queryKey: getAdminListConditionsQueryKey() });
      },
      onError: (error) => {
        if (error instanceof ApiError && error.code === "RECOMPUTE_RUNNING") {
          setRunning(true);
          onOutcome("running");
        } else {
          onOutcome("failed");
        }
      },
    },
  });

  return { start: () => mutation.mutate(), busy: mutation.isPending || running };
}
