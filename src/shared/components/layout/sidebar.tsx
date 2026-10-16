"use client";

import { LayoutDashboard, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";

type NavItem = {
  href: "/";
  labelKey: "dashboard";
  icon: LucideIcon;
};

const NAV_ITEMS: readonly NavItem[] = [{ href: "/", labelKey: "dashboard", icon: LayoutDashboard }];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const t = useTranslations("common.nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex w-64 shrink-0 flex-col gap-1 border-e-2 border-line bg-card p-4">
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
    </nav>
  );
}
