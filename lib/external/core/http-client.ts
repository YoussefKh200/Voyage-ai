// lib/external/core/http-client.ts
// ─── Base HTTP Client ─────────────────────────────────────────────────────────
// Thin wrapper around fetch that adds:
//  - Configurable timeout via AbortController
//  - Automatic JSON parsing with typed responses
//  - Structured error via FetchError (carries status code for retry logic)
//  - Request ID header for server-side tracing
//  - Consistent content-type handling

import { FetchError } from "./retry";
import { generateId } from "@/lib/utils/string";

export interface HttpClientOptions {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly timeoutMs: number;

  constructor({ baseUrl, defaultHeaders = {}, timeoutMs = 10_000 }: HttpClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // strip trailing slash
    this.defaultHeaders = defaultHeaders;
    this.timeoutMs = timeoutMs;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = "GET",
      params,
      body,
      headers = {},
      timeoutMs = this.timeoutMs,
      signal: externalSignal,
    } = options;

    // Build URL with query params
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      }
    }

    // AbortController for timeout (chain with external signal if provided)
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (externalSignal) {
      externalSignal.addEventListener("abort", () => controller.abort());
    }

    const mergedHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Request-Id": generateId(),
      ...this.defaultHeaders,
      ...headers,
    };

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method,
        headers: mergedHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw new FetchError(`Request timeout after ${timeoutMs}ms: ${url.pathname}`);
      }
      throw new FetchError(`Network error: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }

    // Parse body regardless — we need it for error messages
    let responseBody: unknown;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      responseBody = await response.json().catch(() => null);
    } else {
      responseBody = await response.text().catch(() => null);
    }

    if (!response.ok) {
      throw new FetchError(
        `HTTP ${response.status} from ${url.pathname}`,
        response.status,
        responseBody
      );
    }

    return responseBody as T;
  }

  // Convenience shorthands
  get<T>(path: string, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body: unknown, options?: Omit<RequestOptions, "method" | "body">) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }
}
