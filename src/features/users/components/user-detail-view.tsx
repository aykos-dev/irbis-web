"use client";

import { ArrowLeft, UserX, WifiOff } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { ApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/api/session";
import { PageHeader } from "@/shared/components/layout/page-header";
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { formatDate, formatNumber, formatRelative } from "@/shared/lib/format";

import { useUserDetail } from "../hooks/useUserDetail";
import { AuditTable } from "./audit-table";
import { StatusBadge } from "./status-badge";
import { UserActions } from "./user-actions";

function Fact({ label, children, testId }: { label: string; children: ReactNode; testId?: string }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-0.5">
      <dt className="w-40 shrink-0 text-small text-muted">{label}</dt>
      <dd data-testid={testId} className="min-w-0 flex-1 text-copy text-ink">
        {children}
      </dd>
    </div>
  );
}

/** Canvas W5: facts, actions, audit log. Phones appear only as the API masks them. */
export function UserDetailView({ userId }: { userId: string }) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const { isOnline } = useNetworkStatus();
  const tReasons = useTranslations("users.reasons");
  const locale = useLocale();
  const { me } = useSession();
  const detail = useUserDetail(userId);

  const back = (
    <Link href="/users" className="inline-flex min-h-touch items-center gap-1.5 text-small font-black text-teal-700 hover:underline">
      <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2.5} />
      {t("detail.back")}
    </Link>
  );

  if (detail.isPending && !detail.isError && !isOnline) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <Card>
          <EmptyState icon={WifiOff} title={t("detail.offlineTitle")} description={tCommon("offlineNoData")} />
        </Card>
      </div>
    );
  }

  if (detail.isPending) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          {t("detail.loading")}
        </span>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (detail.isError) {
    const missing = detail.error instanceof ApiError && detail.error.code === "NOT_FOUND";
    return (
      <div className="flex flex-col gap-4">
        {back}
        <Card>
          {missing ? (
            <EmptyState
              icon={UserX}
              title={t("detail.notFoundTitle")}
              description={t("detail.notFoundDescription")}
              action={
                <Button asChild variant="white">
                  <Link href="/users">{t("detail.back")}</Link>
                </Button>
              }
            />
          ) : (
            <ErrorState
              title={t("detail.errorTitle")}
              description={t("detail.errorDescription")}
              onRetry={() => void detail.refetch()}
              retrying={detail.isFetching}
            />
          )}
        </Card>
      </div>
    );
  }

  const user = detail.data;
  const statusLabel =
    user.status === "blocked" && user.blockReasonCode
      ? t("detail.blockedBecause", { reason: tReasons(user.blockReasonCode) })
      : user.status === "locked" && user.lockedForSec
        ? t("detail.lockedFor", { minutes: Math.max(1, Math.ceil(user.lockedForSec / 60)) })
        : undefined;
  const summary = [
    t("detail.joined", { date: formatDate(user.joinedAt, locale) }),
    t("detail.lastActive", { when: formatRelative(user.lastActiveAt, locale) }),
    ...(user.level !== null ? [t("detail.level", { level: user.level })] : []),
  ].join(" · ");
  const phone = user.recoveryPhoneMasked
    ? `${user.recoveryPhoneMasked} · ${user.recoveryPhoneVerified ? t("detail.phoneVerified") : t("detail.phoneUnverified")}`
    : t("detail.phoneNone");

  return (
    <div className="flex flex-col gap-6">
      {back}
      {!isOnline ? <p className="text-small text-muted">{tCommon("stale")}</p> : null}
      <PageHeader
        title={user.username}
        description={summary}
        actions={<StatusBadge status={user.status} label={statusLabel} />}
      />

      <div className="flex flex-wrap gap-5">
        <Card className="min-w-80 flex-1">
          <CardHeader>
            <CardTitle>{t("detail.account")}</CardTitle>
          </CardHeader>
          <dl className="flex flex-col gap-2.5">
            <Fact label={t("detail.role")} testId="admin.user-role">
              {t(`roles.${user.role}`)}
            </Fact>
            <Fact label={t("detail.recoveryPhone")} testId="admin.user-phone">
              {phone}
            </Fact>
            <Fact label={t("detail.language")}>{t(`languages.${user.locale}`)}</Fact>
            <Fact label={t("detail.sessions")} testId="admin.user-sessions">
              {formatNumber(user.sessionsCount, locale)}
              {user.status === "blocked" ? ` ${t("detail.sessionsBlocked")}` : ""}
            </Fact>
          </dl>
        </Card>
        <UserActions className="min-w-80 flex-1" user={user} selfId={me?.id ?? null} selfRole={me?.role ?? null} />
      </div>

      <AuditTable userId={user.id} />
    </div>
  );
}
