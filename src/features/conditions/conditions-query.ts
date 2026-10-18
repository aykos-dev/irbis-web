import { AdminConditionStatusFilter, type AdminListConditionsParams } from "@/shared/api/generated/model";

export const PAGE_SIZE = 50;

/** "" = all statuses. */
export type ConditionsFilter = AdminConditionStatusFilter | "";

/** Reads the status filter from the URL; anything unknown means "all". */
export function parseConditionsFilter(params: URLSearchParams): ConditionsFilter {
  const value = params.get("status");
  return Object.values(AdminConditionStatusFilter).find((candidate) => candidate === value) ?? "";
}

export function toApiParams(status: ConditionsFilter): AdminListConditionsParams {
  return { ...(status ? { status } : {}), limit: PAGE_SIZE };
}
