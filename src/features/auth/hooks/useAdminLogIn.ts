"use client";

import { useAdminAuthLogIn } from "@/shared/api/generated/endpoints";

import { useSession } from "@/shared/api/session";

/** Wraps the generated log-in mutation: the form shows the outcome, so no toast here. */
export function useAdminLogIn() {
  const { startSession } = useSession();
  return useAdminAuthLogIn({ mutation: { onSuccess: (session) => startSession(session) } });
}
