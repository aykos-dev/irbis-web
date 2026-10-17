"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { useSession } from "@/shared/api/session";

/** Sidebar footer (canvas W3): avatar initial, username, role, Sign out. */
export function SessionMenu() {
  const t = useTranslations("auth.session");
  const { me, signOut } = useSession();
  if (!me) return null;

  return (
    <div className="flex items-center gap-3 border-t-2 border-soft px-1.5 pt-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-teal-tint font-black text-teal-700"
      >
        {me.username.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p data-testid="admin.session-username" className="truncate text-small font-black text-ink">
          {me.username}
        </p>
        <p className="text-small text-muted">{t("role")}</p>
      </div>
      <button
        type="button"
        data-testid="admin.sign-out"
        onClick={() => void signOut()}
        className="inline-flex min-h-touch items-center gap-1.5 rounded-tile px-2 text-small font-black text-teal-700 hover:bg-soft"
      >
        <LogOut aria-hidden="true" className="size-4" strokeWidth={2.5} />
        {t("signOut")}
      </button>
    </div>
  );
}
