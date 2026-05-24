"use client";
// components/wow/ChatAssistant.tsx — "Find me romantic restaurants nearby"

import { useState, useRef, useEffect, useCallback } from "react";
import { useWowStore } from "@/lib/store/wow.store";
import { usePlannerStore, selectItinerary, selectInputs } from "@/lib/store/planner.store";
import type { ChatMessage, ChatAction } from "@/types";
import { cn } from "@/lib/utils/cn";

const STARTER_PROMPTS = [
  "What are the best romantic restaurants here?",
  "What should I avoid as a tourist?",
  "Best time to visit the main attractions?",
  "What's the local tipping culture?",
  "How do I get around cheaply?",
  "What should I pack for this trip?",
];

export function ChatAssistant() {
  const itinerary = usePlannerStore(selectItinerary);
  const inputs    = usePlannerStore(selectInputs);
  const {
    messages, isChatOpen, isChatLoading, chatError,
    addMessage, updateLastMessage, setChatOpen, setChatLoading, setChatError, clearChat,
  } = useWowStore();

  const [input, setInput] = useState("");
  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLTextAreaElement>(null);
  const abortRef          = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [messages, isChatOpen]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isChatLoading || !itinerary || !inputs) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Add user message
    addMessage({ role: "user", content: content.trim() });
    setInput("");
    setChatLoading(true);
    setChatError(null);

    // Add streaming placeholder
    addMessage({ role: "assistant", content: "", isStreaming: true });

    try {
      const historyMessages = [
        ...messages
          .filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: content.trim() },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ messages: historyMessages, itinerary, inputs }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let finalActions: ChatAction[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data) as {
              type: "delta" | "done" | "error";
              content?: string;
              actions?: ChatAction[];
              message?: string;
            };

            if (parsed.type === "delta" && parsed.content) {
              accumulated += parsed.content;
              updateLastMessage(accumulated);
            } else if (parsed.type === "done") {
              finalActions = parsed.actions ?? [];
            } else if (parsed.type === "error") {
              throw new Error(parsed.message);
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      // Finalize with actions
      if (finalActions.length > 0) {
        // Actions stored as JSON in message for now
        updateLastMessage(accumulated);
      }

    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setChatError("Couldn't send message. Please try again.");
      updateLastMessage("Sorry, I couldn't process that. Please try again.");
    } finally {
      setChatLoading(false);
    }
  }, [itinerary, inputs, messages, isChatLoading, addMessage, updateLastMessage, setChatLoading, setChatError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!itinerary) return null;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setChatOpen(!isChatOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl transition-all duration-400",
          "flex items-center justify-center text-xl",
          isChatOpen
            ? "bg-white/10 border border-white/20 rotate-45 scale-95"
            : "bg-gradient-to-br from-[#d4a853] to-[#e2714b] hover:scale-110 hover:shadow-[#d4a853]/40"
        )}
        aria-label={isChatOpen ? "Close chat" : "Open AI assistant"}
      >
        {isChatOpen ? "✕" : "💬"}
      </button>

      {/* Unread dot */}
      {!isChatOpen && messages.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 w-4 h-4 bg-[#d4a853] rounded-full flex items-center justify-center text-[9px] font-bold text-white pointer-events-none">
          {messages.filter((m) => m.role === "assistant").length}
        </div>
      )}

      {/* Chat panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-24px)] transition-all duration-400 ease-out",
          isChatOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        <div className="glass rounded-3xl border border-white/12 overflow-hidden shadow-2xl flex flex-col"
             style={{ height: messages.length === 0 ? "auto" : "520px" }}>
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between bg-gradient-to-r from-[#d4a853]/10 to-transparent flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a853] to-[#e2714b] flex items-center justify-center text-sm shadow-md">
                ✨
              </div>
              <div>
                <p className="text-white font-semibold text-sm">AI Concierge</p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-white/35 text-xs">Expert on {itinerary.destination}</p>
                </div>
              </div>
            </div>
            <button onClick={clearChat}
              className="text-white/25 hover:text-white/60 text-xs transition-colors px-2 py-1 rounded-lg hover:glass">
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.length === 0 ? (
              /* Starter UI */
              <div className="space-y-4">
                <p className="text-white/50 text-sm text-center leading-relaxed">
                  Ask me anything about your trip to <span className="text-[#d4a853]">{itinerary.destination}</span>
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => sendMessage(prompt)}
                      className="text-left p-3 rounded-xl glass border border-white/8 text-white/50 text-xs hover:text-white hover:border-white/20 transition-all duration-200 hover:bg-white/5">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} onAction={sendMessage} />)
            )}
            {chatError && (
              <div className="text-center">
                <p className="text-rose-400 text-xs py-2">{chatError}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your trip…"
                rows={1}
                className="flex-1 input-glass rounded-xl px-4 py-3 text-sm resize-none leading-relaxed max-h-28"
                style={{ minHeight: "44px" }}
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isChatLoading}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all duration-200",
                  input.trim() && !isChatLoading
                    ? "btn-primary shadow-md"
                    : "glass border border-white/10 text-white/20 cursor-not-allowed"
                )}
              >
                {isChatLoading
                  ? <div className="w-4 h-4 border border-white/30 border-t-white rounded-full animate-spin" />
                  : <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 12L12 7 2 2v4.5l7 0.5-7 0.5V12z" fill="currentColor"/>
                    </svg>}
              </button>
            </div>
            <p className="text-white/15 text-[10px] mt-2 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message, onAction }: { message: ChatMessage; onAction: (s: string) => void }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5 animate-fade-up", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs mt-0.5",
        isUser ? "bg-white/10 border border-white/15" : "bg-gradient-to-br from-[#d4a853] to-[#e2714b]"
      )}>
        {isUser ? "👤" : "✨"}
      </div>

      <div className={cn("max-w-[80%] space-y-2", isUser && "items-end flex flex-col")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-[#d4a853]/15 border border-[#d4a853]/20 text-white rounded-tr-sm"
            : "glass border border-white/8 text-white/80 rounded-tl-sm"
        )}>
          {message.isStreaming && !message.content ? (
            <div className="flex items-center gap-1.5 py-0.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#d4a853]/60"
                     style={{ animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
          {message.isStreaming && message.content && (
            <span className="inline-block w-0.5 h-4 bg-[#d4a853]/80 ml-0.5 align-middle animate-pulse" />
          )}
        </div>

        {/* Action chips */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {message.actions.map((action: ChatAction, i: number) => (
              <button key={i} type="button" onClick={() => onAction(action.label)}
                className="text-xs px-3 py-1.5 rounded-full glass border border-[#d4a853]/25 text-[#d4a853] hover:bg-[#d4a853]/10 transition-all duration-200">
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
