// lib/ai/features/service.ts
// ─── Wow Feature AI Service ───────────────────────────────────────────────────
// Shared OpenAI caller for all 5 wow features.
// Each feature has its own prompt builder but shares:
//  - Client construction
//  - Error handling
//  - JSON parsing
//  - Rate-limit awareness
//
// Chat uses streaming (SSE) for real-time character-by-character output.

import OpenAI from "openai";
import { serverConfig } from "@/lib/config/env";
import { Errors } from "@/lib/errors";
import { parseAIResponse } from "@/lib/ai/engine/parser";
import type {
  ReplanRequest,
  ReplanChange,
  BudgetOptimizationRequest,
  BudgetOptimizationResult,
  RouteOptimizationRequest,
  RouteOptimizationResult,
  HiddenGemsResult,
  GeneratedItinerary,
  ChatAction,
} from "@/types";
import type { TripInputs } from "@/lib/schemas/trip.schema";
import {
  buildFeatureSystemPrompt,
  buildReplanPrompt,
  buildBudgetOptimizationPrompt,
  buildRouteOptimizationPrompt,
  buildHiddenGemsPrompt,
  buildChatSystemPrompt,
} from "./prompts";

// ─── Shared client factory ────────────────────────────────────────────────────

function getClient(): OpenAI {
  const key = serverConfig.openaiApiKey;
  if (!key) throw Errors.aiProvider("OpenAI API key not configured");
  return new OpenAI({ apiKey: key, timeout: 60_000, maxRetries: 1 });
}

// ─── Shared JSON caller ───────────────────────────────────────────────────────

async function callAI(userPrompt: string, temperature = 0.6): Promise<unknown> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: serverConfig.openaiModel,
    temperature,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildFeatureSystemPrompt() },
      { role: "user",   content: userPrompt },
    ],
  }).catch((err) => {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) throw Errors.rateLimited();
      throw Errors.aiProvider(err.message);
    }
    throw err;
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw Errors.aiParse("Empty response from AI");

  return parseAIResponse(content);
}

// ─── 1. Replan ────────────────────────────────────────────────────────────────

export async function replanItinerary(
  req: ReplanRequest
): Promise<{ itinerary: GeneratedItinerary; changes: ReplanChange[] }> {
  const raw = (await callAI(buildReplanPrompt(req))) as {
    itinerary: GeneratedItinerary;
    changes: ReplanChange[];
  };

  if (!raw.itinerary?.days?.length) {
    throw Errors.aiParse("Replan response missing itinerary.days");
  }

  return {
    itinerary: { ...raw.itinerary, tripId: req.itinerary.tripId, generatedAt: new Date().toISOString() },
    changes: raw.changes ?? [],
  };
}

// ─── 2. Budget optimization ───────────────────────────────────────────────────

export async function optimizeBudget(
  req: BudgetOptimizationRequest
): Promise<BudgetOptimizationResult> {
  const raw = (await callAI(buildBudgetOptimizationPrompt(req), 0.4)) as BudgetOptimizationResult & {
    itinerary: GeneratedItinerary;
  };

  if (!raw.itinerary?.days?.length) {
    throw Errors.aiParse("Budget optimization response missing itinerary");
  }

  return {
    originalTotal:  raw.originalTotal  ?? req.itinerary.totalCost,
    optimizedTotal: raw.optimizedTotal ?? req.itinerary.totalCost,
    savedAmount:    raw.savedAmount    ?? 0,
    savedPercent:   raw.savedPercent   ?? 0,
    savings:        raw.savings        ?? [],
    itinerary: { ...raw.itinerary, generatedAt: new Date().toISOString() },
  };
}

// ─── 3. Route optimization ────────────────────────────────────────────────────

export async function optimizeRoute(
  req: RouteOptimizationRequest
): Promise<RouteOptimizationResult> {
  const raw = (await callAI(buildRouteOptimizationPrompt(req), 0.3)) as RouteOptimizationResult & {
    itinerary: GeneratedItinerary;
  };

  if (!raw.itinerary?.days?.length) {
    throw Errors.aiParse("Route optimization response missing itinerary");
  }

  return {
    issues:                    raw.issues                    ?? [],
    totalWastedMinutesBefore:  raw.totalWastedMinutesBefore  ?? 0,
    totalWastedMinutesAfter:   raw.totalWastedMinutesAfter   ?? 0,
    minutesSaved:              raw.minutesSaved              ?? 0,
    explanation:               raw.explanation               ?? "",
    itinerary: { ...raw.itinerary, generatedAt: new Date().toISOString() },
  };
}

// ─── 4. Hidden gems ───────────────────────────────────────────────────────────

export async function discoverHiddenGems(
  destination: string,
  interests: string[],
  travelStyle: string
): Promise<HiddenGemsResult> {
  const raw = (await callAI(
    buildHiddenGemsPrompt(destination, interests, travelStyle),
    0.85 // Higher temperature for more creative/varied gem suggestions
  )) as HiddenGemsResult;

  if (!raw.gems?.length) {
    throw Errors.aiParse("Hidden gems response missing gems array");
  }

  return {
    destination: raw.destination ?? destination,
    gems: raw.gems,
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
  };
}

// ─── 5. Chat (streaming) ─────────────────────────────────────────────────────

export async function* chatStream(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  itinerary: GeneratedItinerary,
  inputs: TripInputs
): AsyncGenerator<{ type: "text"; delta: string } | { type: "done"; actions: ChatAction[] }> {
  const client = getClient();

  const systemPrompt = buildChatSystemPrompt(itinerary, inputs);

  // Chat uses regular (non-JSON) completion to allow natural prose streaming.
  // We'll parse the JSON at the end to extract actions.
  const stream = await client.chat.completions.create({
    model: serverConfig.openaiModel,
    temperature: 0.75,
    max_tokens: 1000,
    stream: true,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  let fullContent = "";

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      fullContent += delta;
      yield { type: "text", delta };
    }
  }

  // Parse actions from completed JSON
  let actions: ChatAction[] = [];
  try {
    const parsed = JSON.parse(fullContent) as { content: string; actions?: ChatAction[] };
    actions = parsed.actions ?? [];
  } catch {
    // If JSON parse fails, actions stay empty — not fatal
  }

  yield { type: "done", actions };
}

// ─── Non-streaming chat (for when streaming isn't needed) ─────────────────────

export async function chatOnce(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  itinerary: GeneratedItinerary,
  inputs: TripInputs
): Promise<{ content: string; actions: ChatAction[] }> {
  const raw = (await callAI(buildChatSystemPrompt(itinerary, inputs) + "\n\nUser: " + (messages.at(-1)?.content ?? ""), 0.75)) as {
    content: string;
    actions?: ChatAction[];
  };

  return {
    content: raw.content ?? "I couldn't generate a response. Please try again.",
    actions: raw.actions ?? [],
  };
}
