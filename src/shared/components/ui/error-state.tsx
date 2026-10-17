"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "./button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
};

/** Plain-language failure with a Retry wired to `refetch`; never shows raw error text. */
export function ErrorState({ title, description, onRetry, retrying = false }: ErrorStateProps) {
  const t = useTranslations("common.errors");

  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-pill bg-status-notnow-bg text-status-notnow-fg">
        <TriangleAlert aria-hidden="true" className="size-7" strokeWidth={2.5} />
      </span>
      <p className="text-h3 text-ink">{title ?? t("title")}</p>
      <p className="max-w-md text-copy text-muted">{description ?? t("description")}</p>
      {onRetry ? (
        <Button variant="white" onClick={onRetry} aria-disabled={retrying || undefined}>
          {retrying ? t("retrying") : t("retry")}
        </Button>
      ) : null}
    </div>
  );
}
