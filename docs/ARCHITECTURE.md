# Architecture

Cognify is a Next.js 15 (App Router) application. The web app you can run today
is **fully functional client-side** — it persists to `localStorage` via a typed
reducer store — while shipping the complete backend contract (Prisma schema,
API surface, auth and infra) needed to run it as a multi-tenant SaaS.

## High-level diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                          Browser (PWA)                           │
│                                                                  │
│  Next.js App Router (RSC + Client Components)                    │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────────────┐    │
│  │ AppShell   │  │ Pages        │  │ StoreProvider          │    │
│  │ · sidebar  │  │ dashboard,   │  │ · useReducer + actions │    │
│  │ · ⌘K       │  │ review, ...  │  │ · localStorage persist │    │
│  │ · toasts   │  │              │  │ · FSRS + gamification  │    │
│  └────────────┘  └──────┬───────┘  └───────────┬───────────┘    │
│                         │                       │                │
│                         ▼                       ▼                │
│                 ┌───────────────┐      ┌────────────────┐        │
│                 │ /api/ai/chat  │      │ selectors.ts   │        │
│                 │ (streaming)   │      │ (derived data) │        │
│                 └───────┬───────┘      └────────────────┘        │
└─────────────────────────┼────────────────────────────────────────┘
                          │ (server, Node runtime)
              ┌───────────▼────────────┐
              │ AI provider router     │
              │ pickProvider()         │
              │  ├─ Anthropic (Claude) │
              │  ├─ OpenAI (GPT)       │
              │  ├─ Google (Gemini)    │
              │  ├─ Mistral            │
              │  ├─ DeepSeek           │
              │  └─ Offline engine ◄───┼── zero-config fallback
              └────────────────────────┘

  Production data plane (schema + infra provided):
  PostgreSQL (Prisma)  ·  Redis (sessions/queues/rate-limit)  ·  Meilisearch
  ·  S3/R2 (uploads)  ·  Stripe (billing)  ·  Auth.js (OAuth/2FA)
```

## Layers

### 1. Domain core (`src/lib/`)
Pure, framework-free, fully unit-tested TypeScript:

- **`fsrs.ts`** — the FSRS-4.5 spaced-repetition scheduler. Pure functions
  (`reviewCard`, `retrievability`, `nextIntervalDays`). See [FSRS.md](FSRS.md).
- **`gamification.ts`** — XP curve, levels, streak transitions, achievement
  definitions and evaluation.
- **`planner.ts`** — the AI study-plan generator (urgency × weakness weighting).
- **`selectors.ts`** — derived view models (due cards, mastery, forecast,
  global search, tutor context). Keeps components thin and logic testable.
- **`seed.ts`** — realistic demo content for first-run.

### 2. State store (`src/lib/store.tsx`)
A single `useReducer` context is the client-side source of truth. Every action
(`REVIEW_CARD`, `RECORD_ATTEMPT`, `ADD_NOTE`, …) is a pure transition that also:
- updates the relevant domain entity,
- logs to today's `DailyActivity`,
- awards XP/coins, advances the streak, and evaluates achievements.

State is serialized to `localStorage` on every change and rehydrated on load.
The reducer's action set maps 1:1 onto the REST contract in [API.md](API.md), so
swapping the persistence layer for the backend is mechanical.

### 3. AI layer (`src/lib/ai/` + `src/app/api/ai/`)
- **`providers.ts`** — a dependency-free streaming router. Each provider speaks
  its own SSE dialect (`streamAnthropic`, `streamOpenAICompatible`,
  `streamGoogle`) but exposes one `streamChat` contract.
- **`tutor-engine.ts`** — a deterministic, offline study assistant. It extracts
  definitions/keywords from the student's material to generate flashcards,
  quizzes and summaries, and recognises tutoring intents. This guarantees the
  product works with **no configuration**.
- **`/api/ai/chat`** streams tokens (live provider or simulated offline);
  **`/api/ai/generate`** returns structured flashcards/quiz/summary JSON.

### 4. UI (`src/components/` + `src/app/`)
- **Design system** — `ui.tsx`, `charts.tsx`, `markdown.tsx`, `theme.tsx`.
  Glassmorphism, dark/light theming via CSS variables, Framer Motion.
- **AppShell** — sidebar, top bar with global search, ⌘K command palette,
  achievement toasts, level/streak widget.
- **Pages** — one route per feature, each backed by the store.

## Data flow: a card review

1. User rates a card → page dispatches `REVIEW_CARD { id, rating }`.
2. Reducer calls `reviewCard(card.srs, rating, desiredRetention)` (pure FSRS).
3. Card's SRS state, history, and today's activity update; XP is awarded; the
   streak advances; achievements are re-evaluated.
4. Store persists to `localStorage`; any newly-unlocked achievement surfaces a
   toast via the shell.
5. `selectors.dueCards()` recomputes the queue for the next render.

## Why client-first?

It makes the entire product **demonstrable and testable with zero backend**,
while the included Prisma schema, API contract and Docker/CI config show exactly
how it scales to millions of users. The domain logic (the hard, correctness-
critical part) is identical in both worlds and is covered by the test suite.

## Scaling to production

Replace the localStorage store with API calls (same action shapes):
- **Reads** hit PostgreSQL via Prisma; hot paths (`cards due for user`) use the
  `@@index([userId, due])` composite index.
- **Sessions, rate limiting and job queues** use Redis.
- **Search** is offloaded to Meilisearch (semantic + typo-tolerant).
- **AI** streams from the provider router; responses can be cached in Redis by
  prompt hash.
- **Uploads** (PDFs, images, audio) go to S3/R2; OCR/extraction runs as a queued
  job feeding the same generation endpoints.
