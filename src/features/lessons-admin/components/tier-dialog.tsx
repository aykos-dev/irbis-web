"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import type { AdminTierDto } from "@/shared/api/generated/model";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/shared/components/ui/dialog";
import { Field, Input } from "@/shared/components/ui/field";
import { toast } from "@/shared/components/ui/toaster";
import { useNetworkStatus } from "@/shared/hooks/useNetworkStatus";
import { zodResolver } from "@/shared/lib/zodResolver";

import { useTierActions } from "../hooks/useTierActions";
import { COLOUR_PATTERN, TITLE_MAX, tierSchema, toCreateTier, toUpdateTier, type TierValues } from "../schemas";
import { applyWriteError } from "../write-errors";

const DEFAULT_COLOUR = "#1A7F6E";

function defaults(tier: AdminTierDto | null): TierValues {
  return tier
    ? { key: tier.key, titleUz: tier.title.uz, titleRu: tier.title.ru, titleEn: tier.title.en, colour: tier.colour }
    : { key: "", titleUz: "", titleRu: "", titleEn: "", colour: DEFAULT_COLOUR };
}

type TierDialogProps = {
  /** null creates a tier; a tier edits it (key stays read-only). */
  tier: AdminTierDto | null;
  onOpenChange: (open: boolean) => void;
};

/** New / edit tier form; mounted only while open. */
export function TierDialog({ tier, onOpenChange }: TierDialogProps) {
  const t = useTranslations("lessonsAdmin");
  const tCommon = useTranslations("common");
  const { isOnline } = useNetworkStatus();
  const actions = useTierActions();
  const form = useForm<TierValues>({
    resolver: zodResolver(tierSchema),
    defaultValues: defaults(tier),
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const { errors, isSubmitting } = form.formState;
  const colour = form.watch("colour");
  const fieldError = (name: keyof TierValues) => {
    const message = errors[name]?.message;
    if (!message) return undefined;
    return message === "keyTaken" ? t("keyTaken") : t(`validation.${message as "server"}`);
  };

  async function submit(values: TierValues) {
    if (!isOnline) {
      toast.error(t("toasts.offline"));
      return;
    }
    try {
      if (tier) {
        await actions.update.mutateAsync({ id: tier.id, data: toUpdateTier(values) });
        toast.success(t("toasts.tierSaved"));
      } else {
        await actions.create.mutateAsync({ data: toCreateTier(values) });
        toast.success(t("toasts.tierCreated"));
      }
      onOpenChange(false);
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
        <DialogTitle>{tier ? t("tiers.edit") : t("tiers.new")}</DialogTitle>
        <DialogDescription className="sr-only">{t("tiers.description")}</DialogDescription>
        <form
          noValidate
          data-testid="lessons.tier.form"
          onSubmit={(event) => void form.handleSubmit(submit)(event)}
          className="flex flex-col gap-4"
        >
          <Field label={t("field.key")} hint={t("field.keyHint")} error={fieldError("key")}>
            {(control) =>
              tier ? (
                // The key is immutable: shown, not registered, so the form keeps the default value.
                <Input {...control} value={tier.key} disabled readOnly data-testid="lessons.tier.key" />
              ) : (
                <Input {...form.register("key")} {...control} maxLength={20} autoComplete="off" data-testid="lessons.tier.key" />
              )
            }
          </Field>
          {titleFields.map(([name, label]) => (
            <Field key={name} label={label} error={fieldError(name)}>
              {(control) => <Input {...form.register(name)} {...control} maxLength={TITLE_MAX} />}
            </Field>
          ))}
          <Field
            label={t("field.colour")}
            error={fieldError("colour")}
            trailing={
              <input
                type="color"
                aria-label={t("field.colourPicker")}
                value={COLOUR_PATTERN.test(colour) ? colour.toLowerCase() : DEFAULT_COLOUR.toLowerCase()}
                onChange={(event) =>
                  form.setValue("colour", event.target.value.toUpperCase(), { shouldValidate: true })
                }
                className="size-8 cursor-pointer rounded-tile border-2 border-line bg-card"
              />
            }
          >
            {(control) => <Input {...form.register("colour")} {...control} maxLength={7} className="pe-14" />}
          </Field>
          <div className="flex flex-wrap justify-end gap-3">
            <DialogClose asChild>
              <Button variant="white" disabled={isSubmitting}>
                {tCommon("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !isOnline}>
              {isSubmitting ? tCommon("working") : tier ? t("actions.save") : t("actions.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
