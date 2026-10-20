"use client";

import { useTranslations } from "next-intl";

import type { L10nDto } from "@/shared/api/generated/model";
import { Field, Input, Textarea } from "@/shared/components/ui/field";

import { LOCALES, isBlankL10n, type EditorLocale } from "../editor-values";

type L10nGroupProps = {
  legend: string;
  /** Server path of the group (`questions.0.prompt`); inputs are named `<path>.<locale>`. */
  path: string;
  value: L10nDto;
  onChange: (locale: EditorLocale, text: string) => void;
  /** Paths the server reported; a group-level path marks every input. */
  errors: ReadonlySet<string>;
  /** Optional groups only show missing dots once one language is filled. */
  optional?: boolean;
  multiline?: boolean;
  maxLength?: number;
  disabled?: boolean;
  testIdPrefix?: string;
};

/** One text in uz / ru / en: three labelled inputs, each with a "missing" dot while blank. */
export function L10nGroup({
  legend,
  path,
  value,
  onChange,
  errors,
  optional = false,
  multiline = false,
  maxLength,
  disabled = false,
  testIdPrefix,
}: L10nGroupProps) {
  const t = useTranslations("lessonsAdmin");
  const showMissing = !optional || !isBlankL10n(value);
  const groupError = errors.has(path);

  return (
    <fieldset className="flex flex-col gap-2" data-path={path}>
      <legend className="pb-1 text-small font-black text-ink">{legend}</legend>
      <div className="grid gap-3 md:grid-cols-3">
        {LOCALES.map((locale) => {
          const name = `${path}.${locale}`;
          const missing = showMissing && value[locale].trim() === "";
          const error = groupError || errors.has(name) ? t("validation.server") : undefined;
          return (
            <Field
              key={locale}
              label={t(`editor.locale.${locale}`)}
              error={error}
              trailing={
                missing ? (
                  <span className="flex items-center" title={t("editor.missing")}>
                    <span aria-hidden="true" className="size-2 rounded-full bg-orange" />
                    <span className="sr-only">{t("editor.missing")}</span>
                  </span>
                ) : null
              }
            >
              {(control) =>
                multiline ? (
                  <Textarea
                    {...control}
                    name={name}
                    rows={2}
                    value={value[locale]}
                    maxLength={maxLength}
                    disabled={disabled}
                    className="pe-8"
                    onChange={(event) => onChange(locale, event.target.value)}
                  />
                ) : (
                  <Input
                    {...control}
                    name={name}
                    value={value[locale]}
                    maxLength={maxLength}
                    disabled={disabled}
                    className="pe-8"
                    data-testid={testIdPrefix ? `${testIdPrefix}.${locale}` : undefined}
                    onChange={(event) => onChange(locale, event.target.value)}
                  />
                )
              }
            </Field>
          );
        })}
      </div>
    </fieldset>
  );
}
