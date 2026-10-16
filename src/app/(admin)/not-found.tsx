import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function AdminNotFound() {
  const t = useTranslations("common.errors");

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{t("notFoundTitle")}</CardTitle>
        <CardDescription>{t("notFoundDescription")}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="white">
          <Link href="/">{t("backHome")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
