import { z } from "zod";

/** Messages are keys under `auth.validation`; the form translates them. */
export const logInSchema = z.object({
  username: z.string().trim().min(1, "required"),
  password: z.string().min(1, "required"),
});

export type LogInValues = z.infer<typeof logInSchema>;
