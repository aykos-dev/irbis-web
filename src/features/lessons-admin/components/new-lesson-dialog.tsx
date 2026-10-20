"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";

import { LessonIcon } from "@/shared/api/generated/model";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/shared/components/ui/dialog";
import { Field, Input } from "@/shared/components/ui/field";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { cn } from "@/shared/lib/cn";
import { zodResolver } from "@/shared/lib/zodResolver";

import { useLessonActions } from "../hooks/useLessonActions";
import { LESSON_ICONS, LessonIconGlyph } from "../lesson-icons";
import { lessonSchema, TITLE_MAX, toCreateLesson, type LessonValues } from "../schemas";
import { applyWriteError } from "../write-errors";

const DEFAULTS: LessonValues = { titleUz: "", titleRu: "", titleEn: "", icon: LessonIcon.compass };

/** Title in three languages + icon; on create opens the lesson editor route. Mounted only while open. */
export function NewLessonDialog({ tierId, onOpenChange }: { tierId: string; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("lessonsAdmin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const actions = useLessonActions(tierId);
  const form = useForm<LessonValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: DEFAULTS,
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const { errors, isSubmitting } = form.formState;
  const fieldError = (name: keyof LessonValues) => {
    const message = errors[name]?.message;
    return message ? t(`validation.${message as "server"}`) : undefined;
  };

  async function submit(values: LessonValues) {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    try {
      const lesson = await actions.create.mutateAsync({ data: toCreateLesson(tierId, values) });
      toast.success(t("toasts.lessonCreated"));
      router.push(`/lessons/${tierId}/${lesson.id}`);
    } catch (error: unknown) {
      const failure = applyWriteError(error, form);
      if (failure === "offline") toast.error(t("toasts.offline"));
      else if (failure === "generic") toast.error(t("toasts.error"));
    }
  }

  const titleFields = [
    ["titleUz", t("field.titleUz")],
    ["titleRu", t("field.titleRu")],
    ["titleEn", t("field.titleEn")],
  ] as const;

  return (
    <Dialog open onOpenChange={(next) => (isSubmitting ? undefined : onOpenChange(next))}>
      <DialogContent>
        <DialogTitle>{t("lessons.new")}</DialogTitle>
        <DialogDescription className="sr-only">{t("lessons.caption")}</DialogDescription>
        <form
          noValidate
          data-testid="lessons.lesson.form"
          onSubmit={(event) => void form.handleSubmit(submit)(event)}
          className="flex flex-col gap-4"
        >
          {titleFields.map(([name, label]) => (
            <Field key={name} label={label} error={fieldError(name)}>
              {(control) => <Input {...form.register(name)} {...control} maxLength={TITLE_MAX} />}
            </Field>
          ))}
          <Controller
            control={form.control}
            name="icon"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-1.5">
                <legend className="pb-1.5 text-small font-black text-ink">{t("field.icon")}</legend>
                <div className="flex flex-wrap gap-2">
                  {LESSON_ICONS.map((icon) => {
                    const selected = field.value === icon;
                    return (
                      <button
                        key={icon}
                        type="button"
                        aria-label={t(`icons.${icon}`)}
                        aria-pressed={selected}
                        onClick={() => field.onChange(icon)}
                        className={cn(
                          "flex size-touch items-center justify-center rounded-tile border-2 transition duration-150",
                          selected ? "border-teal-700 bg-nav-active-bg text-teal-700" : "border-line bg-card text-body hover:bg-soft",
                        )}
                      >
                        <LessonIconGlyph icon={icon} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          />
          <div className="flex flex-wrap justify-end gap-3">
            <DialogClose asChild>
              <Button variant="white" disabled={isSubmitting}>
                {tCommon("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !isOnline}>
              {isSubmitting ? tCommon("working") : t("actions.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
