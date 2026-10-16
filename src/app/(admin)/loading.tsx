import { useTranslations } from "next-intl";

import { Skeleton } from "@/shared/components/ui/skeleton";

export default function AdminLoading() {
  const t = useTranslations("common");

  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
