"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import type { L10nDto, LessonImageDto, LessonImageUploadDto } from "@/shared/api/generated/model";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  correctAfterRemoval,
  emptyL10n,
  type EditorLocale,
  type QuestionValues,
} from "../editor-values";
import { L10nGroup } from "./l10n-group";
import { MoveButtons } from "./move-buttons";
import { QuestionImage } from "./question-image";

/** Which server errors an edit settles: the listed paths, or all of them after a structural change. */
export type Cleared = readonly string[] | "all";

type TextKey = "prompt" | "hint" | "explanation" | "wrongExplanation";

type QuestionCardProps = {
  index: number;
  total: number;
  value: QuestionValues;
  errors: ReadonlySet<string>;
  disabled: boolean;
  isOnline: boolean;
  onUpdate: (patch: Partial<QuestionValues>, cleared: Cleared) => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
  upload: (file: File) => Promise<LessonImageUploadDto>;
};

function withText(value: L10nDto, locale: EditorLocale, text: string): L10nDto {
  return { ...value, [locale]: text };
}

/** One numbered question: texts in three languages, 2–4 options with one correct, image. */
export function QuestionCard({
  index,
  total,
  value,
  errors,
  disabled,
  isOnline,
  onUpdate,
  onMove,
  onRemove,
  upload,
}: QuestionCardProps) {
  const t = useTranslations("lessonsAdmin");
  const number = index + 1;
  const base = `questions.${index}`;
  const testId = `lessons.editor.q.${number}`;
  const heading = t("editor.question", { n: number });
  const optionsError = errors.has(`${base}.options`) || errors.has(`${base}.correctIndex`);

  const setText = (key: TextKey) => (locale: EditorLocale, text: string) =>
    onUpdate({ [key]: withText(value[key], locale, text) }, [`${base}.${key}`, `${base}.${key}.${locale}`]);

  const setOption = (option: number) => (locale: EditorLocale, text: string) =>
    onUpdate(
      { options: value.options.map((item, i) => (i === option ? withText(item, locale, text) : item)) },
      [`${base}.options.${option}`, `${base}.options.${option}.${locale}`],
    );

  const textGroup = (key: TextKey, legend: string, optional: boolean) => (
    <L10nGroup
      legend={legend}
      path={`${base}.${key}`}
      value={value[key]}
      onChange={setText(key)}
      errors={errors}
      optional={optional}
      multiline
      disabled={disabled}
    />
  );

  return (
    <Card data-testid={testId} aria-label={heading}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-h3 text-ink">{heading}</h3>
        <div className="flex flex-wrap gap-1.5">
          <MoveButtons
            name={heading}
            testIdPrefix={testId}
            canMoveUp={index > 0}
            canMoveDown={index < total - 1}
            disabled={disabled}
            onMove={onMove}
          />
          <Button
            variant="white"
            className="min-h-touch px-3"
            aria-label={`${t("editor.removeQuestion")}: ${heading}`}
            disabled={disabled}
            onClick={onRemove}
            data-testid={`${testId}.remove`}
          >
            <Trash2 aria-hidden="true" className="size-4" strokeWidth={3} />
          </Button>
        </div>
      </div>

      {textGroup("prompt", t("editor.prompt"), false)}
      {textGroup("hint", t("editor.hint"), true)}

      <fieldset className="flex flex-col gap-3" data-path={`${base}.options`}>
        <legend className="pb-1 text-small font-black text-ink">{t("editor.options")}</legend>
        {optionsError ? <p className="text-small text-status-notnow-fg">{t("validation.server")}</p> : null}
        {value.options.map((option, optionIndex) => {
          const optionNumber = optionIndex + 1;
          const optionName = t("editor.option", { n: optionNumber });
          return (
            <div key={optionIndex} className="flex flex-col gap-2 rounded-tile border-2 border-soft p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex min-h-touch items-center gap-2 text-small font-black text-ink">
                  <input
                    type="radio"
                    name={`${base}.correctIndex`}
                    checked={value.correctIndex === optionIndex}
                    disabled={disabled}
                    onChange={() => onUpdate({ correctIndex: optionIndex }, [`${base}.correctIndex`])}
                    data-testid={`${testId}.correct.${optionNumber}`}
                    className="size-5 accent-teal-700"
                  />
                  {t("editor.correct")}
                  <span className="sr-only">: {optionName}</span>
                </label>
                <Button
                  variant="white"
                  className="min-h-touch px-3"
                  aria-label={`${t("editor.removeOption")}: ${optionName}`}
                  disabled={disabled || value.options.length <= MIN_OPTIONS}
                  onClick={() =>
                    onUpdate(
                      {
                        options: value.options.filter((_, i) => i !== optionIndex),
                        correctIndex: correctAfterRemoval(value.correctIndex, optionIndex),
                      },
                      "all",
                    )
                  }
                >
                  <X aria-hidden="true" className="size-4" strokeWidth={3} />
                </Button>
              </div>
              <L10nGroup
                legend={optionName}
                path={`${base}.options.${optionIndex}`}
                value={option}
                onChange={setOption(optionIndex)}
                errors={errors}
                disabled={disabled}
              />
            </div>
          );
        })}
        <Button
          variant="white"
          className="self-start"
          disabled={disabled || value.options.length >= MAX_OPTIONS}
          onClick={() => onUpdate({ options: [...value.options, emptyL10n()] }, [`${base}.options`])}
        >
          <Plus aria-hidden="true" className="size-4" strokeWidth={3} />
          {t("editor.addOption")}
        </Button>
      </fieldset>

      {textGroup("explanation", t("editor.explanation"), false)}
      {textGroup("wrongExplanation", t("editor.wrongExplanation"), true)}

      <QuestionImage
        number={number}
        image={value.image}
        onChange={(image: LessonImageDto | null) => onUpdate({ image }, [`${base}.image`])}
        upload={upload}
        serverError={errors.has(`${base}.image`)}
        disabled={disabled}
        isOnline={isOnline}
      />
    </Card>
  );
}
