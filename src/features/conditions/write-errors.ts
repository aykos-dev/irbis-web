import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { ApiError } from "@/shared/api/errors";

import { SERVER_FIELD } from "./schemas";

export type WriteFailure = "offline" | "generic" | "fields";

/**
 * Puts VALIDATION_FAILED fieldErrors onto the matching form fields (message key `server`).
 * Returns what the caller should still tell the admin when nothing could be placed on a field.
 */
export function applyWriteError<TValues extends FieldValues>(
  error: unknown,
  form: UseFormReturn<TValues>,
): WriteFailure {
  if (!(error instanceof ApiError)) return "generic";
  if (error.status === null) return "offline";
  if (error.code !== "VALIDATION_FAILED" || !error.fieldErrors) return "generic";

  const values = form.getValues();
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

/** True for CLOSURE_ALREADY_ENDED / OVERRIDE_ALREADY_ENDED: the screen is stale, not broken. */
export function isAlreadyEnded(error: unknown): boolean {
  return (
    error instanceof ApiError && (error.code === "CLOSURE_ALREADY_ENDED" || error.code === "OVERRIDE_ALREADY_ENDED")
  );
}
