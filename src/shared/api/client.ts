import axios, { type AxiosRequestConfig } from "axios";

import { config } from "@/shared/config";
import { defaultLocale, type Locale } from "@/shared/i18n/config";

import { ApiError, toApiError } from "./errors";

const REQUEST_TIMEOUT_MS = 15_000;
const SAFE_METHODS = new Set(["get", "head", "options"]);

let currentLocale: Locale = defaultLocale;

/** Called by the i18n provider so every request carries the admin's language. */
export function setApiLocale(locale: Locale): void {
  currentLocale = locale;
}

/** The only axios instance in the app. Everything else goes through the orval mutator below. */
export const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

axiosInstance.interceptors.request.use((request) => {
  request.headers.set("Accept-Language", currentLocale);
  const method = (request.method ?? "get").toLowerCase();
  if (!SAFE_METHODS.has(method) && !request.headers.has("Idempotency-Key")) {
    request.headers.set("Idempotency-Key", crypto.randomUUID());
  }
  return request;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

/** orval mutator: resolves with the response body, rejects with `ApiError`. */
export function apiClient<TData>(
  requestConfig: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<TData> {
  return axiosInstance.request<TData>({ ...requestConfig, ...options }).then((response) => response.data);
}

/** Error type orval attaches to generated hooks. */
export type ErrorType<TBody> = ApiError<TBody>;

/** Body type orval uses for request payloads. */
export type BodyType<TBody> = TBody;
