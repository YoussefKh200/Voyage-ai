import { NextRequest } from "next/server";
import { z } from "zod";
import { chatStream } from "@/lib/ai/features/service";
import { placesLimiter, getRequestIdentifier } from "@/lib/ratelimit";
import { serverConfig } from "@/lib/config/env";
import type { GeneratedItinerary } from "@/types";
import type { TripInputs } from "@/lib/schemas/trip.schema";

const Schema = z.object({
  messages:  z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
  itinerary: z.record(z.string(), z.unknown()),
  inputs:    z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const id = getRequestIdentifier(req);
  const rl = placesLimiter.check(id);
  if (!rl.allowed) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });

  if (!serverConfig.openaiApiKey) return mockStreamResponse();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gen = chatStream(
          parsed.data.messages,
          parsed.data.itinerary as unknown as GeneratedItinerary,
          parsed.data.inputs as unknown as TripInputs
        );

        let buffer = "";
        let inContent = false;
        let contentDone = false;

        for await (const event of gen) {
          if (event.type === "text") {
            buffer += event.delta;
            if (!inContent) {
              const match = buffer.match(/"content"\s*:\s*"/);
              if (match) {
                inContent = true;
                buffer = buffer.slice(buffer.indexOf(match[0]) + match[0].length);
              }
            }
            if (inContent && !contentDone) {
              let toSend = "";
              let i = 0;
              while (i < buffer.length) {
                if (buffer[i] === '"' && buffer[i-1] !== '\\') {
                  const rest = buffer.slice(i+1).trimStart();
                  if (rest.startsWith(",") || rest.startsWith("}")) { contentDone = true; break; }
                }
                toSend += buffer[i++];
              }
              buffer = buffer.slice(i);
              if (toSend) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: toSend })}\n\n`));
            }
          } else if (event.type === "done") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", actions: event.actions })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: (err as Error).message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
}

function mockStreamResponse() {
  const encoder = new TextEncoder();
  const words = "I'm your AI travel concierge! Add your OpenAI API key to .env.local to enable real-time chat assistance for your trip.".split(" ");
  const stream = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delta", content: word + " " })}\n\n`));
        await new Promise((r) => setTimeout(r, 60));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", actions: [] })}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
}

export const dynamic = "force-dynamic";
