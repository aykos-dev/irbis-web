"use client";

import type { Role } from "@/shared/api/generated/model";

export type Permission = "users.change-role" | "users.block" | "users.manage";

type PermissionContext = {
  /** The signed-in admin's role. */
  role: Role | null;
  /** The id of the signed-in admin, to forbid acting on yourself. */
  selfId: string | null;
  /** The record the action targets, when there is one. */
  targetId?: string;
};

/**
 * Hides controls the session can't use. The API still enforces every rule; this is UX only.
 */
export function can(permission: Permission, { role, selfId, targetId }: PermissionContext): boolean {
  if (role !== "admin") return false;
  if (permission === "users.change-role" || permission === "users.block") return targetId === undefined || targetId !== selfId;
  return true;
}

export function usePermission(
  permission: Permission,
  context: PermissionContext,
): boolean {
  return can(permission, context);
}
