# 🌍 Voyage AI — Production-Ready AI Travel Planner

> Plan smarter. Travel deeper.

A full-stack, startup-grade AI travel planning application. Generates complete, personalised day-by-day itineraries in under 30 seconds — with restaurants, activities, transport, budget tracking, and local hidden gems. Built to handle millions of users.

---

## 🚀 One-command deploy to Vercel

```bash
npx vercel --prod
```

Or click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/voyage-ai)

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Tech stack](#tech-stack)
3. [Local development](#local-development)
4. [Environment variables](#environment-variables)
5. [Database setup](#database-setup)
6. [Deploying to Vercel](#deploying-to-vercel)
7. [Monitoring & observability](#monitoring--observability)
8. [Security](#security)
9. [Performance](#performance)
10. [Scaling](#scaling)
11. [Roadmap](#roadmap)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VOYAGE AI                                │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Next.js 16  │    │  API Routes  │    │   AI Engine       │  │
│  │  App Router  │───▶│  /api/*      │───▶│   OpenAI GPT-4o   │  │
│  │  + Edge MW   │    │  Rate limited│    │   Parse+Validate  │  │
│  └─────────────┘    └──────────────┘    └──────────────────┘  │
│         │                  │                      │             │
│         ▼                  ▼                      ▼             │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Zustand    │    │  Prisma ORM  │    │   External APIs   │  │
│  │  State Mgmt │    │  PostgreSQL  │    │   Maps/Weather    │  │
│  └─────────────┘    └──────────────┘    └──────────────────┘  │
│         │                  │                                    │
│         ▼                  ▼                                    │
│  ┌─────────────┐    ┌──────────────┐                          │
│  │  LRU Cache  │    │  Monitoring  │                          │
│  │  (→ Redis)  │    │  Logger+Sentry│                         │
│  └─────────────┘    └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### Key architectural decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Framework | Next.js 16 App Router | Unified full-stack, RSC, Edge-ready |
| AI provider | OpenAI GPT-4o | Best JSON adherence, fast |
| State management | Zustand | Lightweight, no boilerplate, SSR-safe |
| Database | PostgreSQL + Prisma | Type-safe, scales to millions of rows |
| Caching | LRU (→ Redis) | Same interface, swap without changing callers |
| Rate limiting | Token bucket (→ Upstash) | Smoother than fixed window, Redis-swappable |
| Deployment | Vercel | Zero-config, edge network, analytics built-in |

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16 |
| Language | TypeScript | 5.x (strict) |
| Styling | Tailwind CSS | 4 |
| State | Zustand | 5 |
| Validation | Zod | 4 |
| ORM | Prisma | 7 |
| Database | PostgreSQL | 15+ |
| AI | OpenAI SDK | 4 |
| Maps | Google Maps JS API | Latest |
| Weather | Open-Meteo | Free tier |
| Analytics | Vercel Analytics | Latest |
| Performance | Vercel Speed Insights | Latest |

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- PostgreSQL 15+ (or a free cloud DB — see below)

### Quick start

```bash
# 1. Clone
git clone https://github.com/yourusername/voyage-ai
cd voyage-ai

# 2. Install dependencies
npm install

# 3. Environment
cp .env.example .env.local
# Edit .env.local — minimum required: DATABASE_URL
# Everything else is optional (mock fallbacks exist)

# 4. Database
npx prisma generate
npx prisma db push        # creates tables without migrations

# 5. Run dev server
npm run dev               # http://localhost:3000
```

### Without a database

The app works without a database — skip steps 4 and the `DATABASE_URL` env var. Itineraries are held in Zustand (session memory) only.

### Without an OpenAI key

The app automatically falls back to realistic **mock data**. Every UI feature works — the AI just returns pre-built sample itineraries instead of generating real ones. Perfect for UI development.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values.

### Required for production

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Neon, Supabase, Vercel Postgres |
| `OPENAI_API_KEY` | OpenAI API key | platform.openai.com |
| `NEXT_PUBLIC_APP_URL` | Your domain | Your Vercel deployment URL |

### Strongly recommended

| Variable | Description | Where to get it |
|---|---|---|
| `GOOGLE_API_KEY` | Server-side Google key (Places, Geocoding) | console.cloud.google.com |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side Google key (Maps JS) | Same, restrict to HTTP referrers |

### Optional upgrades

| Variable | Unlocks |
|---|---|
| `AMADEUS_API_KEY` + `AMADEUS_API_SECRET` | Real flight search |
| `SENTRY_DSN` | Error tracking + performance monitoring |
| `UPSTASH_REDIS_REST_URL` + `_TOKEN` | Multi-instance rate limiting |
| `OPENAI_MODEL=gpt-4o-mini` | 10x cheaper AI (less quality) |

---

## Database Setup

### Option A — Neon (recommended, free tier)

```bash
# 1. Create account at neon.tech
# 2. Create database → copy connection string
# 3. Add to .env.local:
DATABASE_URL="postgres://...@...pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 4. Apply schema
npx prisma db push
```

### Option B — Vercel Postgres

```bash
# In Vercel Dashboard: Storage → Create → Postgres
# Copy "Prisma" connection string
# Vercel auto-injects DATABASE_URL to your project

npx prisma db push
```

### Option C — Local Docker

```bash
docker run -d \
  --name voyage-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=voyage_ai \
  -p 5432:5432 \
  postgres:15-alpine

# .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/voyage_ai"

npx prisma db push
```

### Schema migrations in production

```bash
# Development (destructive — fine for dev)
npx prisma db push

# Production (non-destructive — use this)
npx prisma migrate deploy
```

---

## Deploying to Vercel

### First deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Production deployment
vercel --prod
```

### Environment variables on Vercel

Set these in **Vercel Dashboard → Settings → Environment Variables**:

```
OPENAI_API_KEY          → Production, Preview
DATABASE_URL            → Production, Preview
GOOGLE_API_KEY          → Production, Preview
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY → Production, Preview
NEXT_PUBLIC_APP_URL     → Production (your domain)
NODE_ENV                → production (auto-set by Vercel)
```

### Custom domain

```bash
vercel domains add yourdomain.com
vercel --prod
```

### Build command

Vercel uses `vercel-build` from package.json:
```bash
prisma generate && next build
```
This ensures the Prisma client is generated before the build.

### Function limits

Configured in `vercel.json`:
- AI routes: 120s timeout, 1024MB memory
- Chat: 60s, 512MB
- External APIs: 15s, 256MB

---

## Monitoring & Observability

### Automatic (zero config)

- **Vercel Analytics** — page views, bounce rate, top pages
- **Vercel Speed Insights** — Core Web Vitals (LCP, FID, CLS) per page
- **Health check** — `GET /api/health` returns JSON status (polled every 5min by Vercel cron)

### Structured logs

All server-side events emit JSON logs:

```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "info",
  "service": "voyage-ai",
  "event": "ai.generate.success",
  "env": "production",
  "context": {
    "destination": "Paris",
    "durationMs": 8420,
    "totalTokens": 3847,
    "estimatedCostUSD": 0.0421,
    "requestId": "abc123"
  }
}
```

**To ship logs to a service:**

| Service | Setup |
|---|---|
| Axiom | Connect Vercel log drain in Axiom dashboard |
| Datadog | Add Datadog Vercel integration |
| Logtail | Install `@logtail/next` + connect log drain |

### Error tracking with Sentry

```bash
# 1. Install
npm install @sentry/nextjs

# 2. Configure
npx @sentry/wizard@latest -i nextjs

# 3. Set env vars
SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="..."

# 4. Uncomment Sentry lines in lib/monitoring/index.ts
```

### Uptime monitoring

Point BetterStack, UptimeRobot, or Checkly at:
```
GET https://yourdomain.com/api/health
```
Expected response: `{ "status": "healthy" }`

---

## Security

### What's implemented

| Layer | Implementation |
|---|---|
| **Security headers** | CSP, X-Frame-Options, HSTS, Referrer-Policy (Edge middleware) |
| **Input sanitization** | Control char stripping, length limits, SSRF detection |
| **Prompt injection detection** | 10+ regex patterns on all user text inputs |
| **Rate limiting** | Token bucket per IP — 10 itinerary gen/hour, 60 places/min |
| **Bot blocking** | Known scanner UAs blocked at Edge |
| **API key isolation** | Server key (unrestricted) vs client key (referrer-restricted) |
| **Error sanitization** | Internal details never exposed in production 500 responses |
| **No sensitive logging** | API keys, passwords auto-redacted in all log output |
| **Prisma** | Parameterised queries only — SQL injection impossible |

### Upgrading rate limiting to Redis (multi-instance)

```bash
# 1. Create Upstash Redis at upstash.com
# 2. Install
npm install @upstash/ratelimit @upstash/redis

# 3. Set env vars
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# 4. Replace InProcessStore in lib/ratelimit/index.ts with Upstash client
```

### Google API key restrictions

**Server key** (`GOOGLE_API_KEY`):
- In Google Cloud Console → restrict to: `Maps JavaScript API`, `Places API`, `Geocoding API`
- IP restriction: your Vercel function IP ranges (or use API key per service)

**Client key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
- HTTP referrer restriction: `https://yourdomain.com/*` and `https://*.vercel.app/*`
- API restriction: `Maps JavaScript API` only

---

## Performance

### What's optimised

| Area | Implementation |
|---|---|
| **Bundle splitting** | `optimizePackageImports` for large deps |
| **Image formats** | AVIF + WebP with 7-day cache |
| **Static assets** | 1-year immutable cache via headers |
| **API no-cache** | `no-store` on all `/api/*` responses |
| **Itinerary cache** | 1-hour LRU cache (same inputs = instant response) |
| **Places cache** | 30-min LRU (repeated searches are free) |
| **Geocoding cache** | 24-hour LRU (coordinates never change) |
| **Weather cache** | 3-hour LRU |
| **console.log removed** | In production build via compiler |
| **External packages** | Prisma excluded from client bundle |

### Core Web Vitals targets

| Metric | Target | Strategy |
|---|---|---|
| LCP | < 2.5s | Static page generation, preconnect hints |
| FID/INP | < 100ms | No heavy main-thread work on load |
| CLS | < 0.1 | Skeleton placeholders for all async content |

### Bundle analysis

```bash
ANALYZE=true npm run build
```
Opens bundle visualiser to find large dependencies.

---

## npm Scripts

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server locally
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run type-check   # TypeScript strict check
npm run check        # type-check + lint (run before every PR)
npm run analyze      # Build with bundle analyser

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB (dev)
npm run db:migrate   # Apply migrations (production)
npm run db:studio    # Open Prisma Studio (visual DB editor)
```

---

## Scaling

### Current architecture handles

- **~1,000 concurrent users** on a single Vercel instance
- **Rate limiting** prevents AI cost runaway
- **LRU caching** means popular destinations serve instantly after first generation

### When you need to scale

| Scale trigger | Solution |
|---|---|
| Multiple server instances | Replace `InProcessStore` with Upstash Redis in `lib/ratelimit/` |
| Cache sharing across servers | Replace `LRUStore` with Redis in `lib/cache/lru.ts` |
| DB connection pooling | Use Neon's connection pooler or PgBouncer |
| AI cost control | Add `gpt-4o-mini` for non-premium users |
| Background AI jobs | Move generation to Vercel Background Functions or a queue |
| Millions of itineraries | Add DB archiving + S3 for old itinerary JSON |

### Adding authentication

The codebase has auth stubs throughout. To add NextAuth.js:

```bash
npm install next-auth @auth/prisma-adapter
```

Then:
1. Add `User` and `Account` models to Prisma schema
2. Add `userId` FK to `Trip` model
3. Create `app/api/auth/[...nextauth]/route.ts`
4. Gate `/planner` with `getServerSession()`

---

## Project Structure

```
voyage-ai/
├── app/
│   ├── api/
│   │   ├── chat/          ← SSE streaming chat
│   │   ├── gems/          ← Hidden gems discovery
│   │   ├── health/        ← Uptime + health check
│   │   ├── itinerary/     ← Main AI generation endpoint
│   │   ├── optimize/
│   │   │   ├── budget/    ← Budget optimization
│   │   │   └── route/     ← Route optimization
│   │   ├── places/        ← Google Places proxy
│   │   ├── replan/        ← AI replanning
│   │   └── weather/       ← Weather forecast
│   ├── itinerary/         ← Generated itinerary page
│   ├── planner/           ← 4-step planner form
│   ├── layout.tsx          ← Root layout + SEO + analytics
│   ├── page.tsx            ← Landing page + JSON-LD
│   ├── manifest.ts         ← PWA manifest
│   ├── robots.ts           ← robots.txt
│   └── sitemap.ts          ← XML sitemap
│
├── components/
│   ├── itinerary/          ← Day cards, activity/meal cards, map, weather
│   │   └── map/            ← Google Maps integration
│   ├── landing/            ← Hero, features, how-it-works, footer
│   ├── planner/            ← 4-step form components
│   ├── shared/             ← AppHeader, AppBackground, Accessibility
│   ├── ui/                 ← Button, Card, Badge, Input, Spinner
│   └── wow/                ← 5 "wow" AI feature components
│
├── lib/
│   ├── ai/
│   │   ├── engine/         ← Generator, parser, schema validator, prompts
│   │   ├── features/       ← Wow feature prompts + service
│   │   └── providers/      ← OpenAI provider, mock provider
│   ├── cache/              ← LRU cache (→ Redis interface)
│   ├── config/             ← Centralised env config
│   ├── errors/             ← Typed AppError hierarchy
│   ├── external/
│   │   ├── core/           ← HTTP client, retry, Result type
│   │   ├── flights/        ← Flight search (Amadeus-ready)
│   │   ├── maps/           ← Geocoding, Places, Maps loader
│   │   └── weather/        ← Open-Meteo adapter
│   ├── hooks/              ← useGenerateItinerary, useWeather, usePlaces, etc.
│   ├── logger/             ← Structured JSON logger
│   ├── monitoring/         ← Error capture, metrics, health check
│   ├── ratelimit/          ← Token bucket (→ Upstash interface)
│   ├── schemas/            ← Zod validation schemas
│   ├── security/           ← Sanitization, injection detection, headers
│   ├── services/           ← Prisma DB service layer
│   └── store/              ← Zustand stores (planner + wow features)
│
├── prisma/
│   └── schema.prisma       ← DB schema with all indexes
│
├── types/
│   └── index.ts            ← All TypeScript types
│
├── middleware.ts            ← Edge middleware (security headers, request ID)
├── next.config.ts           ← Production Next.js config
├── vercel.json              ← Vercel deployment config
└── .env.example             ← All environment variables documented
```

---

## Roadmap

### MVP (current)
- [x] AI itinerary generation (OpenAI GPT-4o)
- [x] 4-step planner form
- [x] Day-by-day itinerary display
- [x] Google Maps integration
- [x] Weather forecast (Open-Meteo)
- [x] Budget breakdown & cost tracking
- [x] AI Replanning (5 trigger types)
- [x] Budget optimizer
- [x] Route optimizer
- [x] Hidden gems discovery
- [x] AI chat assistant (streaming)
- [x] Production logging & monitoring
- [x] Security hardening
- [x] SEO + sitemap + PWA manifest

### Phase 2
- [ ] Authentication (NextAuth.js + magic link)
- [ ] Saved trips (per-user persistent storage)
- [ ] Shareable itinerary URLs
- [ ] PDF export
- [ ] Real flight search (Amadeus integration)
- [ ] Hotel recommendations

### Phase 3
- [ ] Collaborative planning (multiple users)
- [ ] Itinerary drag-and-drop editing
- [ ] Multi-city trips
- [ ] Offline mode (PWA + service worker)
- [ ] Mobile app (React Native / Expo)
- [ ] Enterprise/team plans
