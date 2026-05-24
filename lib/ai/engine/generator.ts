// lib/ai/engine/generator.ts
// ─── AI Itinerary Generation Engine ──────────────────────────────────────────
// This is the core orchestration layer. It owns:
//  1. Caching — check cache before hitting OpenAI
//  2. Prompt construction — versioned prompt builder
//  3. OpenAI call — typed, with timeout
//  4. Parsing — multi-strategy JSON extraction
//  5. Validation — Zod schema enforcement
//  6. Retry — 3 attempts with progressive prompt adjustments
//  7. Telemetry — structured logs with latency and token usage
//
// The OpenAI SDK is used here (vs raw fetch) for:
//  - Stream support (future)
//  - Automatic retry on transient errors (429, 500)
//  - Proper type definitions

import OpenAI from "openai";
import type { TripInputs, GeneratedItinerary } from "@/types";
import { serverConfig } from "@/lib/config/env";
import { Errors } from "@/lib/errors";
import { itineraryCache, itineraryCacheKey } from "@/lib/cache/lru";
import { buildSystemPrompt, buildItineraryPrompt, PROMPT_VERSION } from "./prompts";
import { parseAIResponse, isTruncated } from "./parser";
import { validateItineraryResponse } from "./schema";
import { generateId } from "@/lib/utils/string";

// ─── Telemetry ────────────────────────────────────────────────────────────────

interface GenerationMetrics {
  cacheHit: boolean;
  attempts: number;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  model: string;
  promptVersion: string;
}

function logMetrics(destination: string, metrics: GenerationMetrics) {
  // Replace with your observability stack (Datadog, PostHog, Axiom, etc.)
  console.info("[AI Engine]", {
    event: "itinerary_generated",
    destination,
    ...metrics,
  });
}

// ─── OpenAI client factory ────────────────────────────────────────────────────
// Not a module-level singleton — re-created per request so config is fresh.
// The SDK itself is lightweight to instantiate.

function createOpenAIClient(): OpenAI {
  const apiKey = serverConfig.openaiApiKey;
  if (!apiKey) throw Errors.aiProvider("OpenAI API key not configured");

  return new OpenAI({
    apiKey,
    organization: serverConfig.openaiOrg ?? undefined,
    timeout: serverConfig.ai.timeoutMs,
    maxRetries: 0, // We handle retries ourselves for full control
  });
}

// ─── Core generation function ─────────────────────────────────────────────────

export async function generateItineraryWithAI(
  inputs: TripInputs
): Promise<GeneratedItinerary> {
  const startTime = Date.now();
  const cacheKey = itineraryCacheKey(inputs);

  // ── 1. Cache check ────────────────────────────────────────────────────────
  const cached = itineraryCache.get(cacheKey) as GeneratedItinerary | undefined;
  if (cached) {
    logMetrics(inputs.destination, {
      cacheHit: true,
      attempts: 0,
      latencyMs: Date.now() - startTime,
      model: serverConfig.openaiModel,
      promptVersion: PROMPT_VERSION,
    });
    return cached;
  }

  // ── 2. Generate with retry ────────────────────────────────────────────────
  const client = createOpenAIClient();
  const maxAttempts = serverConfig.ai.maxRetries;
  let lastError: unknown;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const systemPrompt = buildSystemPrompt();
      const userPrompt = buildItineraryPrompt(inputs);

      // Progressive temperature reduction on retries
      // Attempt 1: 0.7 (creative) → Attempt 3: 0.3 (strict)
      const temperature =
        attempt === 1
          ? serverConfig.ai.temperature
          : Math.max(0.2, serverConfig.ai.temperature - (attempt - 1) * 0.2);

      const completion = await client.chat.completions.create({
        model: serverConfig.openaiModel,
        temperature,
        max_tokens: serverConfig.ai.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
          // On retry: inject a correction message to guide the model
          ...(attempt > 1
            ? [
                {
                  role: "assistant" as const,
                  content: '{"destination":',
                },
              ]
            : []),
        ],
      });

      totalPromptTokens += completion.usage?.prompt_tokens ?? 0;
      totalCompletionTokens += completion.usage?.completion_tokens ?? 0;

      const content = completion.choices[0]?.message?.content;
      if (!content) throw Errors.aiParse("Empty content in response");

      // ── 3. Detect truncation ───────────────────────────────────────────────
      if (isTruncated(content)) {
        console.warn(`[AI Engine] Response truncated on attempt ${attempt} — retrying`);
        lastError = Errors.aiParse("Response was truncated (hit token limit)");
        continue;
      }

      // ── 4. Parse ───────────────────────────────────────────────────────────
      const raw = parseAIResponse(content);

      // ── 5. Validate ────────────────────────────────────────────────────────
      const { valid, data, issues } = validateItineraryResponse(raw);
      if (!valid || !data) {
        const topIssues = issues.slice(0, 3).map((i) => `${i.path}: ${i.message}`).join("; ");
        console.warn(`[AI Engine] Validation failed (attempt ${attempt}): ${topIssues}`);
        lastError = Errors.aiParse(`Schema validation: ${topIssues}`);
        continue;
      }

      // ── 6. Construct result ────────────────────────────────────────────────
      const itinerary: GeneratedItinerary = {
        ...data,
        tripId: generateId(),
        generatedAt: new Date().toISOString(),
      };

      // ── 7. Cache successful result ─────────────────────────────────────────
      itineraryCache.set(cacheKey, itinerary);

      logMetrics(inputs.destination, {
        cacheHit: false,
        attempts: attempt,
        latencyMs: Date.now() - startTime,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        model: serverConfig.openaiModel,
        promptVersion: PROMPT_VERSION,
      });

      return itinerary;
    } catch (err) {
      lastError = err;

      // OpenAI SDK throws specific error types we can inspect
      if (err instanceof OpenAI.APIError) {
        if (err.status === 401) throw Errors.aiProvider("Invalid OpenAI API key");
        if (err.status === 429) throw Errors.rateLimited();
        if (err.status && err.status >= 500) {
          // Server error — retry
          console.warn(`[AI Engine] OpenAI 5xx on attempt ${attempt}: ${err.message}`);
          if (attempt < maxAttempts) {
            // Exponential backoff: 1s, 2s, 4s
            await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
          }
          continue;
        }
        throw Errors.aiProvider(err.message);
      }

      // Timeout
      if (err instanceof Error && err.name === "APIConnectionTimeoutError") {
        throw Errors.aiTimeout();
      }

      // Our own typed errors — re-throw
      throw err;
    }
  }

  // All retries exhausted
  throw Errors.aiParse(
    `Failed after ${maxAttempts} attempts. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
