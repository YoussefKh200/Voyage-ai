// lib/store/wow.store.ts
// ─── Wow Features State ────────────────────────────────────────────────────────
// Separate store from the planner so wow features don't bloat the main store.
// All state is session-only — no localStorage persistence.

import { create } from "zustand";
import type {
  BudgetOptimizationResult,
  RouteOptimizationResult,
  HiddenGemsResult,
  ChatMessage,
  ReplanChange,
} from "@/types";
import { generateId } from "@/lib/utils/string";

// ─── Replanning ───────────────────────────────────────────────────────────────

interface ReplanState {
  isReplanning: boolean;
  replanChanges: ReplanChange[] | null;
  replanError: string | null;
  setReplanning: (v: boolean) => void;
  setReplanChanges: (c: ReplanChange[] | null) => void;
  setReplanError: (e: string | null) => void;
}

// ─── Budget Optimization ──────────────────────────────────────────────────────

interface BudgetState {
  isOptimizing: boolean;
  optimizationResult: BudgetOptimizationResult | null;
  budgetError: string | null;
  setOptimizing: (v: boolean) => void;
  setOptimizationResult: (r: BudgetOptimizationResult | null) => void;
  setBudgetError: (e: string | null) => void;
}

// ─── Route Optimization ───────────────────────────────────────────────────────

interface RouteState {
  isOptimizingRoute: boolean;
  routeResult: RouteOptimizationResult | null;
  routeError: string | null;
  setOptimizingRoute: (v: boolean) => void;
  setRouteResult: (r: RouteOptimizationResult | null) => void;
  setRouteError: (e: string | null) => void;
}

// ─── Hidden Gems ──────────────────────────────────────────────────────────────

interface GemsState {
  isLoadingGems: boolean;
  gemsResult: HiddenGemsResult | null;
  gemsError: string | null;
  setLoadingGems: (v: boolean) => void;
  setGemsResult: (r: HiddenGemsResult | null) => void;
  setGemsError: (e: string | null) => void;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

interface ChatState {
  messages: ChatMessage[];
  isChatOpen: boolean;
  isChatLoading: boolean;
  chatError: string | null;
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateLastMessage: (content: string) => void;
  setChatOpen: (v: boolean) => void;
  setChatLoading: (v: boolean) => void;
  setChatError: (e: string | null) => void;
  clearChat: () => void;
}

// ─── Combined store ───────────────────────────────────────────────────────────

type WowStore = ReplanState & BudgetState & RouteState & GemsState & ChatState;

export const useWowStore = create<WowStore>()((set) => ({
  // Replanning
  isReplanning: false,
  replanChanges: null,
  replanError: null,
  setReplanning: (v) => set({ isReplanning: v }),
  setReplanChanges: (c) => set({ replanChanges: c }),
  setReplanError: (e) => set({ replanError: e }),

  // Budget
  isOptimizing: false,
  optimizationResult: null,
  budgetError: null,
  setOptimizing: (v) => set({ isOptimizing: v }),
  setOptimizationResult: (r) => set({ optimizationResult: r }),
  setBudgetError: (e) => set({ budgetError: e }),

  // Route
  isOptimizingRoute: false,
  routeResult: null,
  routeError: null,
  setOptimizingRoute: (v) => set({ isOptimizingRoute: v }),
  setRouteResult: (r) => set({ routeResult: r }),
  setRouteError: (e) => set({ routeError: e }),

  // Gems
  isLoadingGems: false,
  gemsResult: null,
  gemsError: null,
  setLoadingGems: (v) => set({ isLoadingGems: v }),
  setGemsResult: (r) => set({ gemsResult: r }),
  setGemsError: (e) => set({ gemsError: e }),

  // Chat
  messages: [],
  isChatOpen: false,
  isChatLoading: false,
  chatError: null,
  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id: generateId(), timestamp: new Date().toISOString() },
      ],
    })),
  updateLastMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      if (msgs.length > 0) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content, isStreaming: false };
      return { messages: msgs };
    }),
  setChatOpen: (v) => set({ isChatOpen: v }),
  setChatLoading: (v) => set({ isChatLoading: v }),
  setChatError: (e) => set({ chatError: e }),
  clearChat: () => set({ messages: [], chatError: null }),
}));
