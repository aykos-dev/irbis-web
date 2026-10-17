export type FieldErrors = Record<string, string[]>;

/** Stable client-side codes for failures that never reached the API. */
export const CLIENT_ERROR_CODES = {
  network: "NETWORK_ERROR",
  timeout: "TIMEOUT",
  canceled: "CANCELED",
  unknown: "UNKNOWN_ERROR",
} as const;

/**
 * Every failed request is normalised to this shape. Branch on `code`, never on `message`.
 * Mirrors the API error envelope `{ statusCode, code, message, fieldErrors?, requestId }`.
 */
export class ApiError<TBody = unknown> extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly fieldErrors?: FieldErrors;
  readonly requestId?: string;
  readonly body?: TBody;

  constructor(init: {
    status: number | null;
    code: string;
    message: string;
    fieldErrors?: FieldErrors;
    requestId?: string;
    body?: TBody;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.fieldErrors = init.fieldErrors;
    this.requestId = init.requestId;
    this.body = init.body;
  }
}

type HttpLikeError = {
  isAxiosError: true;
  code?: string;
  message: string;
  response?: { status: number; data?: unknown; headers?: Record<string, unknown> };
};

function isHttpLikeError(error: unknown): error is HttpLikeError {
  return typeof error === "object" && error !== null && (error as { isAxiosError?: unknown }).isAxiosError === true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readFieldErrors(value: unknown): FieldErrors | undefined {
  if (!isRecord(value)) return undefined;
  const entries = Object.entries(value).filter(
    (entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) && entry[1].every((item) => typeof item === "string"),
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/** Converts anything thrown by the HTTP layer into an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isHttpLikeError(error)) {
    if (error.code === "ERR_CANCELED") {
      return new ApiError({ status: null, code: CLIENT_ERROR_CODES.canceled, message: error.message });
    }
    if (!error.response) {
      const code = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
        ? CLIENT_ERROR_CODES.timeout
        : CLIENT_ERROR_CODES.network;
      return new ApiError({ status: null, code, message: error.message });
    }

    const { status, data, headers } = error.response;
    const body = isRecord(data) ? data : undefined;
    const headerRequestId = headers?.["x-request-id"];
    return new ApiError({
      status,
      code: typeof body?.code === "string" ? body.code : `HTTP_${status}`,
      message: typeof body?.message === "string" ? body.message : error.message,
      fieldErrors: readFieldErrors(body?.fieldErrors),
      requestId:
        typeof body?.requestId === "string"
          ? body.requestId
          : typeof headerRequestId === "string"
            ? headerRequestId
            : undefined,
      body: data,
    });
  }

  const message = error instanceof Error ? error.message : String(error);
  return new ApiError({ status: null, code: CLIENT_ERROR_CODES.unknown, message });
}

/** Seconds until a retry is allowed (`ACCOUNT_LOCKED`, `RATE_LIMITED`), when the API sent it. */
export function getRetryAfterSec(error: ApiError): number | undefined {
  const body = error.body;
  if (typeof body === "object" && body !== null) {
    const value = (body as { retryAfterSec?: unknown }).retryAfterSec;
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}
