"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, type ReactNode } from "react";

import { Skeleton } from "@/shared/components/ui/skeleton";

import { useSession } from "@/shared/api/session";

/** Client-side counterpart of proxy.ts: no admin session → /login. Renders nothing private until known. */
export function AdminGate({ children }: { children: ReactNode }) {
  const t = useTranslations("common");
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          {t("loading")}
        </span>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  return children;
}
