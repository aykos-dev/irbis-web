"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common.errors");

  return (
    <Card role="alert" className="max-w-xl">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={reset}>{t("retry")}</Button>
      </CardFooter>
    </Card>
  );
}
