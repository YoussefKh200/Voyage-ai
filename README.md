# 🌍 Voyage AI — AI-powered Travel Planner

> Plan smarter. Travel deeper.

A production-quality Next.js 16 application that generates complete, personalized travel itineraries using AI. Built with a startup-grade architecture: clean separation of concerns, typed everything, scalable folder structure, and a beautiful glassmorphism UI.

---

## ✨ Features

- **AI Itinerary Generation** — Day-by-day plans with activities, restaurants, transport, and cost estimates
- **Multi-step Planner** — Guided 4-step form: destination → budget → interests → review
- **Beautiful UI** — Glassmorphism design inspired by Airbnb, Linear, and Apple
- **Responsive** — Works flawlessly on mobile, tablet, and desktop
- **Mock Fallback** — Fully functional without an OpenAI API key (great for demos)
- **Zustand State** — Persistent planner state across page reloads
- **Prisma + PostgreSQL** — Production-ready DB schema ready to connect
- **Map Placeholder** — Drop-in Google Maps integration point

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd voyage-ai
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required for database (skip if not using DB in dev)
DATABASE_URL="postgresql://user:password@localhost:5432/voyage_ai"

# Optional — app works with mock data without this
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"

# Optional — for real map integration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIza..."
```

> **Note:** Without `OPENAI_API_KEY`, the app uses a realistic mock AI response. Perfect for UI development.

### 3. Set up the database (optional for MVP dev)

```bash
npx prisma generate
npx prisma db push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
voyage-ai/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── itinerary/route.ts    # POST /api/itinerary — AI generation endpoint
│   ├── itinerary/page.tsx         # Generated itinerary display page
│   ├── planner/page.tsx           # Multi-step planner form
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout + metadata
│   └── globals.css                # Global styles + design tokens
│
├── components/
│   ├── ui/                        # Reusable primitives
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Spinner.tsx
│   │   └── ProgressBar.tsx
│   ├── landing/                   # Landing page sections
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   └── Footer.tsx
│   ├── planner/                   # Planner form steps
│   │   ├── StepIndicator.tsx
│   │   ├── Step1Destination.tsx
│   │   ├── Step2Budget.tsx
│   │   ├── Step3Interests.tsx
│   │   └── Step4Review.tsx
│   └── itinerary/                 # Itinerary display
│       ├── DayCard.tsx
│       ├── ActivityCard.tsx
│       ├── MealCard.tsx
│       ├── TransportSection.tsx
│       ├── CostBreakdown.tsx
│       ├── MapPlaceholder.tsx
│       └── ItinerarySkeleton.tsx
│
├── lib/
│   ├── ai/
│   │   ├── prompts.ts              # Modular prompt engineering system
│   │   ├── itinerary.service.ts    # AI provider abstraction (OpenAI / Mock)
│   │   └── mock-response.ts        # Realistic mock data for dev
│   ├── constants/index.ts          # App-wide constants (interests, styles, etc.)
│   ├── hooks/
│   │   ├── usePlannerNavigation.ts
│   │   └── useGenerateItinerary.ts
│   ├── schemas/
│   │   └── trip.schema.ts          # Zod validation schemas
│   ├── services/
│   │   ├── db.ts                   # Prisma singleton
│   │   └── trip.service.ts         # DB operations layer
│   ├── store/
│   │   └── planner.store.ts        # Zustand global state
│   └── utils/index.ts              # cn(), formatters, date helpers
│
├── prisma/
│   └── schema.prisma               # DB schema: Trip, Itinerary, Day, Activity, Meal, Transport
│
├── types/
│   └── index.ts                    # All TypeScript types
│
├── .env.example                    # Environment variable reference
└── README.md
```

---

## 🏗️ Architecture Decisions

### AI Provider Abstraction
The `lib/ai/itinerary.service.ts` exposes a single `generateItinerary(inputs)` function. Internally it checks for `OPENAI_API_KEY` and routes to either the real OpenAI provider or the mock provider. To add Anthropic or Gemini: implement the `AIProvider` interface and add a detection branch.

### Zustand + Persist
Planner state (form inputs + generated itinerary) persists to `localStorage` via `zustand/middleware`. This means users can close the tab mid-planning and return to where they left off.

### Zod Validation at the API Boundary
All inputs are validated at `/api/itinerary` using the Zod schema before reaching the AI layer. This prevents malformed prompts and provides clear error messages.

### Modular Prompt System
`lib/ai/prompts.ts` separates the system prompt (AI persona/rules) from the user prompt (trip-specific content). Each is independently testable and tunable.

### Prisma Service Layer
All DB logic lives in `lib/services/trip.service.ts`, not in API routes. Routes stay thin; business logic is portable.

---

## 🔌 Connecting Real Services

### OpenAI
Add `OPENAI_API_KEY` to `.env.local`. The app automatically switches from mock to real generation.

### Google Maps
1. Get an API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API
3. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`
4. Replace `MapPlaceholder` with real `<GoogleMap>` component from `@react-google-maps/api`

### PostgreSQL
Any Postgres instance works (local, Supabase, Neon, Railway):
```bash
DATABASE_URL="postgresql://..." npx prisma db push
```

---

## 🚢 Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Set the same environment variables in your Vercel project dashboard.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| State | Zustand + persist |
| Validation | Zod |
| Database | PostgreSQL + Prisma ORM |
| AI | OpenAI GPT-4o (with mock fallback) |
| Animations | CSS + Framer Motion ready |
| Deployment | Vercel |

---

## 🗺️ Roadmap (Post-MVP)

- [ ] Authentication (NextAuth.js)
- [ ] Save & share itineraries via URL
- [ ] Real Google Maps integration
- [ ] PDF export
- [ ] Itinerary editing (drag-and-drop)
- [ ] Multi-city trips
- [ ] Hotel recommendations
- [ ] Flight search integration
- [ ] Collaborative planning (real-time)
