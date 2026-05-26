// app/api/health/route.ts — GET /api/health
// Used by Vercel, uptime monitors (UptimeRobot, BetterStack), and load balancers.
import { NextResponse } from "next/server";
import { runHealthCheck } from "@/lib/monitoring";

export async function GET() {
  const health = await runHealthCheck();
  const status = health.status === "unhealthy" ? 503 : health.status === "degraded" ? 207 : 200;
  return NextResponse.json(health, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json",
    },
  });
}

export const dynamic = "force-dynamic";
