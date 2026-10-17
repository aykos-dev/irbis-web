import type { FieldError, FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

/**
 * Minimal react-hook-form resolver for flat zod schemas. Issue messages are i18n keys (the
 * schema never holds user-facing copy); components translate them when rendering.
 */
export function zodResolver<TValues extends FieldValues>(schema: z.ZodType<TValues>): Resolver<TValues> {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors: Record<string, FieldError> = {};
    for (const issue of result.error.issues) {
      const name = issue.path.join(".");
      if (name && !errors[name]) errors[name] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors: errors as FieldErrors<TValues> };
  };
}
