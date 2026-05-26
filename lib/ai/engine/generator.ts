// lib/ai/engine/generator.ts — AI generation with structured logging + monitoring
import OpenAI from "openai";
import type { TripInputs, GeneratedItinerary } from "@/types";
import { serverConfig } from "@/lib/config/env";
import { Errors } from "@/lib/errors";
import { itineraryCache, itineraryCacheKey } from "@/lib/cache/lru";
import { buildSystemPrompt, buildItineraryPrompt, PROMPT_VERSION } from "./prompts";
import { parseAIResponse, isTruncated } from "./parser";
import { validateItineraryResponse } from "./schema";
import { generateId } from "@/lib/utils/string";
import { logger, LogEvent } from "@/lib/logger";
import { captureError, recordAIUsage } from "@/lib/monitoring";

function getClient(): OpenAI {
  const key = serverConfig.openaiApiKey;
  if (!key) throw Errors.aiProvider("OpenAI API key not configured");
  return new OpenAI({
    apiKey: key,
    organization: serverConfig.openaiOrg ?? undefined,
    timeout: serverConfig.ai.timeoutMs,
    maxRetries: 0,
  });
}

export async function generateItineraryWithAI(
  inputs: TripInputs,
  requestId?: string
): Promise<GeneratedItinerary> {
  const start    = Date.now();
  const cacheKey = itineraryCacheKey(inputs);
  const ctx      = { destination: inputs.destination, requestId, promptVersion: PROMPT_VERSION };

  // ── Cache check ──────────────────────────────────────────────────────────────
  const cached = itineraryCache.get(cacheKey) as GeneratedItinerary | undefined;
  if (cached) {
    logger.info(LogEvent.AI_CACHE_HIT, { ...ctx, durationMs: Date.now() - start });
    return cached;
  }

  logger.info(LogEvent.AI_GENERATE_START, {
    ...ctx,
    travelers: inputs.travelers,
    travelStyle: inputs.travelStyle,
    budget: inputs.budget,
  });

  const client = getClient();
  const maxAttempts = serverConfig.ai.maxRetries;
  let lastError: unknown;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const temperature = attempt === 1
        ? serverConfig.ai.temperature
        : Math.max(0.2, serverConfig.ai.temperature - (attempt - 1) * 0.2);

      const completion = await client.chat.completions.create({
        model: serverConfig.openaiModel,
        temperature,
        max_tokens: serverConfig.ai.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system",    content: buildSystemPrompt() },
          { role: "user",      content: buildItineraryPrompt(inputs) },
          ...(attempt > 1 ? [{ role: "assistant" as const, content: '{"destination":' }] : []),
        ],
      });

      totalPromptTokens     += completion.usage?.prompt_tokens     ?? 0;
      totalCompletionTokens += completion.usage?.completion_tokens ?? 0;

      const content = completion.choices[0]?.message?.content;
      if (!content) throw Errors.aiParse("Empty content in response");

      if (isTruncated(content)) {
        logger.warn(LogEvent.AI_RETRY, { ...ctx, attempt, reason: "truncated" });
        lastError = Errors.aiParse("Response truncated");
        continue;
      }

      const raw = parseAIResponse(content);
      const { valid, data, issues } = validateItineraryResponse(raw);

      if (!valid || !data) {
        const topIssues = issues.slice(0, 3).map((i) => `${i.path}: ${i.message}`).join("; ");
        logger.warn(LogEvent.AI_PARSE_FAILED, { ...ctx, attempt, issues: topIssues });
        lastError = Errors.aiParse(`Validation: ${topIssues}`);
        continue;
      }

      const itinerary: GeneratedItinerary = {
        ...data,
        tripId:      generateId(),
        generatedAt: new Date().toISOString(),
      };

      itineraryCache.set(cacheKey, itinerary);

      recordAIUsage({
        model:             serverConfig.openaiModel,
        promptTokens:      totalPromptTokens,
        completionTokens:  totalCompletionTokens,
        durationMs:        Date.now() - start,
        feature:           "itinerary_generation",
        destination:       inputs.destination,
      });

      return itinerary;
    } catch (err) {
      lastError = err;

      if (err instanceof OpenAI.APIError) {
        if (err.status === 401) throw Errors.aiProvider("Invalid OpenAI API key");
        if (err.status === 429) throw Errors.rateLimited();
        if (err.status && err.status >= 500) {
          logger.warn(LogEvent.AI_RETRY, { ...ctx, attempt, status: err.status });
          if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
          continue;
        }
        throw Errors.aiProvider(err.message);
      }

      if (err instanceof Error && err.name === "APIConnectionTimeoutError") {
        throw Errors.aiTimeout();
      }
      throw err;
    }
  }

  const finalErr = lastError instanceof Error ? lastError : new Error(String(lastError));
  captureError(finalErr, { requestId, destination: inputs.destination });
  throw Errors.aiParse(`Failed after ${maxAttempts} attempts: ${finalErr.message}`);
}
