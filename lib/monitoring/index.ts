// lib/monitoring/index.ts
// ─── Monitoring & Observability ───────────────────────────────────────────────
// Designed for Sentry + Vercel Analytics + custom metrics.
// Currently logs to stdout — swap `captureError` body to add Sentry.
//
// TO ACTIVATE SENTRY:
//   1. npm install @sentry/nextjs
//   2. npx @sentry/wizard@latest -i nextjs
//   3. Uncomment Sentry lines below
//   4. Set SENTRY_DSN in env
//
// Metrics flow to Vercel Analytics automatically when @vercel/analytics is installed.

import { logger, LogEvent } from "@/lib/logger";
import { isAppError } from "@/lib/errors";

// ─── Error capture ────────────────────────────────────────────────────────────

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  route?: string;
  destination?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function captureError(err: unknown, context: ErrorContext = {}): void {
  const error  = err instanceof Error ? err : new Error(String(err));
  const code   = isAppError(err) ? err.code : "UNKNOWN";
  const status = isAppError(err) ? err.statusCode : 500;

  // Always log
  logger.error(LogEvent.API_ERROR, {
    errorName:    error.name,
    errorMessage: error.message,
    errorCode:    code,
    statusCode:   status,
    ...context,
  }, error);

  // Skip tracking for expected client errors
  if (status < 500) return;

  // ── Sentry integration (uncomment when SENTRY_DSN is set) ─────────────────
  // if (process.env.SENTRY_DSN) {
  //   const Sentry = require('@sentry/nextjs');
  //   Sentry.withScope((scope: Sentry.Scope) => {
  //     if (context.userId)    scope.setUser({ id: context.userId });
  //     if (context.requestId) scope.setTag('requestId', context.requestId);
  //     if (context.route)     scope.setTag('route', context.route);
  //     if (context.tags)      Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
  //     if (context.extra)     scope.setExtras(context.extra);
  //     scope.setTag('errorCode', code);
  //     Sentry.captureException(error);
  //   });
  // }
}

// ─── Performance metrics ──────────────────────────────────────────────────────

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count" | "percent";
  tags?: Record<string, string>;
}

const metricsBuffer: PerformanceMetric[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function recordMetric(metric: PerformanceMetric): void {
  metricsBuffer.push(metric);

  // Batch-flush every 10s or when buffer hits 100
  if (metricsBuffer.length >= 100) {
    flushMetrics();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushMetrics, 10_000);
  }
}

function flushMetrics(): void {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (metricsBuffer.length === 0) return;

  const batch = metricsBuffer.splice(0);

  // Log as structured data — Datadog/Axiom picks this up as metrics
  logger.info("metrics.flush", {
    count: batch.length,
    metrics: batch,
  });

  // ── Datadog StatsD integration ─────────────────────────────────────────────
  // if (process.env.DD_AGENT_HOST) {
  //   batch.forEach(m => statsd.gauge(m.name, m.value, m.tags));
  // }
}

// ─── AI cost tracking ─────────────────────────────────────────────────────────
// Track OpenAI token usage per request for cost attribution.

export function recordAIUsage(params: {
  model: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
  feature: string;
  destination?: string;
}): void {
  const totalTokens = params.promptTokens + params.completionTokens;

  // Approximate cost (GPT-4o pricing as of 2025)
  const costUSD = (params.promptTokens / 1_000_000) * 2.5 +
                  (params.completionTokens / 1_000_000) * 10;

  logger.info(LogEvent.AI_GENERATE_SUCCESS, {
    ...params,
    totalTokens,
    estimatedCostUSD: Math.round(costUSD * 10_000) / 10_000,
  });

  recordMetric({ name: "ai.tokens.total",     value: totalTokens,        unit: "count", tags: { feature: params.feature } });
  recordMetric({ name: "ai.latency",          value: params.durationMs,  unit: "ms",    tags: { feature: params.feature } });
  recordMetric({ name: "ai.cost_usd",         value: costUSD * 1000,     unit: "count", tags: { feature: params.feature } }); // milli-dollars
}

// ─── Health check ─────────────────────────────────────────────────────────────

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  checks: Record<string, { status: "ok" | "error"; latencyMs?: number; message?: string }>;
}

export async function runHealthCheck(): Promise<HealthStatus> {
  const checks: HealthStatus["checks"] = {};
  const start = Date.now();

  // OpenAI reachability
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      method: "HEAD",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}` },
      signal: AbortSignal.timeout(3000),
    });
    checks.openai = { status: res.ok ? "ok" : "error", latencyMs: Date.now() - start, message: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (e) {
    checks.openai = { status: "error", message: (e as Error).message };
  }

  // Memory check (Node process)
  const memMb = process.memoryUsage().heapUsed / 1_048_576;
  checks.memory = { status: memMb < 450 ? "ok" : "error", message: `${Math.round(memMb)}MB heap used` };

  const hasError   = Object.values(checks).some((c) => c.status === "error");
  const hasCritical = checks.memory?.status === "error";

  return {
    status: hasCritical ? "unhealthy" : hasError ? "degraded" : "healthy",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.1",
    timestamp: new Date().toISOString(),
    checks,
  };
}
