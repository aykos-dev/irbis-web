"use client";

import { useHealthCheck } from "@/shared/api/generated/endpoints/health/health";
import { HealthCheckResponse } from "@/shared/api/generated/endpoints/health/health.zod";

/** GET /health answers 503 with the same body when the database is down (health.md › API). */
const acceptHealthStatuses = (status: number) => status === 200 || status === 503;

/**
 * API status for the dashboard. A 503 is data ("degraded"), not an error; its body is
 * validated with the generated zod schema so an unrelated 503 (proxy page) still errors.
 */
export function useApiStatus() {
  return useHealthCheck({
    request: { validateStatus: acceptHealthStatuses },
    query: { select: (data) => HealthCheckResponse.parse(data) },
  });
}
