// lib/ai/engine/parser.ts
// ─── AI Response Parser ───────────────────────────────────────────────────────
// LLMs occasionally return JSON wrapped in markdown fences, prefixed with prose
// ("Here is your itinerary:"), or with minor syntax errors. This parser handles
// all known failure modes before the Zod validator sees the data.
//
// Repair strategies (in order):
//  1. Try direct JSON.parse
//  2. Strip markdown code fences (```json ... ```)
//  3. Extract the outermost {...} block from mixed prose+JSON
//  4. Fix common AI JSON mistakes (trailing commas, single quotes)
//  5. Throw AI_PARSE_ERROR with the specific failure mode for debugging

import { Errors } from "@/lib/errors";

// ─── Main entry point ─────────────────────────────────────────────────────────

export function parseAIResponse(content: string): unknown {
  if (!content || content.trim().length === 0) {
    throw Errors.aiParse("Empty response content");
  }

  const strategies: Array<{ name: string; fn: (s: string) => unknown }> = [
    { name: "direct",            fn: parseDirect },
    { name: "strip-fences",      fn: parseStripFences },
    { name: "extract-json",      fn: parseExtractJson },
    { name: "repair-syntax",     fn: parseRepairSyntax },
  ];

  const errors: string[] = [];

  for (const { name, fn } of strategies) {
    try {
      const result = fn(content);
      if (result && typeof result === "object") {
        if (process.env.NODE_ENV !== "production" && name !== "direct") {
          console.info(`[AI Parser] Used strategy: ${name}`);
        }
        return result;
      }
    } catch (e) {
      errors.push(`${name}: ${(e as Error).message}`);
    }
  }

  // All strategies failed — include the first 200 chars of response for debugging
  const preview = content.slice(0, 200).replace(/\n/g, "\\n");
  throw Errors.aiParse(
    `All parse strategies failed. Response preview: "${preview}". Errors: ${errors.join(" | ")}`
  );
}

// ─── Parse strategies ─────────────────────────────────────────────────────────

function parseDirect(content: string): unknown {
  return JSON.parse(content.trim());
}

function parseStripFences(content: string): unknown {
  // Handles: ```json {...} ``` and ``` {...} ```
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (!fenced?.[1]) throw new Error("No fenced block found");
  return JSON.parse(fenced[1].trim());
}

function parseExtractJson(content: string): unknown {
  // Find the outermost { ... } block (handles prose before/after JSON)
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object boundaries found");
  }
  const extracted = content.slice(start, end + 1);
  return JSON.parse(extracted);
}

function parseRepairSyntax(content: string): unknown {
  // Extract JSON block first
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON boundaries");

  let json = content.slice(start, end + 1);

  // Fix trailing commas before } or ] — common AI mistake
  json = json.replace(/,(\s*[}\]])/g, "$1");

  // Fix single-quoted strings (AI sometimes uses Python-style quotes)
  json = json.replace(/'([^']*?)'/g, '"$1"');

  // Fix unquoted keys (AI occasionally omits quotes on keys)
  json = json.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Remove JavaScript-style comments
  json = json.replace(/\/\/[^\n]*/g, "");
  json = json.replace(/\/\*[\s\S]*?\*\//g, "");

  return JSON.parse(json);
}

// ─── Truncation detector ──────────────────────────────────────────────────────
// If the AI hit the token limit, the response will be cut mid-JSON.
// Detect this so we can retry with a smaller request.

export function isTruncated(content: string): boolean {
  const trimmed = content.trimEnd();
  // A complete JSON object always ends with }
  // If there's an unclosed structure, we were truncated
  const openBraces = (trimmed.match(/\{/g) ?? []).length;
  const closeBraces = (trimmed.match(/\}/g) ?? []).length;
  return openBraces !== closeBraces || !trimmed.endsWith("}");
}
