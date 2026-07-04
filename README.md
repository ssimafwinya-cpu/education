<div align="center">

# 🧠 Cognify

### The AI learning platform — study smarter, remember everything.

AI tutoring · FSRS spaced repetition · smart notes · adaptive quizzes · exam mode · study planner · deep analytics · gamification — one connected ecosystem.

</div>

---

Cognify combines the best of **ChatGPT + Anki + Quizlet + Notion + Duolingo** into a single, beautiful, production-grade web app. It ships with a real **FSRS** spaced-repetition scheduler, a multi-provider AI layer (Claude, GPT, Gemini, Mistral, DeepSeek) with a genuinely useful **offline fallback**, and a fully interactive UI that works with zero configuration.

> **Try it in 30 seconds:** `npm install && npm run dev` → open http://localhost:3000. No API keys, no database, no sign-up required — the app is fully functional offline.

## ✨ Features

| Area | What you get |
| --- | --- |
| **AI Tutor** | Streaming chat, grounded in your own notes & decks, with subject context and conversation memory. Offline engine works with no API key. |
| **Flashcards** | Basic, cloze, MCQ and true/false cards. AI generation from any text. Real **FSRS-4.5** scheduling. |
| **Spaced Repetition** | Full FSRS memory model (stability + difficulty), learning/relearning steps, interval previews, review forecast. |
| **Notes** | Markdown editor with live preview, version history, auto-save, and one-click AI summarise / flashcard generation. |
| **Quizzes & Exams** | Auto-marked MCQ/short/fill/true-false. Timed exam mode with shuffling, leaderboard and answer review. |
| **Study Planner** | AI-generated, exam-aware weekly schedule that prioritises weak subjects and interleaves topics. |
| **Analytics** | Retention, accuracy, mastery-by-subject, review forecast, consistency heatmap, weak/strong topic detection. |
| **Gamification** | XP, levels, coins, streaks and 16 achievements with live unlock toasts. |
| **Design** | Glassmorphism, dark/light/system themes, Framer Motion animations, ⌘K command palette, fully responsive, WCAG-AA minded, PWA-ready. |

## 🚀 Quick start

```bash
# 1. Install
npm install

# 2. Run the dev server (works out of the box — no config needed)
npm run dev
# → http://localhost:3000
```

That's it. The app persists to your browser's `localStorage`, seeded with realistic demo content (Biology, Calculus, World History) so every feature is immediately explorable.

### Enable live AI (optional)

Copy `.env.example` to `.env` and add **any one** provider key:

```bash
cp .env.example .env
# then set e.g. ANTHROPIC_API_KEY=sk-ant-...
```

The AI router auto-detects configured providers (order controlled by `AI_DEFAULT_PROVIDER`). With no key set, the built-in offline tutor engine handles tutoring, flashcard/quiz generation and summaries.

## 🧱 Tech stack

- **Framework** — Next.js 15 (App Router) · React 19 · TypeScript (strict)
- **Styling** — Tailwind CSS · Framer Motion · custom glassmorphism design system
- **AI** — Provider-agnostic streaming router (Anthropic / OpenAI / Google / Mistral / DeepSeek) + offline heuristic engine
- **Data (production)** — PostgreSQL + Prisma · Redis · Meilisearch (schema & infra included)
- **Auth (production)** — Auth.js / NextAuth (Google, Apple, Microsoft, GitHub, email, magic links, 2FA) — see [`docs/SECURITY.md`](docs/SECURITY.md)
- **Testing** — Vitest (58 unit tests over the FSRS scheduler, gamification, planner and AI engine)
- **Deploy** — Docker + docker-compose · GitHub Actions CI · Vercel-ready

## 📜 Scripts

```bash
npm run dev         # start dev server
npm run build       # production build (standalone output)
npm start           # run the production server
npm run typecheck   # strict TypeScript check
npm run lint        # ESLint (next/core-web-vitals)
npm test            # run the unit test suite
npm run db:generate # generate the Prisma client
npm run db:migrate  # create & apply a migration
```

## 🐳 Run the full stack with Docker

```bash
docker compose up --build
```

Brings up the app + PostgreSQL + Redis + Meilisearch. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## 📚 Documentation

| Doc | Contents |
| --- | --- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design, data flow, the client store, AI routing |
| [`docs/API.md`](docs/API.md) | REST API surface (AI routes now, full CRUD contract for the backend) |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Tokens, components, theming, motion, accessibility |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Auth, encryption, rate limiting, OWASP mitigations, GDPR |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Docker, Vercel, environment, scaling, monitoring |
| [`docs/FSRS.md`](docs/FSRS.md) | How the spaced-repetition scheduler works |

## 🗂️ Project structure

```
src/
├─ app/
│  ├─ page.tsx              # landing page
│  ├─ login/                # auth experience
│  ├─ app/                  # authenticated app shell + all pages
│  │  ├─ page.tsx           # dashboard
│  │  ├─ courses/ notes/ flashcards/ review/
│  │  ├─ quizzes/ exams/ tutor/ planner/
│  │  ├─ analytics/ achievements/ settings/
│  └─ api/
│     ├─ ai/chat/           # streaming tutor endpoint
│     ├─ ai/generate/       # flashcard / quiz / summary generation
│     └─ health/            # health probe
├─ components/              # design-system + feature components
└─ lib/
   ├─ fsrs.ts               # FSRS spaced-repetition scheduler ★
   ├─ gamification.ts       # XP / levels / streaks / achievements
   ├─ planner.ts            # AI study-plan generator
   ├─ store.tsx             # client data store (reducer + persistence)
   ├─ selectors.ts          # derived view models
   ├─ seed.ts               # demo content
   └─ ai/                   # provider router + offline tutor engine
prisma/schema.prisma        # full production database schema
```

## 🧪 Testing

```bash
npm test
```

The suite covers the correctness-critical logic: the FSRS scheduler (retrievability, interval growth, learning steps, rating ordering), gamification (level curve inversion, streak transitions, achievement gating), the study planner, and the offline AI engine.

## 📄 License

MIT — build something great.
