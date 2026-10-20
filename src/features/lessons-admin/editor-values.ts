import type {
  AdminLessonDto,
  AdminQuestionDto,
  L10nDto,
  LessonIcon,
  LessonImageDto,
  ReplaceLessonDto,
} from "@/shared/api/generated/model";

export const MAX_QUESTIONS = 15;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 4;
export const LOCALES = ["uz", "ru", "en"] as const;
export type EditorLocale = (typeof LOCALES)[number];

/** One question as edited: optional groups are always present and sent as null when blank. */
export type QuestionValues = {
  prompt: L10nDto;
  hint: L10nDto;
  options: L10nDto[];
  correctIndex: number;
  explanation: L10nDto;
  wrongExplanation: L10nDto;
  image: LessonImageDto | null;
};

/** Paths of these values match the API fieldErrors keys (`title.uz`, `questions.3.options.1.ru`). */
export type EditorValues = {
  title: L10nDto;
  icon: LessonIcon;
  questions: QuestionValues[];
};

export function emptyL10n(): L10nDto {
  return { uz: "", ru: "", en: "" };
}

export function isBlankL10n(value: L10nDto): boolean {
  return LOCALES.every((locale) => value[locale].trim() === "");
}

export function emptyQuestion(): QuestionValues {
  return {
    prompt: emptyL10n(),
    hint: emptyL10n(),
    options: Array.from({ length: MIN_OPTIONS }, emptyL10n),
    correctIndex: 0,
    explanation: emptyL10n(),
    wrongExplanation: emptyL10n(),
    image: null,
  };
}

function copyL10n(value: L10nDto | null): L10nDto {
  return value ? { uz: value.uz, ru: value.ru, en: value.en } : emptyL10n();
}

function toQuestionValues(question: AdminQuestionDto): QuestionValues {
  return {
    prompt: copyL10n(question.prompt),
    hint: copyL10n(question.hint),
    options: question.options.map(copyL10n),
    correctIndex: question.correctIndex,
    explanation: copyL10n(question.explanation),
    wrongExplanation: copyL10n(question.wrongExplanation),
    image: question.image ? { key: question.image.key, url: question.image.url } : null,
  };
}

export function toEditorValues(lesson: AdminLessonDto): EditorValues {
  return {
    title: copyL10n(lesson.title),
    icon: lesson.icon,
    questions: [...lesson.questions].sort((a, b) => a.order - b.order).map(toQuestionValues),
  };
}

function optional(value: L10nDto): L10nDto | null {
  return isBlankL10n(value) ? null : value;
}

export function toReplaceLesson(values: EditorValues): ReplaceLessonDto {
  return {
    title: values.title,
    icon: values.icon,
    questions: values.questions.map((question) => ({
      prompt: question.prompt,
      hint: optional(question.hint),
      options: question.options,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      wrongExplanation: optional(question.wrongExplanation),
      image: question.image ? { key: question.image.key } : null,
    })),
  };
}

/** The list with the item at `index` swapped one step up (-1) or down (+1); unchanged at the edges. */
export function moveItem<T>(items: readonly T[], index: number, step: -1 | 1): T[] {
  const target = index + step;
  const current = items[index];
  const other = items[target];
  if (current === undefined || other === undefined) return [...items];
  const next = [...items];
  next[index] = other;
  next[target] = current;
  return next;
}

/** The correct option index after removing option `removed`. */
export function correctAfterRemoval(correctIndex: number, removed: number): number {
  if (removed < correctIndex) return correctIndex - 1;
  if (removed === correctIndex) return 0;
  return correctIndex;
}
