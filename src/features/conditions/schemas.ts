import { z } from "zod";

import {
  ClosureSource,
  ConditionStatus,
  type CreateClosureDto,
  type CreateOverrideDto,
  type ReasonInputDto,
} from "@/shared/api/generated/model";

import { fromTashkentInput } from "./datetime";

/** Messages are keys under `conditions.validation`; forms translate them. */
export const REASON_MAX = 280;
export const OVERRIDE_MAX_DAYS = 14;
export const DAY_MS = 24 * 60 * 60 * 1000;

const reasonUz = z.string().trim().min(1, "reasonRequired").max(REASON_MAX, "reasonTooLong");
const reasonOptional = z.string().trim().max(REASON_MAX, "reasonTooLong");
const dateTime = (requiredKey: string) =>
  z.string().min(1, requiredKey).refine((value) => fromTashkentInput(value) !== null, "dateInvalid");

export const closureSchema = z
  .object({
    startsAt: dateTime("startRequired"),
    endsAt: z.string().refine((value) => value === "" || fromTashkentInput(value) !== null, "dateInvalid"),
    reasonUz,
    reasonRu: reasonOptional,
    reasonEn: reasonOptional,
    source: z.enum(ClosureSource),
  })
  .refine(
    ({ startsAt, endsAt }) => {
      const start = fromTashkentInput(startsAt);
      const end = fromTashkentInput(endsAt);
      return !start || !end || end.getTime() > start.getTime();
    },
    { path: ["endsAt"], message: "endBeforeStart" },
  );

export const overrideSchema = z.object({
  status: z.enum(ConditionStatus),
  reasonUz,
  reasonRu: reasonOptional,
  reasonEn: reasonOptional,
  expiresAt: dateTime("expiryRequired").superRefine((value, context) => {
    const expires = fromTashkentInput(value);
    if (!expires) return;
    const now = Date.now();
    if (expires.getTime() <= now) context.addIssue({ code: "custom", message: "expiryPast" });
    else if (expires.getTime() > now + OVERRIDE_MAX_DAYS * DAY_MS) {
      context.addIssue({ code: "custom", message: "expiryTooFar" });
    }
  }),
});

export type ClosureValues = z.infer<typeof closureSchema>;
export type OverrideValues = z.infer<typeof overrideSchema>;

type ReasonValues = { reasonUz: string; reasonRu: string; reasonEn: string };

function toReason({ reasonUz: uz, reasonRu: ru, reasonEn: en }: ReasonValues): ReasonInputDto {
  return { uz, ...(ru ? { ru } : {}), ...(en ? { en } : {}) };
}

function toIso(value: string): string {
  const date = fromTashkentInput(value);
  if (!date) throw new Error(`Unparsable date ${value}`);
  return date.toISOString();
}

export function toCreateClosure(values: ClosureValues): CreateClosureDto {
  return {
    startsAt: toIso(values.startsAt),
    ...(values.endsAt ? { endsAt: toIso(values.endsAt) } : {}),
    reason: toReason(values),
    source: values.source,
  };
}

export function toCreateOverride(values: OverrideValues): CreateOverrideDto {
  return { status: values.status, reason: toReason(values), expiresAt: toIso(values.expiresAt) };
}

/** API fieldErrors keys (DTO paths) → form field names. */
export const SERVER_FIELD: Record<string, string> = {
  startsAt: "startsAt",
  endsAt: "endsAt",
  expiresAt: "expiresAt",
  status: "status",
  source: "source",
  reason: "reasonUz",
  "reason.uz": "reasonUz",
  "reason.ru": "reasonRu",
  "reason.en": "reasonEn",
};
