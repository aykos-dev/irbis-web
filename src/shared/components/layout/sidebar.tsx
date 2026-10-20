"use client";

import { BookOpen, CloudSun, LayoutDashboard, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { BrandMark } from "@/shared/components/layout/brand-mark";
import { cn } from "@/shared/lib/cn";

type NavItem = {
  href: "/" | "/users" | "/conditions" | "/lessons";
  labelKey: "common.nav.dashboard" | "common.nav.users" | "conditions.nav" | "lessonsAdmin.nav";
  icon: LucideIcon;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", labelKey: "common.nav.dashboard", icon: LayoutDashboard },
  { href: "/users", labelKey: "common.nav.users", icon: Users },
  { href: "/conditions", labelKey: "conditions.nav", icon: CloudSun },
  { href: "/lessons", labelKey: "lessonsAdmin.nav", icon: BookOpen },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ footer }: { footer?: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav aria-label={t("common.nav.label")} className="flex w-64 shrink-0 flex-col gap-1 border-e-2 border-line bg-card p-4">
      <div className="flex items-center gap-2.5 px-1.5 pb-4">
        <BrandMark size={40} />
        <span className="text-h3 text-ink">{t("common.nav.brand")}</span>
      </div>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-touch items-center gap-3 rounded-tile border-2 px-3 text-h3 transition duration-150",
                  active
                    ? "border-nav-active-border bg-nav-active-bg text-nav-active-fg"
                    : "border-transparent text-body hover:bg-soft",
                )}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.5} />
                <span>{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {footer ? <div className="mt-auto">{footer}</div> : null}
    </nav>
  );
}
