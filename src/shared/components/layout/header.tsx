import { useTranslations } from "next-intl";

import { config } from "@/shared/config";

export function Header() {
  const t = useTranslations("common");

  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b-2 border-line bg-card px-6">
      <span className="text-h2 text-teal-700">{t("appName")}</span>
      {config.env !== "production" ? (
        <span className="inline-flex min-h-chip items-center rounded-pill bg-orange-tint px-2.5 text-chip text-on-orange">
          {t(`env.${config.env}`)}
        </span>
      ) : null}
    </header>
  );
}
