"use client";

import { keepPreviousData } from "@tanstack/react-query";

import { useAdminListUsers } from "@/shared/api/generated/endpoints";

import { toApiParams, type UsersQuery } from "../users-query";

/** Server-side filter/sort/cursor (AC14); the previous page stays on screen while the next loads. */
export function useUsersList(query: UsersQuery) {
  return useAdminListUsers(toApiParams(query), { query: { placeholderData: keepPreviousData } });
}
