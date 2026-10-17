import axios, { isAxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

import { config } from "@/shared/config";
import { defaultLocale, type Locale } from "@/shared/i18n/config";

import { getAccessToken, notifySessionExpired, refreshAccessToken } from "./auth";
import { ApiError, toApiError } from "./errors";

const REQUEST_TIMEOUT_MS = 15_000;
const SAFE_METHODS = new Set(["get", "head", "options"]);
/** Auth endpoints answer 401 for their own reasons; they must never trigger a refresh. */
const AUTH_PATH = "/v1/admin/auth/";

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
  const token = getAccessToken();
  if (token && !request.headers.has("Authorization")) request.headers.set("Authorization", `Bearer ${token}`);
  const method = (request.method ?? "get").toLowerCase();
  if (!SAFE_METHODS.has(method) && !request.headers.has("Idempotency-Key")) {
    request.headers.set("Idempotency-Key", crypto.randomUUID());
  }
  return request;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** On 401 refresh once (single-flight) and replay the request; a failed refresh ends the session. */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = toApiError(error);
    const original = isAxiosError(error) ? (error.config as RetriableConfig | undefined) : undefined;
    const isAuthCall = original?.url?.includes(AUTH_PATH) ?? false;
    if (apiError.status !== 401 || !original || original._retried || isAuthCall) throw apiError;

    original._retried = true;
    let token: string;
    try {
      token = await refreshAccessToken();
    } catch (refreshError: unknown) {
      // A network failure says nothing about the session; only an answer from the API ends it.
      if (!(refreshError instanceof ApiError) || refreshError.status !== null) notifySessionExpired();
      throw apiError;
    }
    original.headers.set("Authorization", `Bearer ${token}`);
    try {
      return await axiosInstance.request(original);
    } catch (retryError: unknown) {
      throw toApiError(retryError);
    }
  },
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
