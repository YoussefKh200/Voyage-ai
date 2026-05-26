// middleware.ts — Edge-compatible Next.js middleware
// NOTE: Edge Runtime does NOT support Node.js APIs (fs, process.stdout, etc.)
// This file must be 100% Edge-compatible — no imports from logger or monitoring.

import { NextRequest, NextResponse } from "next/server";

const PAGE_ROUTES = ["/", "/planner", "/itinerary"];
const BLOCKED_UA  = [/sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /dirbuster/i];

function generateId(): string {
  // Edge-compatible ID — crypto.randomUUID is available in Edge
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().slice(0, 12);
  }
  return Math.random().toString(36).slice(2, 11);
}

function isPageRoute(pathname: string): boolean {
  return PAGE_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function isBlockedBot(ua: string): boolean {
  return BLOCKED_UA.some((re) => re.test(ua));
}

// Security headers — applied to page routes
const SECURITY_HEADERS: [string, string][] = [
  ["X-Content-Type-Options",   "nosniff"],
  ["X-Frame-Options",           "DENY"],
  ["X-XSS-Protection",          "1; mode=block"],
  ["Referrer-Policy",           "strict-origin-when-cross-origin"],
  ["Permissions-Policy",        "camera=(), microphone=(), geolocation=(self), payment=()"],
  ["Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"],
];

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://maps.googleapis.com https://maps.gstatic.com https://images.unsplash.com https://*.googleusercontent.com",
  "connect-src 'self' https://api.openai.com https://api.open-meteo.com https://maps.googleapis.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const ua        = req.headers.get("user-agent") ?? "";
  const requestId = req.headers.get("x-request-id") ?? generateId();
  const start     = Date.now();

  // Block bad bots on API routes
  if (pathname.startsWith("/api/") && isBlockedBot(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Propagate request ID to route handlers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Always set request ID + timing on responses
  response.headers.set("x-request-id",    requestId);
  response.headers.set("x-response-time", `${Date.now() - start}ms`);
  response.headers.set("x-powered-by",    "");  // Remove Next.js fingerprint

  // Security headers on page routes
  if (isPageRoute(pathname)) {
    SECURITY_HEADERS.forEach(([k, v]) => response.headers.set(k, v));
    response.headers.set("Content-Security-Policy", CSP);
  }

  // No-cache on API routes
  if (pathname.startsWith("/api/")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)"],
};
