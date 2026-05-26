// lib/security/index.ts
// ─── Security Utilities ───────────────────────────────────────────────────────
// Defence-in-depth for a public-facing AI app:
//  1. Input sanitization — strip control chars, check lengths
//  2. Prompt injection detection — catch attempts to hijack AI
//  3. CSP nonce generation — per-request nonce for inline scripts
//  4. SSRF prevention — block internal URL patterns in any user input
//  5. Content Security Policy header builder

import { logger, LogEvent } from "@/lib/logger";

// ─── 1. Input sanitization ────────────────────────────────────────────────────

const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function sanitizeString(input: string, maxLength = 500): string {
  return input
    .replace(CONTROL_CHAR_RE, "")   // strip control characters
    .trim()
    .slice(0, maxLength);
}

export function sanitizeDestination(input: string): string {
  // Destination should be alphanumeric + common punctuation for place names
  return input
    .replace(CONTROL_CHAR_RE, "")
    .replace(/[<>{}[\]\\]/g, "")    // strip HTML/JSON special chars
    .trim()
    .slice(0, 100);
}

// ─── 2. Prompt injection detection ───────────────────────────────────────────
// AI apps are vulnerable to users injecting instructions into text fields.
// Detect obvious patterns and reject them before they reach the AI.

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /you\s+are\s+now\s+(a\s+)?different/i,
  /system\s*:\s*you/i,
  /\[INST\]|\[\/INST\]/,            // Llama instruction tokens
  /<\|(?:im_start|im_end|system)\|>/i,
  /forget\s+(everything|all)\s+(you|above)/i,
  /new\s+instructions?\s*:/i,
  /act\s+as\s+(if\s+you\s+)?(?:a\s+)?(?:different|unrestricted)/i,
  /jailbreak/i,
  /dan\s+mode/i,
];

export function detectPromptInjection(input: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(input));
}

export function validateUserInput(
  input: string,
  field: string,
  requestId?: string
): { safe: boolean; reason?: string } {
  if (detectPromptInjection(input)) {
    logger.warn(LogEvent.SEC_SUSPICIOUS_INPUT, {
      field,
      requestId,
      inputLength: input.length,
      // Don't log the actual input — could contain the injection
    });
    return { safe: false, reason: `Invalid characters in ${field}` };
  }
  return { safe: true };
}

// ─── 3. SSRF prevention ───────────────────────────────────────────────────────
// Prevent users from using destination/reason fields to trigger server-side
// requests to internal services.

const SSRF_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.\d+/,
  /192\.168\.\d+\.\d+/,
  /10\.\d+\.\d+\.\d+/,
  /169\.254\.\d+\.\d+/,   // link-local
  /\[::1\]/,               // IPv6 loopback
  /metadata\.google\.internal/i,
  /169\.254\.169\.254/,    // AWS/GCP metadata
  /file:\/\//i,
  /gopher:\/\//i,
];

export function detectSSRF(input: string): boolean {
  return SSRF_PATTERNS.some((re) => re.test(input));
}

// ─── 4. CSP nonce ─────────────────────────────────────────────────────────────

export function generateNonce(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return Buffer.from(crypto.randomUUID().replace(/-/g, ""), "hex").toString("base64");
  }
  // Fallback for older Node
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// ─── 5. Security headers ──────────────────────────────────────────────────────
// Returns headers that should be set on every response.
// Applied in middleware.ts for page routes.

export function getSecurityHeaders(nonce?: string): Record<string, string> {
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self + Vercel analytics + Google Maps
    nonce
      ? `script-src 'self' 'nonce-${nonce}' https://maps.googleapis.com https://va.vercel-scripts.com`
      : "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://va.vercel-scripts.com",
    // Styles: self + fonts + unsafe-inline for Tailwind
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Images: self + Google Maps + Unsplash + data URIs
    "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com https://images.unsplash.com https://*.googleusercontent.com",
    // Connect: self + OpenAI + Open-Meteo + Google APIs + Vercel
    "connect-src 'self' https://api.openai.com https://api.open-meteo.com https://maps.googleapis.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
    // Media/frames: self only
    "media-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    // Misc hardening
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  return {
    "Content-Security-Policy": cspDirectives.join("; "),
    "X-Content-Type-Options":  "nosniff",
    "X-Frame-Options":          "DENY",
    "X-XSS-Protection":         "1; mode=block",
    "Referrer-Policy":          "strict-origin-when-cross-origin",
    "Permissions-Policy":       "camera=(), microphone=(), geolocation=(self), payment=()",
    "Strict-Transport-Security":"max-age=31536000; includeSubDomains; preload",
  };
}

// ─── 6. Request ID generation ─────────────────────────────────────────────────

export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random    = Math.random().toString(36).slice(2, 7);
  return `${timestamp}-${random}`;
}
