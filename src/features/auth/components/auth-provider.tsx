"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { registerSessionHandlers, refreshAccessToken, setAccessToken } from "@/shared/api/auth";
import { adminAuthRefresh, adminAuthSignOut, meGet } from "@/shared/api/generated/endpoints";
import type { AdminSessionResponseDto, MeResponseDto } from "@/shared/api/generated/model";
import { toast } from "@/shared/components/ui/toaster";

import { SessionContext, type SessionStatus } from "@/shared/api/session";
import { clearSessionHint, setSessionHint } from "../session-hint";

/**
 * Session bootstrap (architecture › Provider Hierarchy): on load one single-flight refresh from
 * the httpOnly cookie restores the in-memory access token. Sits inside QueryClientProvider so
 * sign-out can clear the cache.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [me, setMe] = useState<MeResponseDto | null>(null);

  const endSession = useCallback(() => {
    setAccessToken(null);
    queryClient.clear();
    setMe(null);
    setStatus("anonymous");
  }, [queryClient]);

  useEffect(() => {
    registerSessionHandlers({
      refresh: () => adminAuthRefresh().then((answer) => answer.accessToken),
      onExpired: () => {
        endSession();
        toast.error(t("sessionExpired"));
        router.replace("/login");
      },
    });
    return () => registerSessionHandlers(null);
  }, [endSession, router, t]);

  useEffect(() => {
    let active = true;
    refreshAccessToken()
      .then(() => meGet())
      .then((current) => {
        if (!active) return;
        if (current.role !== "admin") {
          endSession();
          return;
        }
        setMe(current);
        setStatus("authenticated");
      })
      .catch(() => {
        if (active) endSession();
      });
    return () => {
      active = false;
    };
  }, [endSession]);

  useEffect(() => {
    if (status === "authenticated") setSessionHint();
    else if (status === "anonymous") clearSessionHint();
  }, [status]);

  const startSession = useCallback((session: AdminSessionResponseDto) => {
    setAccessToken(session.accessToken);
    setMe(session.me);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await adminAuthSignOut();
    } catch {
      // The cookie may already be gone; the local session ends either way.
    }
    endSession();
  }, [endSession]);

  const value = useMemo(() => ({ status, me, startSession, signOut }), [status, me, startSession, signOut]);

  return <SessionContext value={value}>{children}</SessionContext>;
}
