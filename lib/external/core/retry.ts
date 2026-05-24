// lib/external/core/retry.ts
// ─── Retry with Exponential Backoff + Jitter ─────────────────────────────────
// Every external API call goes through this. Strategy:
//   attempt 1 → immediate
//   attempt 2 → ~1s delay
//   attempt 3 → ~2s delay
//   attempt 4 → ~4s delay  (maxAttempts default: 3)
//
// Jitter (±25% randomness) prevents thundering herd when many requests
// fail simultaneously and all retry at the same interval.

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Return true to retry on this error, false to throw immediately */
  isRetryable?: (err: unknown) => boolean;
  onRetry?: (attempt: number, err: unknown, delayMs: number) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function computeDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
  // ±25% jitter
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(exponential + jitter));
}

// Default: retry on network errors and 5xx, never on 4xx client errors
function defaultIsRetryable(err: unknown): boolean {
  if (err instanceof FetchError) {
    return err.status === undefined || err.status >= 500;
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("timeout") ||
      msg.includes("network") ||
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      err.name === "AbortError"
    );
  }
  return false;
}

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 8000,
    isRetryable = defaultIsRetryable,
    onRetry,
  } = options;

  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;

      const isLast = attempt === maxAttempts;
      if (isLast || !isRetryable(err)) {
        throw err;
      }

      const delayMs = computeDelay(attempt, baseDelayMs, maxDelayMs);
      onRetry?.(attempt, err, delayMs);
      await sleep(delayMs);
    }
  }

  throw lastErr;
}

// ─── Typed fetch error (carries HTTP status for retry decisions) ───────────────

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "FetchError";
  }
}
