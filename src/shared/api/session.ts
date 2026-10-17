"use client";

import { createContext, useContext } from "react";

import type { AdminSessionResponseDto, MeResponseDto } from "@/shared/api/generated/model";

export type SessionStatus = "loading" | "authenticated" | "anonymous";

export type SessionContextValue = {
  status: SessionStatus;
  me: MeResponseDto | null;
  /** Called by the log-in form with the API answer; the access token goes to memory. */
  startSession: (session: AdminSessionResponseDto) => void;
  signOut: () => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <AuthProvider>");
  return value;
}
