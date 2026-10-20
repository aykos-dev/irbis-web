"use client";

import { useTranslations } from "next-intl";
import { useId, useState, type ChangeEvent } from "react";

import { ApiError } from "@/shared/api/errors";
import type { LessonImageDto, LessonImageUploadDto } from "@/shared/api/generated/model";
import { Button } from "@/shared/components/ui/button";
import { toast } from "@/shared/components/ui/toaster";
import { cn } from "@/shared/lib/cn";

const ACCEPT = "image/jpeg,image/png,image/webp";

type UploadProblem = "imageType" | "imageSize";

type QuestionImageProps = {
  /** 1-based question number, for the testID and labels. */
  number: number;
  image: LessonImageDto | null;
  onChange: (image: LessonImageDto | null) => void;
  upload: (file: File) => Promise<LessonImageUploadDto>;
  serverError: boolean;
  disabled: boolean;
  isOnline: boolean;
};

/** File input → upload → preview from the returned url; 415 / 413 shown under the input. */
export function QuestionImage({ number, image, onChange, upload, serverError, disabled, isOnline }: QuestionImageProps) {
  const t = useTranslations("lessonsAdmin");
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<UploadProblem | null>(null);
  const message = problem ? t(`editor.${problem}`) : serverError ? t("validation.server") : null;

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      input.value = "";
      return;
    }
    setProblem(null);
    setUploading(true);
    try {
      const uploaded = await upload(file);
      onChange({ key: uploaded.key, url: uploaded.url });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 415) setProblem("imageType");
      else if (error instanceof ApiError && error.status === 413) setProblem("imageSize");
      else if (error instanceof ApiError && error.status === null) toast.error(t("toasts.offline"));
      else toast.error(t("toasts.error"));
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-black text-ink">
        {t("editor.image")}
      </label>
      {image ? (
        <div className="flex flex-wrap items-end gap-3">
          {/* Admin preview from the storage host; plain img keeps next.config untouched. */}
          <img
            src={image.url}
            alt={t("editor.imageAlt", { n: number })}
            className="max-h-40 rounded-tile border-2 border-line object-contain"
          />
          <Button variant="white" disabled={disabled || uploading} onClick={() => onChange(null)}>
            {t("editor.removeImage")}
          </Button>
        </div>
      ) : null}
      <input
        id={id}
        type="file"
        accept={ACCEPT}
        disabled={disabled || uploading}
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-message` : undefined}
        data-testid={`lessons.editor.q.${number}.image`}
        onChange={(event) => void pick(event)}
        className={cn(
          "min-h-touch rounded-tile border-2 bg-card px-3 py-2 text-small text-ink",
          message ? "border-red-700" : "border-line",
        )}
      />
      {uploading ? <p className="text-small text-muted">{t("editor.uploading")}</p> : null}
      {message ? (
        <p id={`${id}-message`} className="text-small text-status-notnow-fg">
          {message}
        </p>
      ) : null}
    </div>
  );
}
