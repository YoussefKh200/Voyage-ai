// lib/external/core/result.ts
// ─── Result Type for External API Calls ──────────────────────────────────────
// All external API calls return Result<T> instead of throwing.
// This forces callers to handle failures explicitly — no silent crashes.
//
// Pattern inspired by Rust's Result<T, E>. At scale, external APIs WILL fail;
// the architecture must treat failure as a first-class concern, not an exception.

export type Result<T, E extends ExternalApiError = ExternalApiError> =
  | { ok: true; data: T; cached?: boolean; latencyMs?: number }
  | { ok: false; error: E; fallback?: T };

export type ExternalApiErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "QUOTA_EXCEEDED"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "UNKNOWN";

export interface ExternalApiError {
  code: ExternalApiErrorCode;
  message: string;
  service: string;
  retryable: boolean;
  status?: number;
}

// ─── Constructors ─────────────────────────────────────────────────────────────

export function ok<T>(data: T, cached = false, latencyMs?: number): Result<T> {
  return { ok: true, data, cached, latencyMs };
}

export function err<T>(
  error: ExternalApiError,
  fallback?: T
): Result<T> {
  return { ok: false, error, fallback };
}

// ─── Error factory ────────────────────────────────────────────────────────────

export function makeApiError(
  service: string,
  code: ExternalApiErrorCode,
  message: string,
  status?: number
): ExternalApiError {
  const retryable: ExternalApiErrorCode[] = [
    "TIMEOUT",
    "NETWORK_ERROR",
    "SERVICE_UNAVAILABLE",
    "RATE_LIMITED",
  ];
  return {
    code,
    message,
    service,
    retryable: retryable.includes(code),
    status,
  };
}

// ─── Classify HTTP errors into structured codes ───────────────────────────────

export function classifyHttpError(
  service: string,
  status: number,
  message?: string
): ExternalApiError {
  const codeMap: Record<number, ExternalApiErrorCode> = {
    400: "INVALID_REQUEST",
    401: "UNAUTHORIZED",
    403: "UNAUTHORIZED",
    404: "NOT_FOUND",
    429: "RATE_LIMITED",
    500: "SERVICE_UNAVAILABLE",
    502: "SERVICE_UNAVAILABLE",
    503: "SERVICE_UNAVAILABLE",
    504: "TIMEOUT",
  };
  const code = codeMap[status] ?? "UNKNOWN";
  return makeApiError(service, code, message ?? `HTTP ${status}`, status);
}

// ─── Type guards ──────────────────────────────────────────────────────────────

export function isOk<T>(result: Result<T>): result is Extract<Result<T>, { ok: true }> {
  return result.ok === true;
}

export function isErr<T>(result: Result<T>): result is Extract<Result<T>, { ok: false }> {
  return result.ok === false;
}

// ─── Unwrap helpers ───────────────────────────────────────────────────────────

export function unwrapOr<T>(result: Result<T>, fallback: T): T {
  if (result.ok) return result.data;
  return result.fallback ?? fallback;
}
