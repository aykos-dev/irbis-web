import { z } from "zod";

import { BlockReasonCode, Role } from "@/shared/api/generated/model";

/** Messages are keys under `users.validation`; forms translate them. */
const note = z.string().trim().min(1, "noteRequired").max(500, "noteTooLong");

export const blockSchema = z.object({
  reasonCode: z.enum(BlockReasonCode),
  note,
});

export const unblockSchema = z.object({ note });

export const passwordSchema = z.object({
  newPassword: z.string().min(6, "passwordLength").max(64, "passwordLength"),
  note,
});

/** +998 and 9 digits; spaces and dashes are tolerated while typing. */
export const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((value) => /^\+998\d{9}$/.test(value.replace(/[\s-]/g, "")), "phoneInvalid"),
  note,
});

export const roleSchema = z.object({
  role: z.enum(Role),
  note,
});

export type BlockValues = z.infer<typeof blockSchema>;
export type UnblockValues = z.infer<typeof unblockSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;
export type PhoneValues = z.infer<typeof phoneSchema>;
export type RoleValues = z.infer<typeof roleSchema>;
