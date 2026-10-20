import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { ApiError } from "@/shared/api/errors";

import { SERVER_FIELD } from "./schemas";

export type WriteFailure = "offline" | "generic" | "fields";

/**
 * Puts TIER_KEY_TAKEN on `key` (message `keyTaken`) and VALIDATION_FAILED fieldErrors on the
 * matching fields (message `server`). Returns what the caller should still tell the admin.
 */
export function applyWriteError<TValues extends FieldValues>(
  error: unknown,
  form: UseFormReturn<TValues>,
): WriteFailure {
  if (!(error instanceof ApiError)) return "generic";
  if (error.status === null) return "offline";

  const values = form.getValues();
  if (error.code === "TIER_KEY_TAKEN" && "key" in values) {
    form.setError("key" as Path<TValues>, { message: "keyTaken" });
    return "fields";
  }
  if (error.code !== "VALIDATION_FAILED" || !error.fieldErrors) return "generic";

  let mapped = false;
  for (const key of Object.keys(error.fieldErrors)) {
    const name = SERVER_FIELD[key];
    if (name && name in values) {
      form.setError(name as Path<TValues>, { message: "server" });
      mapped = true;
    }
  }
  return mapped ? "fields" : "generic";
}
