import {
  AdminJoinedFilter,
  AdminUserSort,
  AdminUserStatus,
  Role,
  type AdminListUsersParams,
} from "@/shared/api/generated/model";

export const PAGE_SIZE = 20;

export type UsersQuery = {
  q: string;
  status: AdminUserStatus | "";
  role: Role | "";
  joined: AdminJoinedFilter | "";
  sort: AdminUserSort;
  /** Cursor of the page being shown ("" = first page). */
  cursor: string;
  /** Cursors of the pages before this one, oldest first, so "Previous" works with forward-only cursors. */
  back: string[];
};

function oneOf<T extends string>(values: Record<string, T>, value: string | null): T | "" {
  return Object.values(values).find((candidate) => candidate === value) ?? "";
}

function parseBack(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

/** Reads and validates list state from the URL; anything unknown falls back to the default. */
export function parseUsersQuery(params: URLSearchParams): UsersQuery {
  return {
    q: params.get("q") ?? "",
    status: oneOf(AdminUserStatus, params.get("status")),
    role: oneOf(Role, params.get("role")),
    joined: oneOf(AdminJoinedFilter, params.get("joined")),
    sort: oneOf(AdminUserSort, params.get("sort")) || AdminUserSort.joined_desc,
    cursor: params.get("cursor") ?? "",
    back: parseBack(params.get("back")),
  };
}

export function toApiParams(query: UsersQuery): AdminListUsersParams {
  return {
    ...(query.q ? { q: query.q } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.role ? { role: query.role } : {}),
    ...(query.joined ? { joined: query.joined } : {}),
    sort: query.sort,
    ...(query.cursor ? { cursor: query.cursor } : {}),
    limit: PAGE_SIZE,
  };
}

export function hasActiveFilters(query: UsersQuery): boolean {
  return Boolean(query.q || query.status || query.role || query.joined);
}

export function serializeBack(back: string[]): string | null {
  return back.length > 0 ? JSON.stringify(back) : null;
}
