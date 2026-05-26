// lib/errors/index.ts
// ─── Typed Error Hierarchy ────────────────────────────────────────────────────
// Discriminated union of domain errors. Benefits:
//  1. Client can branch on error.code without parsing strings
//  2. API routes serialize them consistently
//  3. Easy to add Sentry/logging with structured metadata
//  4. TypeScript exhaustiveness checks on error handling

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AI_PROVIDER_ERROR"
  | "AI_PARSE_ERROR"
  | "AI_TIMEOUT"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "DATABASE_ERROR"
  | "UNKNOWN_ERROR";

export interface AppErrorMeta {
  field?: string;
  retryable?: boolean;
  [key: string]: unknown;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly meta: AppErrorMeta;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode = 500,
    meta: AppErrorMeta = {}
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.meta = meta;
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      meta: this.meta,
    };
  }
}

// ─── Convenience constructors ─────────────────────────────────────────────────

export const Errors = {
  validation: (message: string, field?: string) =>
    new AppError(message, "VALIDATION_ERROR", 400, { field, retryable: false }),

  aiProvider: (message: string) =>
    new AppError(message, "AI_PROVIDER_ERROR", 502, { retryable: true }),

  aiParse: (message: string) =>
    new AppError(
      `AI returned malformed response: ${message}`,
      "AI_PARSE_ERROR",
      500,
      { retryable: true }
    ),

  aiTimeout: () =>
    new AppError(
      "AI generation timed out. Please try again.",
      "AI_TIMEOUT",
      504,
      { retryable: true }
    ),

  rateLimited: () =>
    new AppError(
      "Too many requests. Please wait a moment.",
      "RATE_LIMITED",
      429,
      { retryable: true }
    ),

  notFound: (resource: string) =>
    new AppError(`${resource} not found`, "NOT_FOUND", 404, {
      retryable: false,
    }),

  database: (message: string) =>
    new AppError(message, "DATABASE_ERROR", 500, { retryable: false }),

  unknown: (err: unknown) => {
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return new AppError(message, "UNKNOWN_ERROR", 500, { retryable: false });
  },
} as const;

// ─── Type guard ───────────────────────────────────────────────────────────────

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

// ─── API error serialiser (use in route handlers) ─────────────────────────────

export function toApiError(err: unknown): {
  error: string;
  code: ErrorCode;
  statusCode: number;
  meta: AppErrorMeta;
} {
  if (isAppError(err)) {
    return { error: err.message, code: err.code, statusCode: err.statusCode, meta: err.meta };
  }
  const unknown = Errors.unknown(err);
  return {
    error: unknown.message,
    code: unknown.code,
    statusCode: unknown.statusCode,
    meta: unknown.meta,
  };
}
