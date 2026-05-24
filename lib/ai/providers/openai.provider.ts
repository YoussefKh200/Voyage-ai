// lib/ai/providers/openai.provider.ts
// ─── OpenAI Provider ─────────────────────────────────────────────────────────
// Improvements over original:
//  - Explicit AbortController timeout (was hanging indefinitely)
//  - Zod-validates response shape before returning (was blind cast)
//  - Structured error types (was raw Error strings)
//  - API key checked at construction time, not at call time
//  - No module-level singleton (instantiated fresh per serverConfig read)

import { TripInputs, GeneratedItinerary } from "@/types";
import { serverConfig } from "@/lib/config/env";
import { buildSystemPrompt, buildItineraryPrompt } from "@/lib/ai/prompts";
import { AIResponseSchema } from "./response.schema";
import { Errors } from "@/lib/errors";
import { AIProvider } from "./types";

// ─── OpenAI API types (minimal — avoids pulling in the full SDK) ──────────────

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: { content: string | null };
    finish_reason: string;
  }>;
  usage?: { total_tokens: number };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("[OpenAIProvider] apiKey is required");
    this.apiKey = apiKey;
    this.model = serverConfig.openaiModel;
    this.timeoutMs = serverConfig.ai.timeoutMs;
  }

  async generateItinerary(inputs: TripInputs): Promise<GeneratedItinerary> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let rawResponse: OpenAIResponse;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          temperature: serverConfig.ai.temperature,
          max_tokens: serverConfig.ai.maxTokens,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildSystemPrompt() },
            { role: "user", content: buildItineraryPrompt(inputs) },
          ] satisfies OpenAIMessage[],
        }),
      });

      if (!res.ok) {
        // Attempt to extract OpenAI's error message
        const body = await res.json().catch(() => ({}));
        throw Errors.aiProvider(
          body?.error?.message ?? `OpenAI returned HTTP ${res.status}`
        );
      }

      rawResponse = (await res.json()) as OpenAIResponse;
    } catch (err) {
      if ((err as Error).name === "AbortError") throw Errors.aiTimeout();
      if (err instanceof Error && err.message.includes("fetch")) {
        throw Errors.aiProvider("Network error reaching OpenAI");
      }
      throw err; // Re-throw AppErrors and other known errors
    } finally {
      clearTimeout(timer);
    }

    // ── Parse and validate response ────────────────────────────────────────────

    const content = rawResponse.choices[0]?.message?.content;
    if (!content) throw Errors.aiParse("Empty content in choices[0]");

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw Errors.aiParse("Response was not valid JSON");
    }

    const validated = AIResponseSchema.safeParse(parsed);
    if (!validated.success) {
      const issues = validated.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      throw Errors.aiParse(issues);
    }

    return {
      ...validated.data,
      tripId: `${inputs.destination.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
    };
  }
}
