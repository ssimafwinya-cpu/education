# Setup Guide — exactly what to do

This is the step-by-step for running Cognify yourself. There are two paths:
**A) just run the app** (zero setup, everything works), and **B) turn on the
optional extras** (live AI, database-backed accounts). Voice features need
nothing from you — they use your browser.

---

## A. Run the app (2 commands)

You need **Node.js 20+** installed. Then, in the project folder:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** → click **Open app**. That's it. The app is
seeded with example subjects and works fully offline, including:

- AI tutor (offline engine), flashcards + spaced repetition, quizzes/exams,
  planner, analytics, gamification
- **All the new voice & document features below** — no keys required.

> First run shows a 30-second onboarding wizard. You can Skip it.

---

## B. Optional upgrades

You only need these if you want the specific extra. Skip any you don't care about.

### B1. Live AI models (Claude / GPT / Gemini / …)

Without a key, the built-in offline engine handles tutoring and generation.
To use a real LLM instead:

```bash
cp .env.example .env
```

Open `.env` and set **one** key, e.g.:

```
ANTHROPIC_API_KEY=sk-ant-...        # or OPENAI_API_KEY / GOOGLE_AI_API_KEY / etc.
AI_DEFAULT_PROVIDER=anthropic
```

Restart `npm run dev`. The tutor now streams from that provider (and falls back
to offline if the call fails).

### B2. Accounts + cross-device sync (database)

Without this, your data lives in your browser (guest mode) — totally fine for
one device. To sync across devices you need a database.

**Easiest (Docker):**
```bash
docker compose up -d db          # starts PostgreSQL
cp .env.example .env             # if you haven't already
# make sure .env has:
# DATABASE_URL=postgresql://cognify:cognify@localhost:5432/cognify?schema=public
# AUTH_SECRET=<paste output of: openssl rand -base64 32>
npx prisma migrate deploy        # create the tables
npm run dev
```

Now go to **/login**, create an account with email + password, and your notes,
decks, reviews and progress sync automatically. Sign in on another device to
see the same data. (There's no database? The app silently uses a local JSON
file store instead, so accounts still work on a single machine.)

> Generate `AUTH_SECRET` with: `openssl rand -base64 32`

### B3. Everything at once (full stack)

```bash
docker compose up --build        # app + PostgreSQL + Redis + Meilisearch
```

---

## C. The voice & document features (nothing to configure)

These work in the browser as soon as the app is running. They use the Web
Speech APIs (built into Chrome, Edge, Safari). If a browser lacks them, the
buttons simply hide and typing/reading still works.

| Feature | Where | How |
| --- | --- | --- |
| **Oral quiz** (question read aloud → you answer → graded, with spoken feedback) | Any quiz → **Oral quiz — listen & answer** | Tap the speaker to re-hear; answer by **voice** (mic) or by typing. It grades instantly and speaks the result. |
| **Read documents aloud** | PDF page → **Listen**; Notes → **Listen** | Reads the extracted text / note with play-stop toggle. |
| **Deck podcast** | Any deck → **Podcast** | Plays every card as "question … pause … answer", auto-advancing. Great for commutes. |
| **Read a review card aloud** | Review session → speaker icon on the card | Front only until you flip; front + answer after. |
| **Voice question to the tutor** | AI Tutor → **mic** button | Speak instead of typing. |
| **Highlight → flashcard** | PDF page → select text in the extracted panel | A toolbar pops up: **Flashcard** (creates a card in the PDF's deck), **Explain** (asks the tutor), **Note** (saves the highlight), **speaker** (reads it). |

> **Mic permission:** the first time you use voice answering or the tutor mic,
> the browser asks to allow the microphone — click **Allow**.
>
> **Browser note:** speech recognition (voice answering) works best in Chrome
> and Edge. Text-to-speech works in all modern browsers. Everything has a
> typed/visual fallback, so nothing is ever blocked.

---

## Handy commands

```bash
npm run dev         # develop
npm run build       # production build
npm start           # run the production build
npm test            # 122 unit tests
npm run typecheck   # strict TypeScript
npm run lint        # ESLint
npm run db:studio   # browse the database (if using Postgres)
```
