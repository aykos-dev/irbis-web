import { z } from "zod";

import {
  LessonIcon,
  type CreateLessonDto,
  type CreateTierDto,
  type L10nDto,
  type UpdateTierDto,
} from "@/shared/api/generated/model";

/** Messages are keys under `lessonsAdmin.validation`; forms translate them. */
export const TITLE_MAX = 300;
export const TIER_KEY_PATTERN = /^[a-z0-9-]{1,20}$/;
export const COLOUR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const title = z.string().trim().min(1, "titleRequired").max(TITLE_MAX, "titleTooLong");

export const tierSchema = z.object({
  key: z.string().trim().regex(TIER_KEY_PATTERN, "keyInvalid"),
  titleUz: title,
  titleRu: title,
  titleEn: title,
  colour: z.string().trim().regex(COLOUR_PATTERN, "colourInvalid"),
});

export const lessonSchema = z.object({
  titleUz: title,
  titleRu: title,
  titleEn: title,
  icon: z.enum(LessonIcon),
});

export type TierValues = z.infer<typeof tierSchema>;
export type LessonValues = z.infer<typeof lessonSchema>;

type TitleValues = { titleUz: string; titleRu: string; titleEn: string };

function toTitle({ titleUz, titleRu, titleEn }: TitleValues): L10nDto {
  return { uz: titleUz, ru: titleRu, en: titleEn };
}

export function toCreateTier(values: TierValues): CreateTierDto {
  return { key: values.key, title: toTitle(values), colour: values.colour };
}

export function toUpdateTier(values: TierValues): UpdateTierDto {
  return { title: toTitle(values), colour: values.colour };
}

export function toCreateLesson(tierId: string, values: LessonValues): CreateLessonDto {
  return { tierId, title: toTitle(values), icon: values.icon };
}

/** API fieldErrors keys (DTO paths) → form field names. */
export const SERVER_FIELD: Record<string, string> = {
  key: "key",
  colour: "colour",
  icon: "icon",
  title: "titleUz",
  "title.uz": "titleUz",
  "title.ru": "titleRu",
  "title.en": "titleEn",
};
