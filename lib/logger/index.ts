// lib/logger/index.ts
// ─── Structured Logger ────────────────────────────────────────────────────────
// Design goals:
//  1. Every log line is valid JSON — parseable by Datadog, Axiom, Logtail, etc.
//  2. Consistent fields: timestamp, level, service, requestId, duration
//  3. No sensitive data in logs (API keys, user PII stripped automatically)
//  4. Dev mode: pretty-prints coloured text for readability
//  5. Zero dependencies beyond Node built-ins
//
// Usage:
//   import { logger } from '@/lib/logger';
//   logger.info('itinerary.generated', { destination, durationMs, tokens });
//   logger.error('ai.failed', { code, attempt }, error);

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: string;
  route?: string;
  method?: string;
  ip?: string;
  durationMs?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: "voyage-ai";
  event: string;
  env: string;
  context: LogContext;
  error?: {
    message: string;
    name: string;
    stack?: string;
    code?: string;
  };
}

// ─── Sensitive field stripping ────────────────────────────────────────────────
// Never log these fields — strip them before output.

const SENSITIVE_KEYS = new Set([
  "apikey", "api_key", "openai_api_key", "google_api_key",
  "password", "token", "secret", "authorization", "cookie",
  "creditcard", "ssn", "email",
]);

function stripSensitive(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = stripSensitive(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}

// ─── Dev pretty-printer ───────────────────────────────────────────────────────

const LEVEL_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m",  // grey
  info:  "\x1b[36m",  // cyan
  warn:  "\x1b[33m",  // yellow
  error: "\x1b[31m",  // red
};
const RESET = "\x1b[0m";

function prettyPrint(entry: LogEntry): void {
  const color = LEVEL_COLORS[entry.level] ?? "";
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const ctx = Object.keys(entry.context).length
    ? " " + JSON.stringify(entry.context)
    : "";
  console.log(`${color}[${entry.level.toUpperCase()}]${RESET} ${time} ${entry.event}${ctx}`);
  if (entry.error) {
    console.error(`${LEVEL_COLORS.error}  Error: ${entry.error.message}${RESET}`);
    if (entry.error.stack && process.env.NODE_ENV !== "production") {
      console.error(entry.error.stack.split("\n").slice(1, 4).join("\n"));
    }
  }
}

// ─── Logger class ─────────────────────────────────────────────────────────────

class Logger {
  private minLevel: LogLevel;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV !== "production";
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) ?? (this.isDev ? "debug" : "info");
  }

  private shouldLog(level: LogLevel): boolean {
    const order: LogLevel[] = ["debug", "info", "warn", "error"];
    return order.indexOf(level) >= order.indexOf(this.minLevel);
  }

  private write(level: LogLevel, event: string, context: LogContext = {}, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: "voyage-ai",
      event,
      env: process.env.NODE_ENV ?? "development",
      context: stripSensitive(context) as LogContext,
      ...(error && {
        error: {
          message: error.message,
          name: error.name,
          code: (error as Error & { code?: string }).code,
          // Only include stack in non-prod
          ...(this.isDev && { stack: error.stack }),
        },
      }),
    };

    if (this.isDev) {
      prettyPrint(entry);
    } else {
      // Production: single-line JSON — Vercel log drain / Axiom / Datadog pick this up
      // Guard for Edge Runtime which doesn't have process.stdout
      if (typeof process !== "undefined" && process.stdout?.write) {
        process.stdout.write(JSON.stringify(entry) + "\n");
      } else {
        console.log(JSON.stringify(entry));
      }
    }
  }

  debug(event: string, context?: LogContext)               { this.write("debug", event, context); }
  info (event: string, context?: LogContext)               { this.write("info",  event, context); }
  warn (event: string, context?: LogContext)               { this.write("warn",  event, context); }
  error(event: string, context?: LogContext, err?: Error)  { this.write("error", event, context, err); }

  // ── Convenience: time an async operation ──────────────────────────────────

  async time<T>(event: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.info(event, { ...context, durationMs: Date.now() - start, status: "ok" });
      return result;
    } catch (err) {
      this.error(event, { ...context, durationMs: Date.now() - start, status: "error" }, err as Error);
      throw err;
    }
  }

  // ── Request logger factory ─────────────────────────────────────────────────
  // Returns a child logger with request context pre-bound.

  forRequest(requestId: string, route: string, method: string): Logger & { ctx: LogContext } {
    const child = new Logger();
    const ctx: LogContext = { requestId, route, method };
    const bound = {
      ...child,
      ctx,
      debug: (ev: string, c?: LogContext) => child.debug(ev, { ...ctx, ...c }),
      info:  (ev: string, c?: LogContext) => child.info (ev, { ...ctx, ...c }),
      warn:  (ev: string, c?: LogContext) => child.warn (ev, { ...ctx, ...c }),
      error: (ev: string, c?: LogContext, e?: Error) => child.error(ev, { ...ctx, ...c }, e),
    };
    return bound as Logger & { ctx: LogContext };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const logger = new Logger();

// ─── Well-known event names (prevents typos, aids log search) ─────────────────

export const LogEvent = {
  // AI
  AI_GENERATE_START:    "ai.generate.start",
  AI_GENERATE_SUCCESS:  "ai.generate.success",
  AI_GENERATE_FAILED:   "ai.generate.failed",
  AI_CACHE_HIT:         "ai.cache.hit",
  AI_RETRY:             "ai.retry",
  AI_PARSE_FAILED:      "ai.parse.failed",

  // Features
  REPLAN_START:         "feature.replan.start",
  REPLAN_SUCCESS:       "feature.replan.success",
  BUDGET_OPT_START:     "feature.budget.start",
  ROUTE_OPT_START:      "feature.route.start",
  GEMS_REQUESTED:       "feature.gems.requested",
  CHAT_MESSAGE:         "feature.chat.message",

  // API
  API_REQUEST:          "api.request",
  API_RESPONSE:         "api.response",
  API_RATE_LIMITED:     "api.rate_limited",
  API_ERROR:            "api.error",

  // External
  EXT_GEOCODE:          "external.geocode",
  EXT_PLACES:           "external.places",
  EXT_WEATHER:          "external.weather",
  EXT_MAPS_ERROR:       "external.maps.error",

  // Security
  SEC_SUSPICIOUS_INPUT: "security.suspicious_input",
  SEC_RATE_EXCEEDED:    "security.rate_exceeded",
} as const;
